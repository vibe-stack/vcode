# Editor Area Components

This directory contains the components responsible for the editor area of the workspace, including tabs, editors, and panes.

## Components

### `EditorPane` (editor-pane.tsx)
The main container component that orchestrates the editor area. It manages:
- Buffer state and lifecycle
- Tab drag-and-drop functionality
- Pane activation and selection
- Integration between tabs and editor content

### `TabBar` (tab-bar.tsx)
Renders and manages the tab bar at the top of each editor pane. Features:
- Scrollable tab list
- Drag and drop support for tab reordering
- Visual feedback for active pane state

### `Tab` (tab.tsx)
Individual tab component that displays:
- Buffer name
- Dirty state indicator (unsaved changes)
- Close button
- Drag handle for moving tabs between panes

### `Editor` (editor.tsx)
The Monaco editor wrapper component that handles:
- Code editing with syntax highlighting
- Content change detection
- Error and loading states
- Language detection based on file extension
- Cursor position management

### `types.ts`
Common TypeScript interfaces and types used across the editor components.

### `index.ts`
Barrel export file for clean imports from other parts of the application.

## Architecture

The components are designed with single responsibility principles:
- **EditorPane**: Coordination and state management
- **TabBar**: Tab navigation and organization
- **Tab**: Individual tab behavior and appearance
- **Editor**: Code editing functionality

This separation makes the code more maintainable, testable, and allows for easier feature additions or modifications to individual components without affecting the entire editor system.
