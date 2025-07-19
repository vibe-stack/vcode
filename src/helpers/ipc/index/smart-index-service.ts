import * as fs from 'fs/promises';
import * as path from 'path';
import { IndexFlatL2 } from 'faiss-node';
import * as ort from 'onnxruntime-node';
import fg from 'fast-glob';
import { SearchResult, IndexStats, BuildIndexOptions } from './index-context';

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
  modelPath: string;
}

export class SmartIndexService {
  private index: IndexFlatL2 | null = null;
  private metadata: IndexMetadata | null = null;
  private session: ort.InferenceSession | null = null;
  private readonly modelPath: string;
  private readonly embeddingDim = 384; // Common dimension for sentence transformers
  
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
    // Get the model path relative to the app's root
    this.modelPath = path.join(process.cwd(), 'models', 'model.onnx');
  }

  private async initializeSession(): Promise<void> {
    if (!this.session) {
      try {
        this.session = await ort.InferenceSession.create(this.modelPath);
        console.log('ONNX model loaded successfully');
      } catch (error) {
        console.error('Failed to load ONNX model:', error);
        throw new Error(`Failed to load ONNX model: ${error}`);
      }
    }
  }

  private async generateEmbedding(text: string): Promise<Float32Array> {
    await this.initializeSession();
    
    if (!this.session) {
      throw new Error('ONNX session not initialized');
    }

    try {
      // Tokenize and prepare input (this is simplified - you may need proper tokenization)
      // For a proper implementation, you'd need to tokenize according to your model's requirements
      const inputIds = this.simpleTokenize(text);
      
      // Create attention mask (1 for all tokens, 0 for padding)
      const attentionMask = new Array(inputIds.length).fill(1);
      
      // Create token type ids (0 for all tokens in single sequence)
      const tokenTypeIds = new Array(inputIds.length).fill(0);
      
      const inputTensor = new ort.Tensor('int64', BigInt64Array.from(inputIds.map(BigInt)), [1, inputIds.length]);
      const attentionTensor = new ort.Tensor('int64', BigInt64Array.from(attentionMask.map(BigInt)), [1, attentionMask.length]);
      const tokenTypeTensor = new ort.Tensor('int64', BigInt64Array.from(tokenTypeIds.map(BigInt)), [1, tokenTypeIds.length]);
      
      // Try with token_type_ids first, fallback without if it fails
      try {
        let feeds: Record<string, any> = { 
          'input_ids': inputTensor,
          'attention_mask': attentionTensor,
          'token_type_ids': tokenTypeTensor
        };
        
        const results = await this.session.run(feeds);
        return this.extractEmbedding(results, inputIds.length);
      } catch (error) {
        console.log('Model does not support token_type_ids, trying without...');
        try {
          let feeds: Record<string, any> = { 
            'input_ids': inputTensor,
            'attention_mask': attentionTensor
          };
          const results = await this.session.run(feeds);
          return this.extractEmbedding(results, inputIds.length);
        } catch (fallbackError) {
          console.error('Both attempts failed:', error, fallbackError);
          throw fallbackError;
        }
      }
    } catch (error) {
      console.error('Error generating embedding:', error);
      throw error;
    }
  }

  private extractEmbedding(results: Record<string, any>, seqLen: number): Float32Array {
    // Extract embedding from model output (adjust based on your model's output format)
    const embedding = results['last_hidden_state'] || results['embeddings'] || Object.values(results)[0];
    
    if (embedding && embedding.data) {
      // Mean pooling over sequence dimension (simplified)
      const data = embedding.data as Float32Array;
      const embeddingDim = data.length / seqLen;
      
      const pooled = new Float32Array(embeddingDim);
      for (let i = 0; i < embeddingDim; i++) {
        let sum = 0;
        for (let j = 0; j < seqLen; j++) {
          sum += data[j * embeddingDim + i];
        }
        pooled[i] = sum / seqLen;
      }
      
      return pooled;
    }
    
    throw new Error('Invalid embedding output from model');
  }

  private calculateRelevanceScore(distance: number): number {
    // FAISS L2 distance to percentage relevance score
    // Typical L2 distances for embeddings range from 0 (identical) to ~2 (very different)
    // Convert to a more intuitive 0-100% scale
    
    if (distance <= 0.1) return 1.0;      // 100% - nearly identical
    if (distance <= 0.3) return 0.9;      // 90% - very similar
    if (distance <= 0.5) return 0.8;      // 80% - quite similar
    if (distance <= 0.7) return 0.7;      // 70% - moderately similar
    if (distance <= 0.9) return 0.6;      // 60% - somewhat similar
    if (distance <= 1.2) return 0.4;      // 40% - loosely related
    if (distance <= 1.5) return 0.2;      // 20% - distantly related
    
    return Math.max(0.01, 0.1 / (1 + distance)); // Minimum 1% for any match
  }

  private simpleTokenize(text: string): number[] {
    // Better tokenization for code and text
    // Split on word boundaries, camelCase, snake_case, and code symbols
    const tokens = text
      .toLowerCase()
      // Split camelCase: splitThis -> split This
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      // Split snake_case and kebab-case
      .replace(/[_-]/g, ' ')
      // Split on common code delimiters
      .replace(/[{}()[\]<>.,;:]/g, ' ')
      // Split on operators and other symbols
      .replace(/[=+\-*/&|!@#$%^]/g, ' ')
      // Multiple spaces to single space
      .replace(/\s+/g, ' ')
      .trim()
      .split(' ')
      .filter(token => token.length > 0);
    
    return tokens.map(token => {
      // Better hash function for more diverse vocabulary
      // Keep within BERT vocabulary range (0-30521)
      let hash = 5381;
      for (let i = 0; i < token.length; i++) {
        hash = ((hash << 5) + hash) + token.charCodeAt(i);
      }
      return Math.abs(hash) % 30000; // Stay well within BERT vocab range (30522)
    }).slice(0, 512); // Limit sequence length for performance
  }

  private async getFilesRecursively(
    dirPath: string,
    includePatterns: string[],
    excludePatterns: string[]
  ): Promise<string[]> {
    try {
      // Use fast-glob for proper glob pattern matching
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
    
    console.log(`Chunking content with ${lines.length} lines, chunkSize: ${chunkSize}, overlap: ${overlap}`);
    
    let currentChunk = '';
    let currentLineNumber = 1;
    let chunkStartLine = 1;
    let charCount = 0;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Skip empty lines but preserve structure context
      if (line.length === 0 && currentChunk.length > 0) {
        currentChunk += '\n';
        continue;
      }
      
      const lineWithContext = line;
      
      if (charCount + lineWithContext.length > chunkSize && currentChunk.length > 0) {
        // Try to break at logical boundaries (functions, classes, etc.)
        const trimmedChunk = currentChunk.trim();
        if (trimmedChunk.length > 0) {
          chunks.push({
            text: trimmedChunk,
            lineNumber: chunkStartLine
          });
        }
        
        // Handle overlap with more context awareness
        if (overlap > 0 && currentChunk.length > overlap) {
          const lines = currentChunk.split('\n');
          const overlapLines = lines.slice(-Math.max(2, Math.floor(lines.length * 0.2)));
          currentChunk = overlapLines.join('\n') + '\n' + lineWithContext;
          charCount = currentChunk.length;
        } else {
          currentChunk = lineWithContext;
          charCount = lineWithContext.length;
          chunkStartLine = i + 1;
        }
      } else {
        if (currentChunk.length === 0) {
          chunkStartLine = i + 1;
        }
        currentChunk += (currentChunk.length > 0 ? '\n' : '') + lineWithContext;
        charCount = currentChunk.length;
      }
      
      currentLineNumber = i + 1;
    }
    
    if (currentChunk.trim().length > 0) {
      chunks.push({
        text: currentChunk.trim(),
        lineNumber: chunkStartLine
      });
    }
    
    console.log(`Generated ${chunks.length} chunks from content`);
    return chunks;
  }

  async buildIndex(
    options: BuildIndexOptions,
    onProgress?: (progress: number, currentFile?: string, message?: string) => void,
    onError?: (error: string, filePath?: string) => void
  ): Promise<void> {
    try {
      onProgress?.(0, undefined, 'Initializing...');
      
      const {
        projectPath,
        includePatterns = this.defaultIncludePatterns,
        excludePatterns = this.defaultExcludePatterns,
        chunkSize = 500,
        chunkOverlap = 50
      } = options;
      
      // Validate project path exists
      try {
        const stats = await fs.stat(projectPath);
        if (!stats.isDirectory()) {
          throw new Error(`Project path is not a directory: ${projectPath}`);
        }
      } catch (error) {
        throw new Error(`Project path does not exist or is not accessible: ${projectPath}`);
      }
      
      // Get all relevant files
      onProgress?.(5, undefined, 'Finding files...');
      console.log('Searching for files with patterns:', { includePatterns, excludePatterns, projectPath });
      
      const files = await this.getFilesRecursively(projectPath, includePatterns, excludePatterns);
      
      console.log(`Found ${files.length} files:`, files.slice(0, 10)); // Log first 10 files
      
      if (files.length === 0) {
        // Let's try a more permissive search to see if there are any files at all
        const allFiles = await this.getFilesRecursively(projectPath, ['**/*'], []);
        console.log(`Total files in directory: ${allFiles.length}`);
        if (allFiles.length > 0) {
          console.log('Sample files found:', allFiles.slice(0, 10));
        }
        throw new Error(`No files found matching the specified patterns. Searched in: ${projectPath}`);
      }
      
      onProgress?.(10, undefined, `Found ${files.length} files. Processing...`);
      
      // Process files and create chunks
      const allChunks: FileChunk[] = [];
      const embeddings: Float32Array[] = [];
      
      for (let i = 0; i < files.length; i++) {
        const filePath = files[i];
        const progress = 10 + (i / files.length) * 80; // 10% to 90%
        
        try {
          onProgress?.(progress, filePath, `Processing ${path.basename(filePath)}...`);
          
          const content = await fs.readFile(filePath, 'utf-8');
          console.log(`File ${filePath} - Content length: ${content.length}`);
          
          if (content.trim().length === 0) {
            console.log(`Skipping empty file: ${filePath}`);
            continue;
          }
          
          const chunks = this.chunkText(content, chunkSize, chunkOverlap);
          console.log(`File ${filePath} - Generated ${chunks.length} chunks`);
          
          if (chunks.length === 0) {
            console.log(`No chunks generated for file: ${filePath}`);
            continue;
          }
          
          for (const chunk of chunks) {
            if (chunk.text.trim().length === 0) {
              console.log(`Skipping empty chunk in ${filePath}`);
              continue;
            }
            
            const chunkId = `${filePath}:${chunk.lineNumber}`;
            const embedding = await this.generateEmbedding(chunk.text);
            
            const fileChunk: FileChunk = {
              id: chunkId,
              filePath,
              content: chunk.text,
              lineNumber: chunk.lineNumber,
              embedding
            };
            
            allChunks.push(fileChunk);
            embeddings.push(embedding);
          }
        } catch (error) {
          const errorMsg = `Error processing file ${filePath}: ${error}`;
          console.error(errorMsg);
          onError?.(errorMsg, filePath);
        }
      }
      
      console.log(`Total chunks processed: ${allChunks.length}, Total embeddings: ${embeddings.length}`);
      
      if (embeddings.length === 0) {
        throw new Error('No content could be processed for indexing');
      }
      
      onProgress?.(90, undefined, 'Building FAISS index...');
      
      // Create FAISS index
      this.index = new IndexFlatL2(this.embeddingDim);
      
      // Add embeddings to index
      const embeddingMatrix = new Float32Array(embeddings.length * this.embeddingDim);
      for (let i = 0; i < embeddings.length; i++) {
        embeddingMatrix.set(embeddings[i], i * this.embeddingDim);
      }
      
      this.index.add(Array.from(embeddingMatrix));
      
      // Store metadata
      this.metadata = {
        chunks: allChunks.map(chunk => ({ ...chunk, embedding: undefined })), // Don't store embeddings in metadata
        projectPath,
        lastUpdated: new Date(),
        modelPath: this.modelPath
      };
      
      onProgress?.(100, undefined, `Index built successfully with ${allChunks.length} chunks`);
      
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error during indexing';
      onError?.(errorMsg);
      throw error;
    }
  }

  async search(query: string, limit: number = 10): Promise<SearchResult[]> {
    if (!this.index || !this.metadata) {
      throw new Error('Index not built. Please build the index first.');
    }
    
    try {
      // Generate embedding for query
      const queryEmbedding = await this.generateEmbedding(query);
      
      // Limit search results to available chunks
      const actualLimit = Math.min(limit, this.index.ntotal());
      
      if (actualLimit === 0) {
        return [];
      }
      
      // Search in FAISS index
      const results = this.index.search(Array.from(queryEmbedding), actualLimit);
      
      const searchResults: SearchResult[] = [];
      
      for (let i = 0; i < results.labels.length; i++) {
        const chunkIndex = results.labels[i];
        const score = results.distances[i];
        
        if (chunkIndex >= 0 && chunkIndex < this.metadata.chunks.length) {
          const chunk = this.metadata.chunks[chunkIndex];
          
          searchResults.push({
            filePath: chunk.filePath,
            content: chunk.content,
            score: this.calculateRelevanceScore(score), // Better scoring function
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
    
    // Find the best position to start the snippet
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
    // Note: FAISS doesn't have a direct clear method, so we set to null
  }

  async updateFile(filePath: string): Promise<void> {
    if (!this.metadata) {
      throw new Error('Index not built. Cannot update file.');
    }
    
    // Remove existing chunks for this file
    await this.removeFile(filePath);
    
    // Add new chunks for this file
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const chunks = this.chunkText(content);
      
      // This is a simplified version - in practice, you'd want to rebuild the entire index
      // or use a more sophisticated approach to update individual files
      console.log(`File ${filePath} would be re-indexed with ${chunks.length} chunks`);
    } catch (error) {
      throw new Error(`Failed to update file ${filePath}: ${error}`);
    }
  }

  async removeFile(filePath: string): Promise<void> {
    if (!this.metadata) {
      throw new Error('Index not built. Cannot remove file.');
    }
    
    // Remove chunks for this file from metadata
    this.metadata.chunks = this.metadata.chunks.filter(chunk => chunk.filePath !== filePath);
    
    // Note: FAISS doesn't support removing individual vectors efficiently
    // In practice, you'd need to rebuild the index
    console.log(`File ${filePath} removed from index metadata`);
  }
}
