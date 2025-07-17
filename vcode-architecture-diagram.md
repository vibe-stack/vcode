# vCode IDE Architecture Diagram

## Overview
vCode is a modern IDE built with Electron, React, and Vite, featuring AI-powered coding assistance, terminal integration, and a comprehensive file management system.

## Technology Stack Summary
- **Runtime**: Electron 37.2.1
- **Frontend**: React 19.1.0 with TypeScript
- **Build Tool**: Vite 6.3.5 with separate configs for main, preload, and renderer
- **Styling**: Tailwind CSS 4.1.11 with Tailwind Vite plugin
- **State Management**: Zustand 5.0.6 with Immer middleware
- **Routing**: TanStack Router 1.120.20 with memory history
- **AI/LLM**: AI SDK with XAI provider, streaming support
- **UI Components**: Radix UI components with custom styling
- **Code Editor**: Monaco Editor with custom configuration
- **Terminal**: XTerm.js with node-pty for PTY support

## Process Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                                    ELECTRON MAIN PROCESS                                 │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│  Entry Point: src/main.ts                                                                │
│  • Creates BrowserWindow with security settings                                          │
│  • Configures webPreferences (contextIsolation, nodeIntegration)                        │
│  • Loads preload script and renderer                                                     │
│  • Installs React DevTools in development                                                │
│                                                                                           │
│  IPC Listeners (src/helpers/ipc/listeners-register.ts):                                  │
│  ├── Theme Management (theme-listeners.ts)                                               │
│  ├── Window Control (window-listeners.ts)                                                │
│  ├── Project Management (project-listeners.ts)                                           │
│  ├── AI/LLM Integration (ai-listeners.ts)                                                │
│  ├── Settings Management (settings-listeners.ts)                                         │
│  ├── Git Operations (git-listeners.ts)                                                   │
│  ├── Terminal/PTY (terminal-listeners.ts)                                                │
│  └── Shell Operations (shell-listeners.ts)                                               │
│                                                                                           │
│  Node.js APIs:                                                                           │
│  • File System Operations                                                                │
│  • Process Management (node-pty)                                                         │
│  • Network Requests (AI API calls)                                                       │
│  • OS Integration                                                                        │
└─────────────────────────────────────────────────────────────────────────────────────────┘
                                         │
                                         │ IPC Communication
                                         │
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                                   ELECTRON PRELOAD PROCESS                               │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│  Entry Point: src/preload.ts                                                             │
│  • Runs in isolated context with access to both Node.js and DOM APIs                    │
│  • Exposes secure IPC channels to renderer via contextBridge                            │
│                                                                                           │
│  Context Exposers (src/helpers/ipc/context-exposer.ts):                                  │
│  ├── window.theme    - Theme switching, persistence                                      │
│  ├── window.window   - Window control, drag regions                                      │
│  ├── window.project  - Project management, file operations                               │
│  ├── window.ai       - AI streaming, message handling                                    │
│  ├── window.settings - Settings CRUD, secure storage                                     │
│  ├── window.git      - Git operations, status tracking                                   │
│  ├── window.terminal - Terminal management, PTY control                                  │
│  └── window.shell    - Shell command execution                                           │
│                                                                                           │
│  Security Features:                                                                      │
│  • Context isolation enabled                                                             │
│  • Controlled API surface                                                                │
│  • Type-safe IPC channels                                                                │
└─────────────────────────────────────────────────────────────────────────────────────────┘
                                         │
                                         │ Exposed APIs
                                         │
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                                  ELECTRON RENDERER PROCESS                               │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│  Entry Point: src/renderer.ts → src/App.tsx                                              │
│  Built with: Vite + React + TypeScript                                                   │
│                                                                                           │
│  ┌─────────────────────────────────────────────────────────────────────────────────────┐ │
│  │                              REACT APPLICATION                                      │ │
│  ├─────────────────────────────────────────────────────────────────────────────────────┤ │
│  │  Root Component: App.tsx                                                            │ │
│  │  • Initializes i18n translation                                                    │ │
│  │  • Syncs theme with local storage                                                  │ │
│  │  • Auto-opens last project                                                         │ │
│  │  • Provides RouterProvider with TanStack Router                                    │ │
│  │                                                                                     │ │
│  │  ┌─────────────────────────────────────────────────────────────────────────────────┐ │ │
│  │  │                            ROUTING LAYER                                        │ │ │
│  │  ├─────────────────────────────────────────────────────────────────────────────────┤ │ │
│  │  │  TanStack Router (src/routes/):                                                 │ │ │
│  │  │  • Memory-based history                                                        │ │ │
│  │  │  • Root route with BaseLayout                                                  │ │ │
│  │  │  • Routes: / (HomePage), /workspace (WorkspacePage)                           │ │ │
│  │  │                                                                                 │ │ │
│  │  │  BaseLayout (src/layouts/BaseLayout.tsx):                                      │ │ │
│  │  │  • Drag window region for window control                                       │ │ │
│  │  │  • Main content area                                                           │ │ │
│  │  └─────────────────────────────────────────────────────────────────────────────────┘ │ │
│  │                                                                                     │ │
│  │  ┌─────────────────────────────────────────────────────────────────────────────────┐ │ │
│  │  │                           STATE MANAGEMENT                                      │ │ │
│  │  ├─────────────────────────────────────────────────────────────────────────────────┤ │ │
│  │  │  Zustand Stores (src/stores/):                                                  │ │ │
│  │  │  ├── Project Store (project/index.ts)                                          │ │ │
│  │  │  │   • Current project path and metadata                                       │ │ │
│  │  │  │   • File tree structure                                                     │ │ │
│  │  │  │   • Recent projects history                                                 │ │ │
│  │  │  │   • File watching and change detection                                      │ │ │
│  │  │  │                                                                             │ │ │
│  │  │  ├── Buffer Store (buffers/index.ts)                                           │ │ │
│  │  │  │   • Open file buffers (Map<string, BufferContent>)                         │ │ │
│  │  │  │   • Tab order and active buffer tracking                                    │ │ │
│  │  │  │   • File type detection and MIME handling                                   │ │ │
│  │  │  │   • Save/load operations                                                    │ │ │
│  │  │  │                                                                             │ │ │
│  │  │  ├── Terminal Store (terminal/index.ts)                                        │ │ │
│  │  │  │   • Terminal visibility and split management                                │ │ │
│  │  │  │   • PTY session handling                                                    │ │ │
│  │  │  │                                                                             │ │ │
│  │  │  ├── Editor Splits Store (editor-splits/index.ts)                             │ │ │
│  │  │  │   • Editor panel layout and splits                                          │ │ │
│  │  │  │                                                                             │ │ │
│  │  │  ├── Settings Store (settings/index.ts)                                       │ │ │
│  │  │  │   • Application preferences                                                 │ │ │
│  │  │  │   • Theme and language settings                                             │ │ │
│  │  │  │                                                                             │ │ │
│  │  │  └── Git Store (git/index.ts)                                                  │ │ │
│  │  │      • Repository status and branch info                                       │ │ │
│  │  │      • File change tracking                                                    │ │ │
│  │  └─────────────────────────────────────────────────────────────────────────────────┘ │ │
│  │                                                                                     │ │
│  │  ┌─────────────────────────────────────────────────────────────────────────────────┐ │ │
│  │  │                              UI COMPONENTS                                      │ │ │
│  │  ├─────────────────────────────────────────────────────────────────────────────────┤ │ │
│  │  │  Home Page (src/pages/home/):                                                   │ │ │
│  │  │  • Project selection and management                                            │ │ │
│  │  │  • Recent projects display                                                     │ │ │
│  │  │                                                                                 │ │ │
│  │  │  Workspace Page (src/pages/workspace/):                                        │ │ │
│  │  │  ┌─────────────────────────────────────────────────────────────────────────────┐ │ │ │
│  │  │  │                      RESIZABLE PANEL LAYOUT                                │ │ │ │
│  │  │  ├─────────────────────────────────────────────────────────────────────────────┤ │ │ │
│  │  │  │  ┌─────────────┬─────────────────────────────────────┬─────────────────────┐ │ │ │ │
│  │  │  │  │ File        │           Editor Area               │    AI Chat Panel    │ │ │ │ │
│  │  │  │  │ Explorer    │                                     │                     │ │ │ │ │
│  │  │  │  │ (20%)       │ ┌─────────────────────────────────┐ │ • AI conversation   │ │ │ │ │
│  │  │  │  │             │ │        Monaco Editor            │ │ • Tool execution    │ │ │ │ │
│  │  │  │  │ • File tree │ │ • Syntax highlighting          │ │ • File attachments  │ │ │ │ │
│  │  │  │  │ • Git panel │ │ • Code completion               │ │ • Chat history      │ │ │ │ │
│  │  │  │  │ • Create    │ │ • Multi-tab support             │ │ • Streaming resp.   │ │ │ │ │
│  │  │  │  │   files     │ │ • Language support              │ │                     │ │ │ │ │
│  │  │  │  │             │ └─────────────────────────────────┘ │                     │ │ │ │ │
│  │  │  │  │             │ ┌─────────────────────────────────┐ │                     │ │ │ │ │
│  │  │  │  │             │ │       Terminal Panel            │ │                     │ │ │ │ │
│  │  │  │  │             │ │ • XTerm.js integration          │ │                     │ │ │ │ │
│  │  │  │  │             │ │ • Multiple terminal tabs        │ │                     │ │ │ │ │
│  │  │  │  │             │ │ • PTY support                   │ │                     │ │ │ │ │
│  │  │  │  │             │ └─────────────────────────────────┘ │                     │ │ │ │ │
│  │  │  │  │             │           (60%)                     │        (20%)        │ │ │ │ │
│  │  │  │  └─────────────┴─────────────────────────────────────┴─────────────────────┘ │ │ │ │
│  │  │  └─────────────────────────────────────────────────────────────────────────────┘ │ │ │
│  │  │                                                                                 │ │ │
│  │  │  UI Component Library (src/components/ui/):                                     │ │ │
│  │  │  • Radix UI primitives with custom styling                                     │ │ │
│  │  │  • Tailwind CSS with design tokens                                             │ │ │
│  │  │  • Resizable panels, dialogs, buttons, etc.                                   │ │ │
│  │  └─────────────────────────────────────────────────────────────────────────────────┘ │ │
│  │                                                                                     │ │
│  │  ┌─────────────────────────────────────────────────────────────────────────────────┐ │ │
│  │  │                             AI INTEGRATION                                      │ │ │
│  │  ├─────────────────────────────────────────────────────────────────────────────────┤ │ │
│  │  │  AI SDK Integration (src/api/ai/):                                              │ │ │
│  │  │  • XAI provider with Grok model                                                │ │ │
│  │  │  • Streaming text generation                                                   │ │ │
│  │  │  • Tool execution system                                                       │ │ │
│  │  │  • Custom system prompts                                                       │ │ │
│  │  │                                                                                 │ │ │
│  │  │  Chat System (src/pages/workspace/components/chat/):                           │ │ │
│  │  │  • Real-time streaming responses                                               │ │ │
│  │  │  • Message persistence and history                                             │ │ │
│  │  │  • File attachment support                                                     │ │ │
│  │  │  • Tool approval/cancellation workflow                                         │ │ │
│  │  │  • Enhanced input with mentions                                                │ │ │
│  │  │                                                                                 │ │ │
│  │  │  Tool Registry (src/pages/workspace/components/chat/tools/):                   │ │ │
│  │  │  • File system operations                                                      │ │ │
│  │  │  • Terminal command execution                                                  │ │ │
│  │  │  • Code analysis and modification                                              │ │ │
│  │  │  • Project management tools                                                    │ │ │
│  │  └─────────────────────────────────────────────────────────────────────────────────┘ │ │
│  │                                                                                     │ │
│  │  ┌─────────────────────────────────────────────────────────────────────────────────┐ │ │
│  │  │                            EDITOR SYSTEM                                       │ │ │
│  │  ├─────────────────────────────────────────────────────────────────────────────────┤ │ │
│  │  │  Monaco Editor Integration (src/config/monaco-*):                              │ │ │
│  │  │  • Custom themes (dark-matrix theme)                                           │ │ │
│  │  │  • Language support configuration                                              │ │ │
│  │  │  • Worker configuration for performance                                        │ │ │
│  │  │  • Syntax highlighting and IntelliSense                                        │ │ │
│  │  │                                                                                 │ │ │
│  │  │  Buffer Management:                                                            │ │ │
│  │  │  • File type detection (text/binary/image)                                     │ │ │
│  │  │  • Efficient loading for large files                                           │ │ │
│  │  │  • Dirty state tracking                                                        │ │ │
│  │  │  • Save/auto-save functionality                                                │ │ │
│  │  └─────────────────────────────────────────────────────────────────────────────────┘ │ │
│  │                                                                                     │ │
│  │  ┌─────────────────────────────────────────────────────────────────────────────────┐ │ │
│  │  │                           TERMINAL SYSTEM                                       │ │ │
│  │  ├─────────────────────────────────────────────────────────────────────────────────┤ │ │
│  │  │  XTerm.js Integration (src/pages/workspace/components/terminal/):              │ │ │
│  │  │  • Full terminal emulation                                                     │ │ │
│  │  │  • Multiple terminal tabs                                                      │ │ │
│  │  │  • WebGL rendering for performance                                             │ │ │
│  │  │  • Unicode support                                                             │ │ │
│  │  │  • Web links and fit addons                                                    │ │ │
│  │  │                                                                                 │ │ │
│  │  │  PTY Integration:                                                              │ │ │
│  │  │  • node-pty for pseudo-terminal support                                        │ │ │
│  │  │  • Cross-platform shell execution                                             │ │ │
│  │  │  • Process management and cleanup                                              │ │ │
│  │  └─────────────────────────────────────────────────────────────────────────────────┘ │ │
│  └─────────────────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

## Data Flow Patterns

### 1. Project Management Flow
```
User Action → Project Store → IPC → Main Process → File System
                    ↓
            File Tree Update → UI Re-render → Git Status Update
```

### 2. File Editing Flow
```
File Open → Buffer Store → IPC → Main Process → File Read → Monaco Editor
                                                                   ↓
Edit → Buffer Update → Dirty State → Save Action → IPC → File Write
```

### 3. AI Chat Flow
```
User Input → Chat Component → AI API → Streaming Response → UI Updates
                                    ↓
              Tool Execution → IPC → Main Process → File System/Terminal
```

### 4. Terminal Flow
```
Terminal Input → XTerm Component → IPC → Main Process → PTY → Shell
                                                              ↓
              Output → IPC → Renderer → XTerm Display
```

## IPC Channel Architecture

### Channel Categories
1. **Theme Channels** (`theme-channels.ts`)
   - Theme switching and persistence
   - System theme detection

2. **Project Channels** (`project-channels.ts`)
   - Project opening/closing
   - File tree operations
   - File watching

3. **AI Channels** (`ai-channels.ts`)
   - AI message streaming
   - Tool execution requests
   - Response handling

4. **Terminal Channels** (`terminal-channels.ts`)
   - PTY creation/destruction
   - Terminal input/output
   - Process management

5. **Settings Channels** (`settings-channels.ts`)
   - Configuration management
   - Secure storage (API keys)

6. **Git Channels** (`git-channels.ts`)
   - Repository status
   - File change tracking
   - Branch operations

7. **Shell Channels** (`shell-channels.ts`)
   - Command execution
   - Process management

## State Management Boundaries

### Zustand Store Isolation
- **Project Store**: Project-level state, file tree, recent projects
- **Buffer Store**: Editor buffers, file content, tab management
- **Terminal Store**: Terminal visibility, session management
- **Git Store**: Repository state, file status tracking
- **Settings Store**: Application preferences, theme settings

### State Synchronization
- IPC events trigger store updates
- Store changes propagate to UI components
- Cross-store communication for related operations

## Security Model

### Context Isolation
- Preload script runs in isolated context
- Limited API surface exposed to renderer
- Type-safe IPC channels prevent injection

### File System Access
- All file operations go through main process
- Sandboxed renderer cannot directly access files
- Secure API key storage for AI services

## Performance Optimizations

### Vite Build Configuration
- Separate builds for main, preload, and renderer
- Monaco Editor code splitting
- Worker configuration for heavy operations

### Editor Performance
- Lazy loading for large files
- Efficient buffer management
- WebGL terminal rendering

### AI Integration
- Streaming responses for real-time feedback
- Tool execution approval workflow
- Request debouncing and caching

## Development Features

### Hot Module Replacement
- Vite HMR for renderer process
- React Fast Refresh
- Development tools integration

### Debugging Support
- React DevTools integration
- Electron DevTools
- Source maps for debugging

### Testing Infrastructure
- Vitest for unit testing
- Playwright for E2E testing
- React Testing Library

This architecture provides a comprehensive foundation for a modern IDE with AI integration, maintaining clear separation between processes while enabling efficient communication and state management.
