import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import * as crypto from 'crypto';
import { IndexFlatIP } from 'faiss-node'; // Using Inner Product for Cosine Similarity
import fg from 'fast-glob';
import { pipeline, env } from '@xenova/transformers';
import { SearchResult, IndexStats, BuildIndexOptions } from './index-context';

// Configure transformers.js to use the models directory
env.localModelPath = path.join(process.cwd(), 'models');
env.allowRemoteModels = true; // Allow downloading models if not found locally

interface FileChunk {
  id: string;
  filePath: string;
  content: string;
  lineNumber: number;
  embedding?: number[] | Float32Array; // Support both for serialization and runtime
  modifiedTime: number;
}

interface IndexMetadata {
  chunks: FileChunk[];
  projectPath: string;
  lastUpdated: string; // Storing date as ISO string
  modelName: string;
}

// Singleton to manage the embedding pipeline
class EmbeddingPipeline {
  static task = 'feature-extraction' as const;
  static model = 'Xenova/bge-small-en-v1.5';
  static instance: any = null;

  static async getInstance(progress_callback?: Function) {
    if (this.instance === null) {
      this.instance = await pipeline(this.task, this.model, { progress_callback });
    }
    return this.instance;
  }
}

export class SmartIndexService {
  private index: IndexFlatIP | null = null;
  private metadata: IndexMetadata | null = null;
  private readonly embeddingDim = 384;
  private isIndexing = false;
  private shouldCancel = false;
  private chunkIndexMapping: number[] = []; // Maps FAISS index positions to chunk indices

  private readonly defaultIncludePatterns = [
    '**/*.{js,ts,jsx,tsx,mjs,cjs}',
    '**/*.{py,java,cpp,c,h,cs,php,rb,go,rs,swift,kt,scala,clj}',
    '**/*.{html,css,scss,less,json,yaml,yml,xml,md,txt,sql,sh}',
    '**/package.json', '**/README.md',
  ];

  private readonly defaultExcludePatterns = [
    '**/node_modules/**', '**/dist/**', '**/build/**', '**/out/**',
    '**/.git/**', '**/coverage/**', '**/target/**', '**/.vite/**',
    '**/*.min.js', '**/*.bundle.js', '**/*.map', '**/*lock.json', '**/pnpm-lock.yaml',
    '**/vendor/**', '**/third_party/**', '**/.next/**', '**/.nuxt/**',
  ];

  constructor() { }

  private getCachePath(projectPath: string): string {
    const projectName = path.basename(projectPath);
    const cacheDir = path.join(os.homedir(), '.vcode', 'index-cache', `${projectName}`);
    return path.join(cacheDir, 'index.json');
  }

  private async saveIndexToCache(): Promise<void> {
    if (!this.metadata) return;

    const cachePath = this.getCachePath(this.metadata.projectPath);
    try {
      await fs.mkdir(path.dirname(cachePath), { recursive: true });
      const serializedMetadata = {
        ...this.metadata,
        lastUpdated: new Date().toISOString(),
        chunks: this.metadata.chunks.map(chunk => ({
          ...chunk,
          embedding: chunk.embedding ? Array.from(chunk.embedding) : undefined,
        })),
      };
      await fs.writeFile(cachePath, JSON.stringify(serializedMetadata, null, 2));
      console.log(`Index saved to cache at ${cachePath}`);
    } catch (error) {
      console.error(`Failed to save index to cache: ${error}`);
    }
  }

  private async loadIndexFromCache(projectPath: string): Promise<boolean> {
    const cachePath = this.getCachePath(projectPath);
    try {
      const data = await fs.readFile(cachePath, 'utf-8');
      const parsed = JSON.parse(data) as IndexMetadata;

      if (parsed.modelName !== EmbeddingPipeline.model) {
        console.log('Model has changed. Rebuilding index from scratch.');
        await this.clearIndex(projectPath); // Clear old cache
        return false;
      }

      this.metadata = {
        ...parsed,
        lastUpdated: parsed.lastUpdated,
        chunks: parsed.chunks.map(chunk => ({
          ...chunk,
          embedding: chunk.embedding ? new Float32Array(chunk.embedding) : undefined,
        })),
      };

      await this.rebuildIndexFromMetadata();
      console.log(`Index loaded from cache. Found ${this.metadata?.chunks.length} chunks.`);
      return true;
    } catch (error) {
      // Expected error when cache doesn't exist yet - this is normal for the first run
      if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
        console.log('No cached index found. Will build from scratch.');
      } else {
        console.log('Could not load index from cache. Building from scratch.', error);
      }
      return false;
    }
  }

  private async generateEmbedding(text: string): Promise<Float32Array> {
    const extractor = await EmbeddingPipeline.getInstance();
    const result = await extractor(text, { pooling: 'mean', normalize: true });
    return result.data;
  }

  private calculateRelevanceScore(similarity: number): number {
    return Math.max(0, Math.min(1, similarity));
  }

  private async getFiles(
    dirPath: string,
    includePatterns: string[],
    excludePatterns: string[]
  ): Promise<string[]> {
    try {
      const files = await fg(includePatterns, {
        cwd: dirPath,
        ignore: excludePatterns,
        absolute: true,
        onlyFiles: true,
        followSymbolicLinks: false,
        suppressErrors: true,
      });
      console.log(`Found ${files.length} files to index.`);
      return files;
    } catch (error) {
      console.error('Error finding files with fast-glob:', error);
      throw new Error(`Failed to find files: ${error}`);
    }
  }

  private chunkContent(
    content: string,
    filePath: string,
    chunkSize: number,
    overlap: number
  ): { text: string; lineNumber: number }[] {
    const fileName = path.basename(filePath);

    if (fileName === 'package.json' || fileName.endsWith('.lock')) {
      return [{ text: content, lineNumber: 1 }];
    }

    if (fileName.endsWith('.json') && content.length < chunkSize * 1.5) {
      return [{ text: content, lineNumber: 1 }];
    }

    const lines = content.split('');
    const chunks: { text: string; lineNumber: number }[] = [];
    let currentChunkLines: string[] = [];
    let chunkStartLine = 1;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (
        currentChunkLines.join('').length + line.length > chunkSize &&
        currentChunkLines.length > 0
        ) {
        chunks.push({
          text: currentChunkLines.join(''), lineNumber: chunkStartLine });
        
        const overlapLineCount = currentChunkLines.length > 10 ? 5 : Math.floor(currentChunkLines.length / 2);
          currentChunkLines = currentChunkLines.slice(-overlapLineCount);
          chunkStartLine = i - overlapLineCount + 1;
        }
      
      if (currentChunkLines.length === 0) {
          chunkStartLine = i + 1;
        }
        currentChunkLines.push(line);
      }

      if (currentChunkLines.length > 0) {
        chunks.push({
          text: currentChunkLines.join(''), lineNumber: chunkStartLine });
    }

    return chunks;
      }

  private safeOnProgress(
        onProgress?: (progress: number, currentFile?: string, message?: string) => void,
        progress?: number,
        currentFile?: string,
        message?: string
      ): void {
    if (!onProgress) return;
    try {
      onProgress(progress || 0, currentFile, message);
    } catch (error) {
      console.warn('Failed to send progress update:', error instanceof Error ? error.message : 'Unknown error');
    }
  }

  private safeOnError(
    onError?: (error: string, filePath?: string) => void,
    error?: string,
    filePath?: string
  ): void {
    if (!onError) return;
    try {
      onError(error || 'Unknown error', filePath);
    } catch (err) {
      console.warn('Failed to send error update:', err instanceof Error ? err.message : 'Unknown error');
    }
  }

  public cancelIndexing(): void {
    this.shouldCancel = true;
  }

  public isIndexingInProgress(): boolean {
    return this.isIndexing;
  }

  async buildIndex(
    options: BuildIndexOptions,
    onProgress?: (progress: number, currentFile?: string, message?: string) => void,
    onError?: (error: string, filePath?: string) => void
  ): Promise<void> {
    if (this.isIndexing) {
      throw new Error('Indexing is already in progress.');
    }

    this.isIndexing = true;
    this.shouldCancel = false;

    try {
      this.safeOnProgress(onProgress, 0, undefined, 'Initializing embedding model...');
      await EmbeddingPipeline.getInstance((data: any) => {
        if (this.shouldCancel) return;
        if (data.status === 'progress') {
          this.safeOnProgress(onProgress, data.progress, data.file, `Downloading model...`);
        }
      });

      if (this.shouldCancel) throw new Error('Indexing cancelled during model download.');

      const { projectPath } = options;
      this.safeOnProgress(onProgress, 1, undefined, 'Checking for cached index...');
      const loadedFromCache = await this.loadIndexFromCache(projectPath);

      if (loadedFromCache) {
        await this.performIncrementalUpdate(options, onProgress, onError);
      } else {
        await this.performFullBuild(options, onProgress, onError);
      }

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error during indexing';
      this.safeOnError(onError, errorMsg);
      throw error; // Re-throw the error so it can be handled properly by the caller
    } finally {
      this.isIndexing = false;
      this.shouldCancel = false;
    }
  }

  private async performFullBuild(
    options: BuildIndexOptions,
    onProgress?: (progress: number, currentFile?: string, message?: string) => void,
    onError?: (error: string, filePath?: string) => void
  ): Promise<void> {
    this.safeOnProgress(onProgress, 5, undefined, 'Performing full index build...');
    const {
      projectPath,
      includePatterns = this.defaultIncludePatterns,
      excludePatterns = this.defaultExcludePatterns,
      chunkSize = 1024,
      chunkOverlap = 128,
    } = options;

    const files = await this.getFiles(projectPath, includePatterns, excludePatterns);
    if (files.length === 0) {
      throw new Error(`No files found for the given patterns in ${projectPath}`);
    }

    if (this.shouldCancel) throw new Error('Indexing cancelled during file discovery.');

    this.index = new IndexFlatIP(this.embeddingDim);
    this.metadata = {
      chunks: [],
      projectPath,
      lastUpdated: new Date().toISOString(),
      modelName: EmbeddingPipeline.model,
    };

    const totalFiles = files.length;
    for (let i = 0; i < totalFiles; i++) {
      const filePath = files[i];
      if (this.shouldCancel) throw new Error('Indexing cancelled.');

      const progress = 10 + (i / totalFiles) * 85;
      this.safeOnProgress(onProgress, progress, path.basename(filePath), `Processing ${path.basename(filePath)}`);

      await this.processFile(filePath, chunkSize, chunkOverlap, onError);
    }

    if (this.shouldCancel) throw new Error('Indexing cancelled.');

    if (this.metadata.chunks.length === 0) {
      throw new Error('No content could be processed for indexing.');
    }

    await this.rebuildIndexFromMetadata();
    await this.saveIndexToCache();
    this.safeOnProgress(onProgress, 100, undefined, `Index built successfully with ${this.metadata.chunks.length} chunks from ${totalFiles} files.`);
  }

  private async performIncrementalUpdate(
    options: BuildIndexOptions,
    onProgress?: (progress: number, currentFile?: string, message?: string) => void,
    onError?: (error: string, filePath?: string) => void
  ): Promise<void> {
    if (!this.metadata) throw new Error("Cannot perform incremental update without loaded metadata.");

    this.safeOnProgress(onProgress, 10, undefined, 'Scanning for file changes...');
    const { projectPath, includePatterns = this.defaultIncludePatterns, excludePatterns = this.defaultExcludePatterns, chunkSize = 1024, chunkOverlap = 128 } = options;

    const allFiles = await this.getFiles(projectPath, includePatterns, excludePatterns);
    const indexedFiles = new Map(this.metadata.chunks.map(c => [c.filePath, c.modifiedTime]));
    const filesToUpdate: string[] = [];
    const newFiles: string[] = [];

    for (const file of allFiles) {
      const stats = await fs.stat(file);
      const lastModified = stats.mtime.getTime();
      if (!indexedFiles.has(file)) {
        newFiles.push(file);
      } else if (lastModified > (indexedFiles.get(file) || 0)) {
        filesToUpdate.push(file);
      }
    }

    const filesToRemove = Array.from(indexedFiles.keys()).filter(f => !allFiles.includes(f));

    if (filesToUpdate.length === 0 && newFiles.length === 0 && filesToRemove.length === 0) {
      this.safeOnProgress(onProgress, 100, undefined, 'Index is up to date.');
      return;
    }

    this.safeOnProgress(onProgress, 20, undefined, `Found ${newFiles.length} new, ${filesToUpdate.length} modified, and ${filesToRemove.length} deleted files.`);

    // Remove deleted files
    for (const filePath of filesToRemove) {
      await this.removeFile(filePath, false); // Don't save cache yet
    }

    // Update modified files
    for (const filePath of filesToUpdate) {
      await this.updateFile(filePath, chunkSize, chunkOverlap, onError, false); // Don't save cache yet
    }

    // Add new files
    const totalNew = newFiles.length;
    for (let i = 0; i < totalNew; i++) {
      const filePath = newFiles[i];
      if (this.shouldCancel) throw new Error('Indexing cancelled.');
      const progress = 30 + (i / totalNew) * 65;
      this.safeOnProgress(onProgress, progress, path.basename(filePath), `Indexing new file: ${path.basename(filePath)}`);
      await this.processFile(filePath, chunkSize, chunkOverlap, onError);
    }

    await this.rebuildIndexFromMetadata();
    await this.saveIndexToCache();
    this.safeOnProgress(onProgress, 100, undefined, 'Incremental update complete.');
  }

  private async processFile(filePath: string, chunkSize: number, chunkOverlap: number, onError?: (error: string, filePath?: string) => void): Promise<void> {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      if (content.trim().length === 0) return;

      const stats = await fs.stat(filePath);
      const chunksData = this.chunkContent(content, filePath, chunkSize, chunkOverlap);
      if (chunksData.length === 0) return;

      const embeddings = await Promise.all(chunksData.map(c => this.generateEmbedding(c.text)));

      const newChunks: FileChunk[] = chunksData.map((chunk, i) => ({
        id: `${filePath}:${chunk.lineNumber}`,
        filePath,
        content: chunk.text,
        lineNumber: chunk.lineNumber,
        embedding: Array.from(embeddings[i]),
        modifiedTime: stats.mtime.getTime(),
      }));

      this.metadata?.chunks.push(...newChunks);
    } catch (error) {
      const errorMsg = `Error processing file ${filePath}: ${error}`;
      console.error(errorMsg);
      this.safeOnError(onError, errorMsg, filePath);
    }
  }

  async search(query: string, limit: number = 10): Promise<SearchResult[]> {
    if (!this.index || !this.metadata) {
      throw new Error('Index not built. Please build the index first.');
    }

    try {
      const queryEmbedding = await this.generateEmbedding(query);
      const actualLimit = Math.min(limit, this.index.ntotal());
      if (actualLimit === 0) return [];

      const results = this.index.search(Array.from(queryEmbedding), actualLimit);

      const searchResults: SearchResult[] = [];
      for (let i = 0; i < results.labels.length; i++) {
        const faissIndex = results.labels[i];
        const similarity = results.distances[i];

        // Use the mapping to get the correct chunk index
        if (faissIndex >= 0 && faissIndex < this.chunkIndexMapping.length) {
          const chunkIndex = this.chunkIndexMapping[faissIndex];
          if (chunkIndex >= 0 && chunkIndex < this.metadata.chunks.length) {
            const chunk = this.metadata.chunks[chunkIndex];
            searchResults.push({
              filePath: chunk.filePath,
              content: chunk.content,
              score: this.calculateRelevanceScore(similarity),
              lineNumber: chunk.lineNumber,
              snippet: this.createSnippet(chunk.content, query)
            });
          }
        }
      }

      return searchResults.sort((a, b) => b.score - a.score);
    } catch (error) {
      throw new Error(`Search failed: ${error}`);
    }
  }

  private createSnippet(content: string, query: string, maxLength: number = 250): string {
    if (content.length <= maxLength) return content;

    const queryLower = query.toLowerCase();
    const contentLower = content.toLowerCase();

    const index = contentLower.indexOf(queryLower);
    if (index !== -1) {
      const start = Math.max(0, index - Math.floor((maxLength - query.length) / 2));
      const end = Math.min(content.length, start + maxLength);
      let snippet = content.substring(start, end);
      if (start > 0) snippet = '...' + snippet;
      if (end < content.length) snippet = snippet + '...';
      return snippet;
    }

    return content.substring(0, maxLength) + '...';
  }

  getStatus(): { isBuilt: boolean; projectPath?: string; lastUpdated?: Date } {
    return {
      isBuilt: !!(this.index && this.metadata),
      projectPath: this.metadata?.projectPath,
      lastUpdated: this.metadata?.lastUpdated ? new Date(this.metadata.lastUpdated) : undefined
    };
  }

  getStats(): IndexStats | null {
    if (!this.metadata || !this.index) return null;
    return {
      totalFiles: new Set(this.metadata.chunks.map(c => c.filePath)).size,
      totalChunks: this.metadata.chunks.length,
      indexSize: this.index.ntotal(),
      lastUpdated: new Date(this.metadata.lastUpdated)
    };
  }

  async clearIndex(projectPath?: string): Promise<void> {
    // Use provided projectPath or get it from metadata
    const pathToClear = projectPath || this.metadata?.projectPath;
    
    this.index = null;
    this.metadata = null;
    this.chunkIndexMapping = [];
    
    if (pathToClear) {
      const cachePath = this.getCachePath(pathToClear);
      try {
        await fs.unlink(cachePath);
        console.log('Index cache cleared.');
      } catch (error) {
        if (error instanceof Error && 'code' in error && error.code !== 'ENOENT') {
          console.error(`Failed to clear index cache: ${error}`);
        }
        // Ignore ENOENT errors - file doesn't exist, which is fine
      }
    }
  }

  private async rebuildIndexFromMetadata(): Promise<void> {
    if (!this.metadata) {
      throw new Error("Cannot rebuild index without metadata.");
    }

    this.index = new IndexFlatIP(this.embeddingDim);
    const chunksWithEmbeddings = this.metadata.chunks
      .map((chunk, index) => ({ chunk, originalIndex: index }))
      .filter(({ chunk }) => chunk.embedding && chunk.embedding.length > 0);

    if (chunksWithEmbeddings.length === 0) {
      console.warn("No chunks with embeddings found to rebuild index.");
      this.chunkIndexMapping = [];
      return;
    }

    // Build the mapping from FAISS index to original chunk index
    this.chunkIndexMapping = chunksWithEmbeddings.map(({ originalIndex }) => originalIndex);

    const embeddingMatrix = new Float32Array(chunksWithEmbeddings.length * this.embeddingDim);
    chunksWithEmbeddings.forEach(({ chunk }, i) => {
      embeddingMatrix.set(chunk.embedding!, i * this.embeddingDim);
    });

    // Convert Float32Array to number array for FAISS compatibility
    this.index.add(Array.from(embeddingMatrix));
    this.metadata.lastUpdated = new Date().toISOString();
    console.log(`Index rebuilt with ${this.index.ntotal()} chunks.`);
  }

  async updateFile(filePath: string, chunkSize: number = 1024, chunkOverlap: number = 128, onError?: (error: string, filePath?: string) => void, save: boolean = true): Promise<void> {
    if (!this.metadata || !this.index) {
      throw new Error('Index not built. Cannot update file.');
    }

    this.metadata.chunks = this.metadata.chunks.filter(chunk => chunk.filePath !== filePath);

    await this.processFile(filePath, chunkSize, chunkOverlap, onError);

    await this.rebuildIndexFromMetadata();
    if (save) await this.saveIndexToCache();
  }

  async removeFile(filePath: string, save: boolean = true): Promise<void> {
    if (!this.metadata) {
      throw new Error('Index not built. Cannot remove file.');
    }
    const initialCount = this.metadata.chunks.length;
    this.metadata.chunks = this.metadata.chunks.filter(chunk => chunk.filePath !== filePath);

    if (initialCount > this.metadata.chunks.length) {
      await this.rebuildIndexFromMetadata();
      if (save) await this.saveIndexToCache();
    }
  }

  async rebuildIndex(options: BuildIndexOptions, onProgress?: (progress: number, currentFile?: string, message?: string) => void, onError?: (error: string, filePath?: string) => void): Promise<void> {
    if (this.isIndexing) {
      throw new Error('Indexing is already in progress. Cannot rebuild while indexing.');
    }
    
    await this.clearIndex(options.projectPath);
    await this.buildIndex(options, onProgress, onError);
  }
}