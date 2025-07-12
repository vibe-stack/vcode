# Keymap System Documentation

A comprehensive keyboard shortcut system for the Grok IDE that provides:

- **Platform-aware key bindings** (automatically detects macOS vs Windows/Linux)
- **Contextual shortcuts** (different shortcuts for editor, explorer, terminal, etc.)
- **Multiple profiles** (Default, VSCode-like, Vim-like, etc.)
- **Extensible command system** 
- **React hooks for integration**

## Quick Start

### 1. Wrap your app with the keymap provider

```tsx
import { GlobalKeymapProvider } from '@/services/keymaps/main';

function App() {
  return (
    <GlobalKeymapProvider>
      <YourApp />
    </GlobalKeymapProvider>
  );
}
```

⚠️ **Important**: The keymap system includes safety checks to prevent intercepting critical browser shortcuts like `Cmd+R` (refresh) and `Cmd+Q` (quit). **The `Cmd+W` shortcut is always intercepted to prevent accidentally closing the browser tab/window** - it will close editor tabs when available, or do nothing if no tabs are open.

### 2. Use context-specific providers

```tsx
import { EditorKeymapProvider } from '@/services/keymaps/main';

function EditorArea() {
  return (
    <EditorKeymapProvider>
      <YourEditor />
    </EditorKeymapProvider>
  );
}
```

### 3. Access keymap functionality

```tsx
import { useKeymap, useKeymapProfiles } from '@/services/keymaps/main';

function MyComponent() {
  const { handleKeyEvent } = useKeymap();
  const { profiles, activeProfile, setActiveProfile } = useKeymapProfiles();
  
  // Your component logic
}
```

## Default Key Bindings

### File Operations
- `Cmd/Ctrl + N` - New file
- `Cmd/Ctrl + O` - Open file
- `Cmd/Ctrl + S` - Save file
- `Cmd/Ctrl + Shift + S` - Save as
- `Cmd/Ctrl + W` - Close tab
- `Cmd/Ctrl + Shift + W` - Close all tabs

### Edit Operations
- `Cmd/Ctrl + Z` - Undo
- `Cmd/Ctrl + Y` (Windows) / `Cmd + Shift + Z` (Mac) - Redo
- `Cmd/Ctrl + X` - Cut
- `Cmd/Ctrl + C` - Copy
- `Cmd/Ctrl + V` - Paste
- `Cmd/Ctrl + A` - Select all
- `Cmd/Ctrl + F` - Find
- `Cmd/Ctrl + H` - Find and replace

### Navigation
- `Cmd/Ctrl + Tab` - Next tab
- `Cmd/Ctrl + Shift + Tab` - Previous tab
- `Cmd/Ctrl + G` - Go to line
- `Cmd/Ctrl + P` - Go to file
- `Cmd/Ctrl + 1-9` - Go to tab by number
- `Cmd/Ctrl + 0` - Go to last tab

### View Operations
- `Cmd/Ctrl + B` - Toggle sidebar
- `Cmd/Ctrl + Shift + E` - Toggle explorer
- `Ctrl + \`` - Toggle terminal
- `Cmd/Ctrl + \\` - Split editor right
- `Cmd/Ctrl + Shift + \\` - Split editor down

### Quick Actions
- `Cmd/Ctrl + Shift + P` - Command palette
- `Cmd/Ctrl + E` - Quick open

## Architecture

### Core Components

1. **Types** (`types.ts`) - TypeScript interfaces for key bindings, profiles, and commands
2. **Utils** (`utils.ts`) - Platform detection, key combination parsing, and validation
3. **Profiles** (`profiles.ts`) - Pre-defined keymap profiles (Default, VSCode, Vim)
4. **Commands** (`commands.ts`) - Command implementations that key bindings execute
5. **Store** (`index.ts`) - Zustand store for state management
6. **Hooks** (`hooks.ts`) - React hooks for easy integration
7. **Providers** (`KeymapProvider.tsx`) - React context providers

### Key Concepts

#### Key Bindings
A key binding connects a key combination to a command:

```typescript
interface KeyBinding {
  id: string;
  description: string;
  key: string;              // e.g., "cmd+w"
  altKeys?: string[];       // Alternative key combinations
  command: string;          // Command to execute
  args?: any[];            // Arguments to pass to command
  context?: string;        // Where this binding is active
  enabled: boolean;        // Whether this binding is enabled
  category: string;        // Category for organization
}
```

#### Commands
Commands are functions that get executed when key bindings are triggered:

```typescript
interface KeyCommand {
  execute: (args?: any[]) => Promise<void> | void;
  canExecute?: () => boolean;
  canUndo?: boolean;
  undo?: () => Promise<void> | void;
}
```

#### Profiles
Profiles are collections of key bindings that can be switched between:

```typescript
interface KeymapProfile {
  name: string;
  description: string;
  bindings: KeyBinding[];
  isActive: boolean;
}
```

## Extending the System

### Adding New Commands

```typescript
import { useCommandManager } from '@/services/keymaps/main';

function MyComponent() {
  const { registerCommand } = useCommandManager();
  
  useEffect(() => {
    registerCommand('my.custom.command', {
      execute: async (args) => {
        console.log('Custom command executed!', args);
        // Your command logic here
      },
      canExecute: () => true,
      canUndo: true,
      undo: async () => {
        console.log('Undoing custom command');
      }
    });
  }, [registerCommand]);
}
```

### Adding New Key Bindings

```typescript
import { useKeyBindingManager } from '@/services/keymaps/main';

function MyComponent() {
  const { addKeyBinding } = useKeyBindingManager();
  
  const addCustomBinding = () => {
    addKeyBinding({
      id: 'my.custom.binding',
      description: 'My custom action',
      key: 'cmd+shift+x',
      command: 'my.custom.command',
      enabled: true,
      category: 'custom',
      context: 'editor'
    });
  };
}
```

### Creating Custom Profiles

```typescript
import { useKeymapProfiles } from '@/services/keymaps/main';

function MyComponent() {
  const { loadProfile } = useKeymapProfiles();
  
  const createCustomProfile = () => {
    const customProfile = {
      name: 'My Custom Profile',
      description: 'Custom key bindings for my workflow',
      bindings: [
        // Your custom bindings here
      ],
      isActive: false
    };
    
    loadProfile(customProfile);
  };
}
```

## Integration Examples

### Basic Editor Integration

```tsx
import { EditorKeymapProvider } from '@/services/keymaps/main';

function EditorArea() {
  return (
    <EditorKeymapProvider>
      <div className="editor-container">
        <YourCodeEditor />
      </div>
    </EditorKeymapProvider>
  );
}
```

### Settings Panel

```tsx
import { KeymapSettings } from '@/components/KeymapSettings';

function SettingsPanel() {
  return (
    <div className="settings-panel">
      <KeymapSettings />
    </div>
  );
}
```

### Custom Context

```tsx
import { KeymapProvider } from '@/services/keymaps/main';

function TerminalPanel() {
  return (
    <KeymapProvider context="terminal">
      <div className="terminal-container">
        <YourTerminal />
      </div>
    </KeymapProvider>
  );
}
```

## Platform Differences

The system automatically detects the platform and adjusts key bindings:

- **macOS**: `cmd` key for primary shortcuts, `option` for alt
- **Windows/Linux**: `ctrl` key for primary shortcuts, `alt` for alt

Key combinations are normalized internally, so you can use `cmd+w` in your bindings and it will work as `ctrl+w` on Windows/Linux.

## Best Practices

1. **Use meaningful command IDs** - Use namespaced IDs like `file.save` or `edit.undo`
2. **Provide good descriptions** - Users will see these in the settings UI
3. **Check canExecute** - Prevent commands from running when they shouldn't
4. **Use contexts appropriately** - Don't make editor-specific commands global
5. **Test on multiple platforms** - Ensure your key bindings work on different systems
6. **Provide alternatives** - Some users may prefer different key combinations

## Troubleshooting

### Key bindings not working
- Check that the keymap system is enabled
- Verify the key combination format (e.g., `cmd+w` not `cmd+W`)
- Ensure the command is registered
- Check that the binding is in the correct context

### Commands not executing
- Verify the command exists in the command registry
- Check the `canExecute` function if present
- Look for console errors during execution

### Platform-specific issues
- Use the utility functions to detect platform
- Test key combinations on different systems
- Consider providing alternative key combinations

### Browser shortcuts being intercepted
The keymap system includes safety checks to prevent breaking critical browser functionality:

- **Critical shortcuts** like `Cmd+R` (refresh), `Cmd+Q` (quit), `F12` (dev tools) are never intercepted
- **`Cmd+W` behavior**: Always intercepted to prevent accidentally closing the browser tab/window. Will close editor tabs when available, or safely do nothing if no tabs are open.
- **Input field shortcuts**: Common editing shortcuts work normally in input fields
- **Context awareness**: Shortcuts only work in their designated contexts

If you're experiencing issues with browser shortcuts:
1. Check if you're in the correct context (editor, explorer, etc.)
2. Verify that you have files open when using file-related shortcuts
3. Use the settings panel to disable specific key bindings if needed

## API Reference

See the TypeScript interfaces in `types.ts` for complete API documentation.

## Contributing

To add new features to the keymap system:

1. Add any new types to `types.ts`
2. Implement utility functions in `utils.ts`
3. Add commands to `commands.ts`
4. Update profiles in `profiles.ts`
5. Add React hooks to `hooks.ts`
6. Update the main export in `main.ts`

The system is designed to be extensible and maintainable, so follow the existing patterns when adding new functionality.
