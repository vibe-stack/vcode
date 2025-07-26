# Map Builder

A rapid prototyping tool for creating 3D maps and scenes using Three.js and React Three Fiber. Perfect for grayboxing game levels, architectural layouts, or any 3D scene creation.

## Features

### 🎮 Rapid Prototyping
- **Click & Drag Creation**: Select a shape and click-drag in the 3D scene to create objects with precise sizing
- **Instant Feedback**: Real-time preview while creating objects
- **Grid Snapping**: Enable precise placement with customizable grid settings

### 🔧 Professional Tools
- **Multiple Primitives**: Box, Sphere, Cylinder, Cone, and Plane shapes
- **Transform Tools**: Select, Move, Rotate, and Scale tools
- **Material Properties**: Adjust metalness, roughness, transparency, and opacity
- **Object Management**: Hierarchical object list with visibility toggles

### ⚡ Performance
- **WebGPU Renderer**: Uses WebGPU when available, falls back to WebGL
- **Transform Controls**: Visual gizmos for moving, rotating, and scaling objects
- **Optimized Rendering**: Efficient shadow mapping and lighting
- **Smooth Interactions**: 60fps viewport navigation

### 📤 Export Options
- **JSON Export**: Save your maps for sharing or backup
- **TypeScript Export**: Generate ready-to-use Three.js code for your projects
- **Template System**: Start with pre-built scenes or save your own

## Quick Start

1. **Choose a Template**: Click the "Templates" button to start with a pre-built scene
2. **Create Objects**: Select a shape from the toolbar and click-drag in the 3D viewport
3. **Transform Objects**: Select an object and use Move (G), Rotate (R), or Scale (S) tools with visual gizmos
4. **Edit Properties**: Use the properties panel to fine-tune object attributes
5. **Export**: Save as JSON or export as TypeScript code

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `V` | Select tool |
| `G` | Move tool |
| `R` | Rotate tool |
| `S` | Scale tool |
| `Ctrl+D` | Duplicate selected |
| `Ctrl+A` | Select all |
| `Delete` | Delete selected |
| `Escape` | Clear selection / Cancel creation |
| `1-5` | Quick create shapes |

## File Structure

```
map-builder/
├── index.tsx                 # Main component
├── store.ts                  # Zustand state management
├── Scene.tsx                 # 3D scene setup
├── templates.ts              # Pre-built scene templates
├── utils.ts                  # Utility functions
├── hooks/
│   └── useKeyboardShortcuts.ts
└── components/
    ├── Toolbar.tsx           # Main toolbar
    ├── ObjectList.tsx        # Object hierarchy
    ├── PropertiesPanel.tsx   # Object properties editor
    ├── MapObjects.tsx        # 3D object renderer
    ├── MapObjectMesh.tsx     # Individual object mesh
    ├── InteractiveCreation.tsx # Click-drag creation
    ├── SelectionBox.tsx      # Selection visualization
    ├── TemplateModal.tsx     # Template selector
    └── WelcomeModal.tsx      # Help and introduction
```

## Technology Stack

- **React Three Fiber**: Declarative Three.js in React
- **@react-three/drei**: Useful helpers and abstractions
- **Zustand**: Lightweight state management
- **Three.js**: 3D graphics library
- **Lucide React**: Beautiful icons
- **Tailwind CSS**: Utility-first styling

## Export Formats

### JSON Export
Exports the complete scene data including objects, materials, and grid settings. Can be imported back into the Map Builder.

### TypeScript Export
Generates ready-to-use Three.js code:

```typescript
import * as THREE from 'three/webgpu';

export function createMapObjects(scene: THREE.Scene) {
  // Generated mesh creation code
  const boxGeometry = new THREE.BoxGeometry(2, 2, 2);
  const boxMaterial = new THREE.MeshStandardMaterial({ color: "#4f46e5" });
  const box = new THREE.Mesh(boxGeometry, boxMaterial);
  box.position.set(0, 1, 0);
  scene.add(box);
}
```

## Extending the Map Builder

### Adding New Shapes
1. Add the shape type to the `MapObject` interface in `store.ts`
2. Update the shape creation logic in `Toolbar.tsx`
3. Add geometry creation in `MapObjectMesh.tsx` and `InteractiveCreation.tsx`
4. Update the export functions in `store.ts`

### Custom Materials
Extend the material properties in the `MapObject` interface and update the properties panel to include new controls.

### Advanced Features
- Prefab system for complex objects
- Animation timeline
- Physics integration
- Texture mapping
- Advanced lighting controls

## Performance Tips

1. **Grid Settings**: Use appropriate grid divisions for your use case
2. **Object Count**: Consider performance with large numbers of objects
3. **Shadow Quality**: Adjust shadow map size based on quality needs
4. **WebGPU**: Ensure WebGPU is enabled in your browser for best performance

## Browser Support

- **Chrome/Edge**: Full WebGPU support
- **Firefox**: WebGL fallback
- **Safari**: WebGL fallback
- **Mobile**: Limited support, desktop recommended

---

Built with ❤️ for rapid 3D prototyping
