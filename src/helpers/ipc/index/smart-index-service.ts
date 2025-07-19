import * as fs from 'fs/promises';
import * as path from 'path';
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
  embedding?: Float32Array; // Embedding is now stored with the chunk
}

interface IndexMetadata {
  chunks: FileChunk[];
  projectPath: string;
  lastUpdated: Date;
  modelName: string;
}

// Singleton to manage the embedding pipeline
class EmbeddingPipeline {
  static task = 'feature-extraction' as const;
  static model = 'Xenova/all-MiniLM-L6-v2';
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
  private readonly embeddingDim = 384; // Dimension for all-MiniLM-L6-v2
  private isIndexing = false;
  private shouldCancel = false;

  // Default patterns for code files - expanded to be more comprehensive
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

  constructor() {
    // Initialization is handled by the EmbeddingPipeline singleton
  }

  private async generateEmbedding(text: string): Promise<Float32Array> {
    const extractor = await EmbeddingPipeline.getInstance();
    const result = await extractor(text, { pooling: 'mean', normalize: true });
    return result.data;
  }

  private calculateRelevanceScore(similarity: number): number {
    // For Inner Product (IP), a higher score is better. The raw score is meaningful.
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

    // For key files like package.json, treat the whole file as one chunk.
    // This provides maximum context for questions about project setup.
    if (fileName === 'package.json' || fileName.endsWith('.lock')) {
      return [{ text: content, lineNumber: 1 }];
    }
    
    // For other JSONs, if they are small enough, don't chunk.
    if (fileName.endsWith('.json') && content.length < chunkSize * 1.5) {
        return [{ text: content, lineNumber: 1 }];
    }

    // Basic text chunker based on lines. A more advanced strategy could use AST for code.
    const lines = content.split('\n');
    const chunks: { text: string; lineNumber: number }[] = [];
    let currentChunkLines: string[] = [];
    let chunkStartLine = 1;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (
        currentChunkLines.join('\n').length + line.length > chunkSize &&
        currentChunkLines.length > 0
      ) {
        chunks.push({ text: currentChunkLines.join('\n'), lineNumber: chunkStartLine });
        
        // Simple overlap: take the last few lines of the previous chunk.
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
      chunks.push({ text: currentChunkLines.join('\n'), lineNumber: chunkStartLine });
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

      this.safeOnProgress(onProgress, 5, undefined, 'Finding files to index...');
      const {
        projectPath,
        includePatterns = this.defaultIncludePatterns,
        excludePatterns = this.defaultExcludePatterns,
        chunkSize = 1024, // Increased for better context
        chunkOverlap = 128, // Increased for better context
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
        lastUpdated: new Date(),
        modelName: EmbeddingPipeline.model,
      };

      const totalFiles = files.length;
      let processedFiles = 0;

      for (const filePath of files) {
        if (this.shouldCancel) throw new Error('Indexing cancelled.');
        
        const progress = 10 + (processedFiles / totalFiles) * 85;
        this.safeOnProgress(onProgress, progress, path.basename(filePath), `Processing ${path.basename(filePath)}`);

        try {
          const content = await fs.readFile(filePath, 'utf-8');
          if (content.trim().length === 0) continue;

          const chunksData = this.chunkContent(content, filePath, chunkSize, chunkOverlap);
          if (chunksData.length === 0) continue;

          const chunks: FileChunk[] = chunksData.map(chunk => ({
            id: `${filePath}:${chunk.lineNumber}`,
            filePath,
            content: chunk.text,
            lineNumber: chunk.lineNumber,
          }));

          const embeddings = await Promise.all(chunks.map(c => this.generateEmbedding(c.content)));

          for(let i = 0; i < chunks.length; i++) {
            chunks[i].embedding = embeddings[i];
          }

          if (embeddings.length > 0) {
            const embeddingMatrix = new Float32Array(embeddings.length * this.embeddingDim);
            embeddings.forEach((emb, i) => embeddingMatrix.set(emb, i * this.embeddingDim));
            this.index.add(Array.from(embeddingMatrix));
            this.metadata.chunks.push(...chunks);
          }
        } catch (error) {
          const errorMsg = `Error processing file ${filePath}: ${error}`;
          console.error(errorMsg);
          this.safeOnError(onError, errorMsg, filePath);
        } finally {
          processedFiles++;
        }
      }

      if (this.shouldCancel) throw new Error('Indexing cancelled.');

      if (this.metadata.chunks.length === 0) {
        throw new Error('No content could be processed for indexing.');
      }

      this.metadata.lastUpdated = new Date();
      this.safeOnProgress(onProgress, 100, undefined, `Index built successfully with ${this.metadata.chunks.length} chunks from ${totalFiles} files.`);

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error during indexing';
      this.safeOnError(onError, errorMsg);
      // Don't re-throw, as it's handled by onError. Let the caller decide.
    } finally {
      this.isIndexing = false;
      this.shouldCancel = false;
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
        const chunkIndex = results.labels[i];
        const similarity = results.distances[i];

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

      return searchResults.sort((a, b) => b.score - a.score);
    } catch (error) {
      throw new Error(`Search failed: ${error}`);
    }
  }

  private createSnippet(content: string, query: string, maxLength: number = 250): string {
    // This is a simple implementation. A more advanced one could highlight matches.
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
    
    // If query not found verbatim, return the beginning of the content.
    return content.substring(0, maxLength) + '...';
  }

  getStatus(): { isBuilt: boolean; projectPath?: string; lastUpdated?: Date } {
    return {
      isBuilt: !!(this.index && this.metadata),
      projectPath: this.metadata?.projectPath,
      lastUpdated: this.metadata?.lastUpdated
    };
  }

  getStats(): IndexStats | null {
    if (!this.metadata || !this.index) return null;
    return {
      totalFiles: new Set(this.metadata.chunks.map(c => c.filePath)).size,
      totalChunks: this.metadata.chunks.length,
      indexSize: this.index.ntotal(),
      lastUpdated: this.metadata.lastUpdated
    };
  }

  async clearIndex(): Promise<void> {
    this.index = null;
    this.metadata = null;
  }

  private async rebuildIndexFromMetadata(): Promise<void> {
    if (!this.metadata) {
      throw new Error("Cannot rebuild index without metadata.");
    }
    
    this.index = new IndexFlatIP(this.embeddingDim);
    const chunksWithEmbeddings = this.metadata.chunks.filter(c => c.embedding);

    if (chunksWithEmbeddings.length === 0) {
      console.warn("No chunks with embeddings found to rebuild index.");
      return;
    }

    const embeddingMatrix = new Float32Array(chunksWithEmbeddings.length * this.embeddingDim);
    chunksWithEmbeddings.forEach((chunk, i) => {
      embeddingMatrix.set(chunk.embedding!, i * this.embeddingDim);
    });

    this.index.add(Array.from(embeddingMatrix));
    this.metadata.lastUpdated = new Date();
    console.log(`Index rebuilt with ${this.index.ntotal()} chunks.`);
  }

  async updateFile(filePath: string): Promise<void> {
    if (!this.metadata || !this.index) {
      throw new Error('Index not built. Cannot update file.');
    }
    
    // 1. Remove existing chunks for this file from metadata
    this.metadata.chunks = this.metadata.chunks.filter(chunk => chunk.filePath !== filePath);
    
    // 2. Read new content and create new chunks with embeddings
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      if (content.trim().length === 0) {
        console.log(`File ${filePath} is empty, removing from index.`);
      } else {
        const chunksData = this.chunkContent(content, filePath, 1024, 128);
        const newChunks: FileChunk[] = chunksData.map(chunk => ({
          id: `${filePath}:${chunk.lineNumber}`,
          filePath,
          content: chunk.text,
          lineNumber: chunk.lineNumber,
        }));

        if (newChunks.length > 0) {
          const embeddings = await Promise.all(newChunks.map(c => this.generateEmbedding(c.content)));
          newChunks.forEach((chunk, i) => chunk.embedding = embeddings[i]);
          this.metadata.chunks.push(...newChunks);
        }
      }
    } catch (error) {
      console.error(`Failed to read file for update ${filePath}: ${error}`);
      // File might have been deleted, which is fine.
    }

    // 3. Rebuild the entire index from the updated metadata
    await this.rebuildIndexFromMetadata();
  }

  async removeFile(filePath: string): Promise<void> {
    if (!this.metadata) {
      throw new Error('Index not built. Cannot remove file.');
    }
    const initialCount = this.metadata.chunks.length;
    this.metadata.chunks = this.metadata.chunks.filter(chunk => chunk.filePath !== filePath);
    
    if (initialCount > this.metadata.chunks.length) {
      await this.rebuildIndexFromMetadata();
    }
  }

  async rebuildIndex(options: BuildIndexOptions, onProgress?: (progress: number, currentFile?: string, message?: string) => void, onError?: (error: string, filePath?: string) => void): Promise<void> {
    await this.clearIndex();
    await this.buildIndex(options, onProgress, onError);
  }
}