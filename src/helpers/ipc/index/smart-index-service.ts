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
  embedding?: Float32Array;
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
      this.instance = pipeline(this.task, this.model, { progress_callback });
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

  // Default patterns for code files
  private readonly defaultIncludePatterns = [
    '**/*.js', '**/*.ts', '**/*.jsx', '**/*.tsx',
    '**/*.py', '**/*.java', '**/*.cpp', '**/*.c', '**/*.h',
    '**/*.cs', '**/*.php', '**/*.rb', '**/*.go', '**/*.rs',
    '**/*.swift', '**/*.kt', '**/*.scala', '**/*.clj',
    '**/*.html', '**/*.css', '**/*.scss', '**/*.less',
    '**/*.json', '**/*.yaml', '**/*.yml', '**/*.xml',
    '**/*.md', '**/*.txt', '**/*.sql', '**/*.sh'
  ];
  
  private readonly defaultExcludePatterns = [
    '**/node_modules/**', '**/dist/**', '**/build/**',
    '**/.git/**', '**/coverage/**', '**/target/**',
    '**/*.min.js', '**/*.bundle.js', '**/*.map',
    '**/vendor/**', '**/third_party/**'
  ];

  constructor() {
    // Initialization is now handled by the EmbeddingPipeline singleton
  }

  private async generateEmbedding(text: string, progress_callback?: Function): Promise<Float32Array> {
    const extractor = await EmbeddingPipeline.getInstance(progress_callback);
    const result = await extractor(text, { pooling: 'mean', normalize: true });
    return result.data;
  }

  private calculateRelevanceScore(similarity: number): number {
    // Cosine similarity is already a good measure (0 to 1 for positive similarity)
    // We can scale it to a percentage if needed, but the raw score is meaningful.
    return Math.max(0, Math.min(1, similarity));
  }

  private async getFilesRecursively(
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
        suppressErrors: true
      });
      console.log(`Found ${files.length} files using fast-glob`);
      return files;
    } catch (error) {
      console.error('Error with fast-glob:', error);
      throw new Error(`Failed to find files: ${error}`);
    }
  }

  private chunkText(content: string, chunkSize: number = 500, overlap: number = 50): { text: string; lineNumber: number }[] {
    const lines = content.split('\n');
    const chunks: { text: string; lineNumber: number }[] = [];
    let currentChunk = '';
    let chunkStartLine = 1;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (currentChunk.length + line.length > chunkSize && currentChunk.length > 0) {
        chunks.push({ text: currentChunk, lineNumber: chunkStartLine });
        const overlapLines = currentChunk.split('\n').slice(-overlap);
        currentChunk = overlap > 0 ? overlapLines.join('\n') : '';
        chunkStartLine = Math.max(1, i - overlap + 1);
      }
      if (currentChunk.length === 0) {
        chunkStartLine = i + 1;
      }
      currentChunk += (currentChunk.length > 0 ? '\n' : '') + line;
    }
    if (currentChunk.length > 0) {
      chunks.push({ text: currentChunk, lineNumber: chunkStartLine });
    }
    return chunks;
  }

  // Helper function to add delays and prevent CPU overload
  private async sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Helper function to safely call onProgress with error handling
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
      // Silently ignore errors when sending progress updates
      // This prevents crashes when the window is destroyed
      console.warn('Failed to send progress update:', error instanceof Error ? error.message : 'Unknown error');
    }
  }

  // Helper function to safely call onError with error handling
  private safeOnError(
    onError?: (error: string, filePath?: string) => void,
    error?: string,
    filePath?: string
  ): void {
    if (!onError) return;
    try {
      onError(error || 'Unknown error', filePath);
    } catch (err) {
      // Silently ignore errors when sending error updates
      console.warn('Failed to send error update:', err instanceof Error ? err.message : 'Unknown error');
    }
  }

  // Method to cancel ongoing indexing
  public cancelIndexing(): void {
    this.shouldCancel = true;
  }

  async buildIndex(
    options: BuildIndexOptions,
    onProgress?: (progress: number, currentFile?: string, message?: string) => void,
    onError?: (error: string, filePath?: string) => void
  ): Promise<void> {
    if (this.isIndexing) {
      throw new Error('Indexing is already in progress. Please wait for it to complete or cancel it.');
    }

    this.isIndexing = true;
    this.shouldCancel = false;

    try {
      this.safeOnProgress(onProgress, 0, undefined, 'Initializing and downloading model...');
      
      await EmbeddingPipeline.getInstance((data: any) => {
        if (this.shouldCancel) return;
        if (data.status === 'progress') {
          const progress = data.progress.toFixed(2);
          this.safeOnProgress(onProgress, progress, data.file, `Downloading model...`);
        }
      });
      
      if (this.shouldCancel) {
        throw new Error('Indexing was cancelled during model initialization');
      }

      this.safeOnProgress(onProgress, 5, undefined, 'Model ready. Finding files...');

      const {
        projectPath,
        includePatterns = this.defaultIncludePatterns,
        excludePatterns = this.defaultExcludePatterns,
        chunkSize = 500,
        chunkOverlap = 50
      } = options;

      const files = await this.getFilesRecursively(projectPath, includePatterns, excludePatterns);
      if (files.length === 0) {
        throw new Error(`No files found for the given patterns in ${projectPath}`);
      }

      if (this.shouldCancel) {
        throw new Error('Indexing was cancelled during file discovery');
      }

      this.safeOnProgress(onProgress, 10, undefined, `Found ${files.length} files. Processing...`);

      const allChunks: FileChunk[] = [];
      for (let i = 0; i < files.length; i++) {
        if (this.shouldCancel) {
          throw new Error('Indexing was cancelled during file processing');
        }

        const filePath = files[i];
        const progress = 10 + (i / files.length) * 20; // Only 20% for file processing since it's fast
        this.safeOnProgress(onProgress, progress, filePath, `Processing ${path.basename(filePath)}...`);

        try {
          const content = await fs.readFile(filePath, 'utf-8');
          if (content.trim().length === 0) continue;

          const chunks = this.chunkText(content, chunkSize, chunkOverlap);
          for (const chunk of chunks) {
            if (chunk.text.trim().length === 0) continue;
            const chunkId = `${filePath}:${chunk.lineNumber}`;
            allChunks.push({ id: chunkId, filePath, content: chunk.text, lineNumber: chunk.lineNumber });
          }

          // Add a small delay every 10 files to prevent CPU overload
          if (i % 10 === 0 && i > 0) {
            await this.sleep(50); // 50ms break every 10 files
          }
        } catch (error) {
          const errorMsg = `Error processing file ${filePath}: ${error}`;
          console.error(errorMsg);
          this.safeOnError(onError, errorMsg, filePath);
        }
      }

      if (this.shouldCancel) {
        throw new Error('Indexing was cancelled');
      }

      if (allChunks.length === 0) {
        throw new Error('No content could be processed for indexing.');
      }

      this.safeOnProgress(onProgress, 30, undefined, `Found ${allChunks.length} text chunks. Generating embeddings (this will take a while)...`);
      const embeddings: Float32Array[] = [];
      const batchSize = 5; // Process 5 chunks at a time
      const delayBetweenBatches = 100; // 100ms delay between batches
      
      for (let i = 0; i < allChunks.length; i += batchSize) {
        if (this.shouldCancel) {
          throw new Error('Indexing was cancelled during embedding generation');
        }

        const batch = allChunks.slice(i, i + batchSize);
        // Give 60% of progress bar to embeddings (30% to 90%)
        const batchProgress = 30 + ((i / allChunks.length) * 60);
        
        this.safeOnProgress(onProgress, batchProgress, undefined, 
          `Generating embeddings... ${i + batch.length}/${allChunks.length} chunks (CPU-friendly mode)`);

        // Process batch
        for (const chunk of batch) {
          if (this.shouldCancel) {
            throw new Error('Indexing was cancelled during embedding generation');
          }
          const embedding = await this.generateEmbedding(chunk.content);
          embeddings.push(embedding);
        }

        // Add delay between batches to let CPU cool down
        if (i + batchSize < allChunks.length) {
          await this.sleep(delayBetweenBatches);
        }
      }

      if (this.shouldCancel) {
        throw new Error('Indexing was cancelled');
      }

      this.safeOnProgress(onProgress, 90, undefined, 'Building FAISS index...');
      this.index = new IndexFlatIP(this.embeddingDim);
      
      // Convert embeddings to the format expected by FAISS
      const embeddingMatrix = new Float32Array(embeddings.length * this.embeddingDim);
      for (let i = 0; i < embeddings.length; i++) {
        embeddingMatrix.set(embeddings[i], i * this.embeddingDim);
      }
      this.index.add(Array.from(embeddingMatrix));

      this.metadata = {
        chunks: allChunks,
        projectPath,
        lastUpdated: new Date(),
        modelName: EmbeddingPipeline.model
      };

      this.safeOnProgress(onProgress, 100, undefined, `Index built successfully with ${allChunks.length} chunks.`);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error during indexing';
      this.safeOnError(onError, errorMsg);
      throw error;
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

  private createSnippet(content: string, query: string, maxLength: number = 200): string {
    const queryWords = query.toLowerCase().split(/\s+/);
    const contentLower = content.toLowerCase();
    let bestPosition = 0;
    let maxMatches = 0;

    for (let i = 0; i <= content.length - maxLength; i += 50) {
      const slice = contentLower.slice(i, i + maxLength);
      const matches = queryWords.filter(word => slice.includes(word)).length;
      if (matches > maxMatches) {
        maxMatches = matches;
        bestPosition = i;
      }
    }

    let snippet = content.slice(bestPosition, bestPosition + maxLength);
    if (bestPosition > 0) snippet = '...' + snippet;
    if (bestPosition + maxLength < content.length) snippet = snippet + '...';
    return snippet;
  }

  getStatus(): { isBuilt: boolean; projectPath?: string; lastUpdated?: Date } {
    return {
      isBuilt: !!(this.index && this.metadata),
      projectPath: this.metadata?.projectPath,
      lastUpdated: this.metadata?.lastUpdated
    };
  }

  getStats(): IndexStats | null {
    if (!this.metadata || !this.index) {
      return null;
    }
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

  async updateFile(filePath: string): Promise<void> {
    if (!this.metadata || !this.index) {
      throw new Error('Index not built. Cannot update file.');
    }
    
    // Remove existing chunks for this file
    await this.removeFile(filePath);
    
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      if (content.trim().length === 0) {
        console.log(`File ${filePath} is empty, skipping re-indexing.`);
        return;
      }

      const chunks = this.chunkText(content);
      const newChunks: FileChunk[] = [];
      
      for (const chunk of chunks) {
        if (chunk.text.trim().length === 0) continue;
        const chunkId = `${filePath}:${chunk.lineNumber}`;
        newChunks.push({ id: chunkId, filePath, content: chunk.text, lineNumber: chunk.lineNumber });
      }

      if (newChunks.length === 0) {
        console.log(`File ${filePath} has no valid chunks after processing.`);
        return;
      }

      // Generate embeddings for new chunks with CPU-friendly delays
      const embeddings: Float32Array[] = [];
      for (let i = 0; i < newChunks.length; i++) {
        const chunk = newChunks[i];
        const embedding = await this.generateEmbedding(chunk.content);
        embeddings.push(embedding);
        
        // Add small delay every few chunks to prevent CPU overload
        if (i % 3 === 0 && i > 0) {
          await this.sleep(20); // Small delay for single file updates
        }
      }

      // Add new chunks to metadata
      this.metadata.chunks.push(...newChunks);
      
      // Create new index with all chunks (FAISS doesn't support efficient single-file updates)
      console.log(`File ${filePath} updated with ${newChunks.length} chunks. Full index rebuild required for optimal performance.`);
      
    } catch (error) {
      throw new Error(`Failed to update file ${filePath}: ${error}`);
    }
  }

  async removeFile(filePath: string): Promise<void> {
    if (!this.metadata) {
      throw new Error('Index not built. Cannot remove file.');
    }
    const initialCount = this.metadata.chunks.length;
    this.metadata.chunks = this.metadata.chunks.filter(chunk => chunk.filePath !== filePath);
    const removedCount = initialCount - this.metadata.chunks.length;
    console.log(`Removed ${removedCount} chunks for file ${filePath}. Full index rebuild recommended for optimal performance.`);
  }

  /**
   * Rebuilds the entire index. This is more efficient than individual file updates
   * when multiple files have changed.
   */
  async rebuildIndex(options: BuildIndexOptions, onProgress?: (progress: number, currentFile?: string, message?: string) => void, onError?: (error: string, filePath?: string) => void): Promise<void> {
    await this.clearIndex();
    await this.buildIndex(options, onProgress, onError);
  }
}
