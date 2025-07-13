# Terminal Integration

This IDE now includes a fully integrated terminal that supports:

## Features

- **Multiple Terminal Tabs**: Create multiple terminal sessions
- **Terminal Splitting**: Split terminals horizontally within a tab
- **OS Detection**: Automatically detects the correct shell based on your OS
- **Process Management**: Properly kills terminal processes when closed
- **Resizable Interface**: Terminal panel can be resized
- **Project-aware**: New terminals open in the current project directory

## Usage

### Opening/Closing Terminal

- **Toggle Terminal**: `Ctrl+\`` (or `Cmd+\`` on macOS)
- **Show Terminal**: Click the "Terminal" button in the footer
- **Hide Terminal**: Press `Ctrl+\`` again or click the X button

### Terminal Commands

- **New Terminal**: `Cmd+Shift+\`` (or `Ctrl+Shift+\`` on Windows/Linux)
- **Split Terminal**: `Cmd+Shift+5` (or `Ctrl+Shift+5` on Windows/Linux)
- **Kill Terminal**: `Cmd+Shift+K` (or `Ctrl+Shift+K` on Windows/Linux)

### Terminal Management

- **Switch between tabs**: Click on terminal tabs
- **Close tab**: Click the X button on the tab (appears on hover)
- **Switch between splits**: Click on the split indicators or use the active split

## Shell Detection

The terminal automatically detects the appropriate shell based on your operating system:

- **macOS**: Uses `$SHELL` environment variable (defaults to `/bin/zsh`)
- **Windows**: Uses `%COMSPEC%` environment variable (defaults to `cmd.exe`)
- **Linux**: Uses `$SHELL` environment variable (defaults to `/bin/bash`)

## Architecture

The terminal integration consists of several components:

### Backend (Main Process)
- **Terminal Listeners** (`src/helpers/ipc/terminal/terminal-listeners.ts`): Handles terminal process creation and management using `node-pty`
- **Terminal Channels** (`src/helpers/ipc/terminal/terminal-channels.ts`): Defines IPC communication channels

### Frontend (Renderer Process)
- **Terminal Store** (`src/stores/terminal/terminal-store.ts`): Manages terminal state using Zustand
- **Terminal Panel** (`src/pages/workspace/components/terminal/terminal-panel.tsx`): Main terminal UI component
- **Terminal Context** (`src/helpers/ipc/terminal/terminal-context.ts`): Exposes terminal API to renderer

### IPC Communication
- Terminal creation, writing, resizing, and killing are handled through IPC
- Real-time data streaming from terminal processes to the UI
- Proper cleanup when terminals are closed

## Technical Details

### Process Management
- Each terminal runs in its own `node-pty` process
- Processes are properly killed when terminals are closed
- Zombie/ghost processes are prevented through proper cleanup

### Security
- Terminal processes run with the same permissions as the main application
- No elevated privileges are required

### Performance
- Terminal output is streamed in real-time
- Efficient memory usage with proper cleanup
- Responsive UI that doesn't block on terminal operations

## Dependencies

- `node-pty`: For cross-platform terminal process management
- `@types/node-pty`: TypeScript definitions for node-pty

## Future Enhancements

- Integration with xterm.js for a full terminal emulator experience
- Terminal themes and customization
- Search functionality within terminal output
- Terminal history persistence
- Copy/paste improvements
- Terminal profiles for different shells/environments
