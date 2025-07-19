# Smart Index Service

A semantic code indexing service for your IDE that uses FAISS and ONNX to build intelligent search capabilities.

## Features

- **Semantic Search**: Search your codebase using natural language queries
- **Fast Vector Search**: Uses FAISS for efficient similarity search
- **Neural Embeddings**: Leverages ONNX models to generate high-quality code embeddings
- **Incremental Updates**: Update individual files without rebuilding the entire index
- **Multiple File Types**: Supports all common programming languages and file formats
- **Real-time Progress**: Get live updates during index building

## Architecture

The service consists of several components:

1. **SmartIndexService**: Core service that handles ONNX model inference and FAISS indexing
2. **IPC Layer**: Electron IPC communication between main and renderer processes
3. **React Components**: UI components for managing and searching the index

## File Structure

```
src/helpers/ipc/index/
├── index-channels.ts       # IPC channel definitions
├── index-context.ts        # Renderer-side API exposure
├── index-listeners.ts      # Main process IPC handlers
└── smart-index-service.ts  # Core indexing service
```

## Usage

### Basic Usage

```typescript
// Build an index for the current project
await window.indexApi.buildIndex({
  projectPath: '/path/to/project',
  chunkSize: 500,
  chunkOverlap: 50
});

// Search the index
const results = await window.indexApi.search('function that handles user authentication', 10);

// Get index statistics
const stats = await window.indexApi.getStats();
console.log(`Index contains ${stats.totalFiles} files and ${stats.totalChunks} chunks`);
```

### Advanced Usage

```typescript
// Custom file patterns
await window.indexApi.buildIndex({
  projectPath: '/path/to/project',
  includePatterns: ['**/*.ts', '**/*.tsx', '**/*.js'],
  excludePatterns: ['**/node_modules/**', '**/dist/**'],
  chunkSize: 300,
  chunkOverlap: 30
});

// Listen for progress updates
window.indexApi.onProgress((data) => {
  console.log(`Progress: ${data.progress}% - ${data.message}`);
  if (data.currentFile) {
    console.log(`Processing: ${data.currentFile}`);
  }
});

// Handle errors
window.indexApi.onError((data) => {
  console.error(`Error: ${data.error}`);
  if (data.filePath) {
    console.error(`File: ${data.filePath}`);
  }
});
```

## API Reference

### `indexApi.buildIndex(options)`

Builds a semantic index for the specified project.

**Parameters:**
- `options.projectPath` (string): Path to the project root
- `options.includePatterns` (string[]): Glob patterns for files to include
- `options.excludePatterns` (string[]): Glob patterns for files to exclude
- `options.chunkSize` (number): Maximum size of text chunks (default: 500)
- `options.chunkOverlap` (number): Overlap between chunks (default: 50)

**Returns:** `Promise<{ success: boolean }>`

### `indexApi.search(query, limit?)`

Searches the index using semantic similarity.

**Parameters:**
- `query` (string): Natural language search query
- `limit` (number): Maximum number of results (default: 10)

**Returns:** `Promise<SearchResult[]>`

```typescript
interface SearchResult {
  filePath: string;      // Path to the file
  content: string;       // Full chunk content
  score: number;         // Similarity score (0-1)
  lineNumber?: number;   // Starting line number
  snippet?: string;      // Highlighted snippet
}
```

### `indexApi.getStats()`

Returns statistics about the current index.

**Returns:** `Promise<IndexStats | null>`

```typescript
interface IndexStats {
  totalFiles: number;    // Number of indexed files
  totalChunks: number;   // Number of text chunks
  indexSize: number;     // Number of vectors in FAISS index
  lastUpdated: Date;     // Last build time
}
```

### `indexApi.updateFile(filePath)`

Updates a specific file in the index.

**Parameters:**
- `filePath` (string): Path to the file to update

**Returns:** `Promise<{ success: boolean }>`

### `indexApi.removeFile(filePath)`

Removes a file from the index.

**Parameters:**
- `filePath` (string): Path to the file to remove

**Returns:** `Promise<{ success: boolean }>`

## Configuration

### Default Include Patterns

The service includes these file types by default:

- JavaScript/TypeScript: `**/*.js`, `**/*.ts`, `**/*.jsx`, `**/*.tsx`
- Python: `**/*.py`
- Java: `**/*.java`
- C/C++: `**/*.cpp`, `**/*.c`, `**/*.h`
- C#: `**/*.cs`
- Web: `**/*.html`, `**/*.css`, `**/*.scss`
- Config: `**/*.json`, `**/*.yaml`, `**/*.xml`
- Documentation: `**/*.md`, `**/*.txt`

### Default Exclude Patterns

- `**/node_modules/**`
- `**/dist/**`, `**/build/**`
- `**/.git/**`
- `**/coverage/**`
- `**/*.min.js`, `**/*.bundle.js`

## ONNX Model Requirements

The service expects an ONNX model at `models/model.onnx` relative to the app root. The model should:

1. Accept tokenized text input
2. Output embeddings (preferably 384-dimensional for efficiency)
3. Be compatible with sentence transformers architecture

Example compatible models:
- `sentence-transformers/all-MiniLM-L6-v2`
- `sentence-transformers/all-mpnet-base-v2`
- Custom fine-tuned models for code

## Performance Considerations

- **Index Building**: Can take several minutes for large projects
- **Memory Usage**: Approximately 1.5KB per text chunk
- **Search Speed**: Sub-second for most queries
- **Model Loading**: One-time cost during first use

## Troubleshooting

### Common Issues

1. **"ONNX model not found"**
   - Ensure `models/model.onnx` exists
   - Check file permissions

2. **"No files found matching patterns"**
   - Verify project path is correct
   - Check include/exclude patterns

3. **"Search failed"**
   - Ensure index is built first
   - Check that ONNX model is loaded

### Debug Logging

Enable debug logging in the main process:

```typescript
const service = new SmartIndexService();
// Add logging to track operations
```

## Future Enhancements

- Support for more embedding models
- Incremental indexing with file watchers
- Index persistence across app restarts
- Multi-language tokenization improvements
- Approximate search for very large codebases
