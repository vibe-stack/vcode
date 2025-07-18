# VCode IDE Extension

A VS Code extension that provides enhanced coding capabilities and Monaco editor integration.

## Features

- **VCode Editor Panel**: Opens a custom editor interface within VS Code
- **VS Code Theme Integration**: Seamlessly integrates with VS Code's current theme
- **Command Palette Integration**: Access all features via VS Code's command palette
- **Extensible Architecture**: Built to support future Monaco editor integration

## Installation

### From Source

1. Navigate to the extension directory:
   ```bash
   cd vscode-extension
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Compile the extension:
   ```bash
   npm run compile
   ```

4. Open VS Code and press `F5` to launch a new Extension Development Host window with the extension loaded

### Manual Installation

1. Package the extension:
   ```bash
   npx vsce package
   ```

2. Install the generated `.vsix` file:
   ```bash
   code --install-extension vcode-ide-extension-0.0.1.vsix
   ```

## Usage

### Commands

Access these commands via the Command Palette (`Cmd+Shift+P` on macOS, `Ctrl+Shift+P` on Windows/Linux):

- **VCode: Open Editor** - Opens the VCode editor panel
- **VCode: Show Welcome** - Shows a welcome message

### Features

1. **Custom Editor Interface**: 
   - Clean, VS Code-themed text editor
   - Basic formatting capabilities
   - File save integration

2. **Theme Integration**:
   - Automatically uses VS Code's current color theme
   - Consistent UI/UX with VS Code

## Development

### Building

```bash
npm run compile
```

### Watching for Changes

```bash
npm run watch
```

### Project Structure

```
vscode-extension/
├── src/
│   └── extension.ts      # Main extension entry point
├── out/                  # Compiled JavaScript output
├── package.json          # Extension manifest
├── tsconfig.json         # TypeScript configuration
└── README.md            # This file
```

## Extension Manifest

The extension contributes:

- 2 commands (`vcode.openEditor`, `vcode.showWelcome`)
- Command palette integration
- Webview panel support

## Future Enhancements

- Full Monaco editor integration
- Syntax highlighting support
- File system integration
- Multi-language support
- Advanced editing features

## Requirements

- VS Code version 1.74.0 or higher
- Node.js for development

## License

MIT