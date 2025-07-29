# Editor Area Performance Refactoring

## Summary of Changes

### 1\. Performance Optimizations

**Problem**: Monaco editor keystrokes were extremely slow due to direct Zustand store updates on every keystroke.

**Solution**:

*   Created `useBufferSyncManager` hook that maintains local state and debounces store updates (500ms delay)
    
*   Minimized Zustand subscriptions by using specific selectors instead of broad store subscriptions
    
*   Separated Monaco editor logic into `CodeEditor` component with optimized re-rendering
    

### 2\. Content Architecture Refactoring

**Problem**: Mixed code and non-code content handling in a single editor component.

**Solution**:

*   Created `ContentRenderer` component that routes to appropriate content handler
    
*   Created `CodeEditor` for text/code files with Monaco
    
*   Created `ContentViewer` for images, videos, audio, PDFs, and binary files
    
*   Extended `BufferType` to include `video` and `audio` types
    

### 3\. Key Components Created

1.  `CodeEditor` (`code-editor.tsx`)
    
    *   High-performance Monaco editor with debounced sync
        
    *   LSP integration for TypeScript/JavaScript
        
    *   Keybindings and theme support
        
    *   Focus management
        
2.  `ContentViewer` (`content-viewer.tsx`)
    
    *   Image viewer with zoom/pan
        
    *   Video/audio players
        
    *   PDF viewer (iframe-based)
        
    *   Binary file info display
        
3.  `ContentRenderer` (`content-renderer.tsx`)
    
    *   Smart routing between CodeEditor and ContentViewer
        
    *   Based on buffer type and editability
        
4.  `useBufferSyncManager` (`hooks/useBufferSyncManager.ts`)
    
    *   Debounced sync to prevent store thrashing
        
    *   Local state management for editor content
        
    *   External change detection and sync
        
    *   Dirty state tracking
        

# Hello Heading

## H2 

### H3

```ts
const func = () => { console.log("Wow such codeblock")}
```

### 4\. Buffer Type System Extended

Extended `BufferType` to support:

*   `video`: MP4, AVI, MOV, WebM, etc.
    
*   `audio`: MP3, WAV, OGG, FLAC, etc.
    
*   Updated MIME type detection
    
*   Updated file extension mappings
    

### 5\. Performance Benefits

*   **Reduced Store Updates**: Editor changes are debounced (500ms) instead of immediate
    
*   **Minimal Re-renders**: Components only subscribe to specific data they need
    
*   **Local State**: Monaco editor maintains local content, syncing periodically
    
*   **External Sync**: Still supports external modifications (LLM agents, other splits)
    
*   **Memory Efficiency**: Better garbage collection with proper cleanup
    

### 6\. Future Extensibility

The new architecture makes it easy to add:

*   More content viewers (3D models, spreadsheets, etc.)
    
*   Custom editors for specific file types
    
*   Preview modes and split editing
    
*   Real-time collaboration features
    

## Usage

The refactored `EditorPane` now automatically:

1.  Uses `ContentRenderer` to choose appropriate component
    
2.  Provides focus management
    
3.  Handles both code and non-code content seamlessly
    

## Migration Notes

*   Existing `Editor` component is replaced by `CodeEditor`
    
*   `EditorPane` now uses `ContentRenderer`
    
*   Performance should be dramatically improved for typing
    
*   All existing functionality is preserved
    
*   Non-code files now have proper viewers instead of error states