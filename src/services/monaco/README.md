# Enhanced Monaco Editor with VSCode API Integration

This module provides a powerful Monaco Editor integration using the `@codingame/monaco-vscode-api` library, which brings full VSCode functionality to your Monaco editor instances.

## Features

✨ **Full VSCode Service Integration**
- Theme service with VSCode themes
- Configuration service with settings.json support
- Files service with virtual filesystem
- Languages service with enhanced language features
- Keybindings service for VSCode-like shortcuts
- Quick access service (Command Palette - F1/Ctrl+Shift+P)
- Search service for enhanced search capabilities
- Extensions service for VSCode extension support
- Textmate service for syntax highlighting

✨ **Enhanced Editor Capabilities**
- File system integration with `createModelReference`
- Automatic model disposal and cleanup
- Multiple editor instance management
- Cursor position and scroll state persistence
- Dirty state tracking and file saving
- Theme switching
- Language detection and switching

✨ **React Integration**
- Custom React hook `useMonacoEditor`
- Component examples with advanced features
- TypeScript support throughout

## Installation

The required packages should already be installed in your project:

```bash
npm install @codingame/monaco-vscode-api
npm install @codingame/monaco-vscode-base-service-override
npm install @codingame/monaco-vscode-host-service-override
npm install @codingame/monaco-vscode-extensions-service-override
npm install @codingame/monaco-vscode-files-service-override
npm install @codingame/monaco-vscode-quickaccess-service-override
npm install @codingame/monaco-vscode-theme-service-override
npm install @codingame/monaco-vscode-configuration-service-override
npm install @codingame/monaco-vscode-keybindings-service-override
npm install @codingame/monaco-vscode-languages-service-override
npm install @codingame/monaco-vscode-textmate-service-override
npm install @codingame/monaco-vscode-search-service-override
npm install @codingame/monaco-vscode-editor-service-override
```

## Basic Usage

### 1. Using the Registry Directly

```typescript
import { monacoEditorRegistry } from './services/monaco';

// Create an editor with basic functionality
const editor = await monacoEditorRegistry.createEditor(
    'my-buffer-id',
    document.getElementById('container'),
    {
        theme: 'vs-dark',
        language: 'typescript'
    },
    'console.log("Hello World");',
    'typescript'
);

// Create an editor with file system integration
const editorWithFile = await monacoEditorRegistry.createEditorWithFile(
    'file-buffer-id',
    document.getElementById('container'),
    '/virtual/example.ts',
    'console.log("Hello from file");',
    'typescript'
);

// Get editor instance
const editor = monacoEditorRegistry.getEditorByBuffer('my-buffer-id');

// Update content
monacoEditorRegistry.setEditorValue('my-buffer-id', 'new content');

// Save file (for editors created with file system integration)
await monacoEditorRegistry.saveFile('file-buffer-id');

// Check if file has unsaved changes
const isDirty = monacoEditorRegistry.isFileDirty('file-buffer-id');

// Dispose editor
monacoEditorRegistry.disposeEditor('my-buffer-id');
```

### 2. Using the React Hook

```typescript
import { useMonacoEditor } from './services/monaco';

function MyEditor({ bufferId }: { bufferId: string }) {
    const {
        editor,
        registry,
        getEditor,
        focusEditor,
        getValue,
        setValue,
        getCursorPosition,
        setCursorPosition,
        initializeServices,
        isInitialized
    } = useMonacoEditor(bufferId);

    useEffect(() => {
        if (!isInitialized()) {
            initializeServices();
        }
    }, []);

    // Your component logic here
}
```

### 3. Using the React Component

```typescript
import { MonacoEditorComponent } from './services/monaco/MonacoEditorComponent';

function App() {
    const [content, setContent] = useState('console.log("Hello");');

    return (
        <MonacoEditorComponent
            bufferId="main-editor"
            content={content}
            language="typescript"
            filePath="/virtual/main.ts"
            theme="vs-dark"
            onContentChange={setContent}
            onCursorPositionChange={(pos) => console.log('Cursor:', pos)}
            settings={{
                editor: {
                    fontSize: 16,
                    minimap: { enabled: true },
                    wordWrap: 'on'
                }
            }}
        />
    );
}
```
    <button onClick={focusEditor}>
      Focus Editor
    </button>
  );
}
```

## Advanced Features

### VSCode Settings Configuration

```typescript
import { applyVSCodeSettings, createMinimalSettings } from './services/monaco/vscode-config';

// Apply custom settings
applyVSCodeSettings({
    editor: {
        fontSize: 16,
        fontFamily: 'Fira Code, Monaco, monospace',
        theme: 'vs-dark',
        minimap: { enabled: true },
        wordWrap: 'on',
        lineNumbers: 'on',
        bracketPairColorization: { enabled: true }
    },
    workbench: {
        colorTheme: 'Dark+'
    }
});

// Or use minimal settings with overrides
const settings = createMinimalSettings({
    editor: {
        fontSize: 18,
        theme: 'hc-black'
    }
});
applyVSCodeSettings(settings);
```

### File System Integration

```typescript
import { RegisteredFileSystemProvider, RegisteredMemoryFile, registerFileSystemOverlay } from '@codingame/monaco-vscode-files-service-override';
import { monaco } from './services/monaco';

// Create a virtual file system
const fileSystemProvider = new RegisteredFileSystemProvider(false);
const fileUri = monaco.Uri.file('/virtual/myfile.ts');
const fileContent = 'console.log("Virtual file content");';

fileSystemProvider.registerFile(new RegisteredMemoryFile(fileUri, fileContent));
const overlayDisposable = registerFileSystemOverlay(1, fileSystemProvider);

// Create model reference for the file
const modelRef = await monaco.editor.createModelReference(fileUri);
const editor = monaco.editor.create(container, {
    model: modelRef.object.textEditorModel
});

// Save the file
await modelRef.object.save();

// Clean up
modelRef.dispose();
overlayDisposable.dispose();
```

### Multiple Editors with Enhanced Features

```typescript
// Create multiple editors with different configurations
const editors = await Promise.all([
    monacoEditorRegistry.createEditorWithFile(
        'editor-1',
        container1,
        '/virtual/file1.ts',
        'TypeScript content',
        'typescript'
    ),
    monacoEditorRegistry.createEditorWithFile(
        'editor-2',
        container2,
        '/virtual/file2.js',
        'JavaScript content',
        'javascript'
    ),
    monacoEditorRegistry.createEditorWithFile(
        'editor-3',
        container3,
        '/virtual/file3.py',
        'Python content',
        'python'
    )
]);

// Switch between editors
monacoEditorRegistry.focusEditor('editor-2');

// Get all editors
const allEditors = monacoEditorRegistry.getAllEditors();
console.log(\`Total editors: \${allEditors.length}\`);
```

## VSCode Features Available

### Command Palette
Press `F1` or `Ctrl+Shift+P` (Windows/Linux) / `Cmd+Shift+P` (Mac) to open the command palette with all available commands.

### Quick Access
- **Quick Open**: `Ctrl+P` / `Cmd+P`
- **Go to Line**: `Ctrl+G` / `Cmd+G`
- **Go to Symbol**: `Ctrl+Shift+O` / `Cmd+Shift+O`

### Keybindings
All standard VSCode keybindings are available:
- `Ctrl+S` / `Cmd+S`: Save
- `Ctrl+Z` / `Cmd+Z`: Undo
- `Ctrl+Y` / `Cmd+Y`: Redo
- `Ctrl+F` / `Cmd+F`: Find
- `Ctrl+H` / `Cmd+H`: Replace
- And many more...

### File Operations
- Save files with `Ctrl+S` / `Cmd+S`
- Track dirty state automatically
- Virtual file system support

### Language Features
- Syntax highlighting with TextMate grammars
- IntelliSense and autocompletion
- Error squiggles and diagnostics
- Code folding
- Bracket matching
- Semantic highlighting
- And more depending on language support

## Migration from Basic Monaco

If you're migrating from a basic Monaco setup:

### Before (Basic Monaco)
```typescript
import * as monaco from 'monaco-editor';

const editor = monaco.editor.create(container, {
    value: 'console.log("hello");',
    language: 'typescript',
    theme: 'vs-dark'
});
```

### After (Enhanced with VSCode API)
```typescript
import { monacoEditorRegistry } from './services/monaco';

// Initialize services and create editor
await monacoEditorRegistry.createEditor(
    'buffer-id',
    container,
    { theme: 'vs-dark' },
    'console.log("hello");',
    'typescript'
);
```

## API Reference

### MonacoEditorRegistry Methods

- `createEditor(bufferId, container, options?, content?, language?, filePath?)`: Create a new editor
- `createEditorWithFile(bufferId, container, filePath, content, language?, options?)`: Create editor with file system integration
- `getEditor(editorId)`: Get editor by ID
- `getEditorByBuffer(bufferId)`: Get editor by buffer ID
- `disposeEditor(bufferId)`: Dispose a specific editor
- `disposeAllEditors()`: Dispose all editors
- `focusEditor(bufferId)`: Focus an editor
- `updateEditorModel(bufferId, content, language?, uri?)`: Update editor model
- `getEditorValue(bufferId)`: Get editor content
- `setEditorValue(bufferId, value)`: Set editor content
- `updateFileContent(bufferId, content)`: Update file content
- `saveFile(bufferId)`: Save file (for file-integrated editors)
- `isFileDirty(bufferId)`: Check if file has unsaved changes
- `getFileUri(bufferId)`: Get file URI
- `getAvailableLanguages()`: Get supported languages
- `setTheme(theme)`: Set editor theme
- `getAvailableThemes()`: Get available themes

### VSCode Configuration

See `vscode-config.ts` for comprehensive configuration options including:
- Editor settings (fonts, themes, behavior)
- Workbench settings (UI layout, themes)
- File settings (encoding, auto-save)
- Search settings
- And much more...

## Examples

See `MonacoEditorComponent.tsx` for comprehensive examples including:
- Basic editor component
- Advanced editor with toolbar
- Multi-editor split view
- File system integration
- Settings management
- Event handling

## Troubleshooting

### Services Not Initialized
Make sure to call the initialization before creating editors (this is handled automatically in `createEditor`).

### Memory Leaks
Always dispose editors when they're no longer needed:

```typescript
// Dispose single editor
monacoEditorRegistry.disposeEditor('buffer-id');

// Dispose all editors
monacoEditorRegistry.disposeAllEditors();
```

### Theme Not Applying
Ensure the theme service is initialized and apply settings:

```typescript
import { applyVSCodeSettings } from './services/monaco/vscode-config';

applyVSCodeSettings({
    workbench: {
        colorTheme: 'Dark+'
    }
});
```

This enhanced Monaco integration provides a much more powerful and feature-rich editing experience compared to the basic Monaco editor, bringing the full power of VSCode to your application!
