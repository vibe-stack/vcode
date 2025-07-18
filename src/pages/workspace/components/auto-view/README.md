# AutoView - Deep Iframe Integration System

## Overview

The AutoView component has been completely refactored to provide deep integration with web applications running in iframes. It now supports advanced framework introspection, DOM node selection, and source code mapping.

## Key Features

### 🎯 Element Inspection
- Click to select any DOM element in the iframe
- Real-time visual highlighting with overlay
- Cross-origin iframe support with message passing
- Framework-agnostic DOM introspection

### ⚛️ Framework Integration
- **React**: Component name, props, state, fiber node analysis
- **Vue**: Component detection and data extraction (planned)
- **Angular**: Component identification (planned)
- **Svelte**: Component mapping (planned)

### 📂 Source Code Mapping
- Automatic mapping from components to source files
- Multiple search strategies:
  - React DevTools source location
  - Component name pattern matching
  - File naming convention analysis
  - VS Code workspace search integration
- Confidence scoring for source matches

### 🔍 Advanced Search
- Integration with VS Code's grep search
- File pattern matching
- Multiple naming convention support (camelCase, kebab-case, snake_case)

## Architecture

### Core Components

1. **AutoView** (`index.tsx`)
   - Main component with resizable panels
   - Inspection mode toggle
   - Framework detection display

2. **IframeInspector** (`iframe-inspector.ts`)
   - Core inspection engine
   - Script injection for cross-origin support
   - Event handling and communication

3. **ComponentInspectorPanel** (`component-inspector-panel.tsx`)
   - Detailed component information display
   - Tabbed interface (Component, DOM, Source)
   - Interactive source file opening

4. **SourceFileMapper** (`source-file-mapper.ts`)
   - Component-to-source mapping logic
   - Multiple search strategies
   - VS Code integration hooks

### Utility Components

- **NoServerState**: Extracted empty state component
- **PortSelector**: Server detection and selection
- **InspectorTestRunner**: Automated testing utilities

## Usage

```tsx
import { AutoView } from './auto-view';

// Basic usage
<AutoView />

// The component automatically:
// 1. Detects running development servers
// 2. Provides iframe inspection tools
// 3. Maps selected components to source files
// 4. Integrates with VS Code for file opening
```

## Inspection Flow

1. **Start Inspection**: Click "Inspect Element" button
2. **Element Selection**: Click on any element in the iframe
3. **Framework Detection**: Automatically detects React/Vue/Angular
4. **Component Analysis**: Extracts component information
5. **Source Mapping**: Maps component to source file
6. **Display Results**: Shows detailed information in inspector panel

## React Component Detection

The system uses multiple strategies to detect React components:

```typescript
// Strategy 1: React Fiber detection
const fiber = element.__reactInternalFiber || element._reactInternalFiber;

// Strategy 2: React DevTools integration
if (fiber._debugSource) {
  // Get source location from DevTools
}

// Strategy 3: Component tree traversal
while (componentFiber && componentFiber.type) {
  // Find the actual component
}
```

## Source File Mapping

Multiple strategies ensure accurate source mapping:

1. **High Confidence**: React DevTools source location
2. **Medium Confidence**: Component name search in workspace
3. **Low Confidence**: Naming convention matching

## Testing

The system includes automated testing capabilities:

```typescript
import { InspectorTestRunner, DEMO_APPS } from './inspector-test-runner';

const runner = new InspectorTestRunner(iframeElement);
const results = await runner.runTests(DEMO_APPS[0]);
const report = runner.generateReport(DEMO_APPS[0], results);
```

## Integration Points

### VS Code APIs
- File search (`file_search` tool)
- Text search (`grep_search` tool)
- File opening commands

### Framework Support
- React DevTools integration
- Vue DevTools (planned)
- Angular DevTools (planned)

## Future Enhancements

1. **Vue.js Support**: Complete Vue component detection
2. **Angular Support**: Angular component analysis
3. **Svelte Support**: Svelte component mapping
4. **Hot Reloading**: Real-time component updates
5. **Performance Profiling**: Component render performance
6. **State Management**: Redux/Vuex/NgRx integration
7. **Accessibility**: A11y analysis and suggestions

## Security Considerations

- Sandbox iframe permissions
- Script injection security
- Cross-origin message validation
- Content Security Policy compliance

## Performance

- Minimal overhead injection
- Lazy script loading
- Efficient DOM traversal
- Debounced search operations

## Browser Support

- Modern browsers with ES6+ support
- Cross-origin iframe messaging
- DOM manipulation APIs
- React DevTools integration
