# Map Builder Export System

This document describes the enhanced export functionality for the Map Builder application.

## Overview

The export system has been completely refactored to provide professional-grade Three.js code generation with comprehensive options and best practices.

## Key Improvements

### 🚀 **Enhanced TypeScript Export**
- **Complete Scene Setup**: Generates full scene initialization with renderer configuration
- **Professional Lighting**: Includes ambient, directional, and fill lighting with proper shadow setup
- **Camera System**: Configurable perspective camera with proper aspect ratio handling
- **Controls Integration**: OrbitControls with optimized settings
- **Type Safety**: Full TypeScript interfaces and type definitions
- **Render Loop**: Complete animation loop with window resize handling

### 🛠 **JavaScript Export Support**
- **Multiple Module Formats**: ES6, CommonJS, and UMD support
- **Cross-browser Compatibility**: Compatible with older browsers
- **Flexible Integration**: Easy to integrate into existing projects

### ⚙ **Export Dialog**
- **Tabbed Interface**: Organized options across Format, Features, Optimization, and Advanced tabs
- **Real-time Preview**: Shows estimated file size and enabled features
- **Export Options**: Comprehensive customization options

## Export Options

### Format Options
- **Language**: TypeScript (recommended) or JavaScript
- **Target Framework**: Three.js (WebGPU), with Babylon.js and WebGL planned
- **Module Format**: ES6 modules, CommonJS, or UMD (JavaScript only)

### Features
- ✅ **Camera Setup**: Perspective camera with proper configuration
- ✅ **Professional Lighting**: Multi-light setup with shadows
- ✅ **Grid Helper**: Visual grid for reference
- ✅ **Debug Helpers**: Development aids
- ✅ **Documentation Comments**: Comprehensive JSDoc comments

### Optimization
- ✅ **Geometry Optimization**: Reduces polygon count for better performance
- ✅ **Material Factories**: Reusable material creation functions
- ✅ **Geometry Factories**: Optimized geometry creation
- ✅ **Code Minification**: Smaller file sizes

### Advanced Settings
- **Performance Metrics**: Object count and estimated file size
- **Export Summary**: Complete overview of selected options

## Usage Examples

### TypeScript Export (Full Featured)

```typescript
import { createMapScene } from './scene';

// Create renderer
const renderer = new THREE.WebGLRenderer({ antialias: true });
document.body.appendChild(renderer.domElement);

// Create scene with configuration
const { scene, camera, controls, animate } = createMapScene(renderer, {
  enableShadows: true,
  shadowMapSize: 2048,
  pixelRatio: 2
});

// Start animation
animate();
```

### JavaScript Export (ES6 Modules)

```javascript
import { createMapScene } from './scene.js';

// Create renderer
const renderer = new THREE.WebGLRenderer({ antialias: true });
document.body.appendChild(renderer.domElement);

// Create scene
const result = createMapScene(renderer, {
  enableShadows: true,
  shadowMapSize: 2048
});

// Start animation
result.animate();
```

### JavaScript Export (CommonJS)

```javascript
const { createMapScene } = require('./scene.js');

// Create renderer
const renderer = new THREE.WebGLRenderer({ antialias: true });
document.body.appendChild(renderer.domElement);

// Create scene
const result = createMapScene(renderer);
result.animate();
```

## Generated Code Features

### Professional Scene Setup
- Proper renderer configuration with optimal settings
- Shadow mapping with configurable quality
- Pixel ratio handling for high-DPI displays
- Responsive window resize handling

### Advanced Lighting System
- **Ambient Light**: Provides overall base illumination
- **Directional Light**: Main light source with shadows
- **Fill Light**: Reduces harsh shadows for better visual quality

### Object Management
- **User Data**: Each object includes metadata (id, name, type)
- **Shadow Casting/Receiving**: Proper shadow configuration
- **Transform Application**: Position, rotation, and scale applied correctly
- **Material Properties**: PBR materials with metalness and roughness

### Camera and Controls
- **Perspective Camera**: Proper FOV and clipping planes
- **Orbit Controls**: Professional interaction with damping
- **Constraint Settings**: Sensible min/max distances and polar angle limits

### Helper Functions
- **Door Geometry**: Complex extruded geometry with cutouts
- **Geometry Factories**: Optimized geometry creation for performance
- **Material Factories**: Reusable material creation functions

## Performance Considerations

### Optimization Options
1. **Geometry Optimization**: Reduces segment count by ~50%
2. **Material Factories**: Enables material instance reuse
3. **Geometry Factories**: Reduces memory usage through shared geometries
4. **Code Minification**: Smaller file sizes for production

### Estimated File Sizes
- **Basic Export**: ~2-5 KB for simple scenes
- **Full Featured Export**: ~8-15 KB with all options
- **Large Scenes**: Scales linearly with object count

## Best Practices

### When to Use TypeScript
- ✅ New projects with modern tooling
- ✅ Projects requiring type safety
- ✅ Team development environments
- ✅ IDE integration and autocompletion

### When to Use JavaScript
- ✅ Legacy browser support required
- ✅ Integration with existing JavaScript projects
- ✅ Rapid prototyping
- ✅ Learning and educational purposes

### Module Format Selection
- **ES6**: Modern browsers and bundlers (recommended)
- **CommonJS**: Node.js environments and older bundlers
- **UMD**: Universal compatibility and CDN usage

## Migration Guide

### From Old Export System
The old export system generated minimal code. To migrate:

1. **Replace Export Calls**: Use the new export dialog instead of direct function calls
2. **Update Integration**: The new exports include complete scene setup
3. **Review Dependencies**: Ensure OrbitControls import is available
4. **Test Thoroughly**: The new system provides more comprehensive output

### Example Migration

**Old Export (Basic)**:
```typescript
// Old: Just geometry and basic positioning
const boxGeometry = new THREE.BoxGeometry(2, 2, 2);
const boxMaterial = new THREE.MeshStandardMaterial({ color: "#4f46e5" });
const box = new THREE.Mesh(boxGeometry, boxMaterial);
box.position.set(0, 1, 0);
scene.add(box);
```

**New Export (Professional)**:
```typescript
// New: Complete scene with lighting, camera, controls, and optimization
export function createMapScene(renderer: THREE.WebGLRenderer, config: SceneConfig = {}) {
  // Complete scene setup with professional lighting
  // Proper camera configuration and controls
  // Optimized materials and geometry
  // Full render loop and event handling
}
```

## Future Enhancements

### Planned Features
- 🔄 **Babylon.js Support**: Alternative 3D engine target
- 🔄 **WebGL Raw Export**: Direct WebGL code generation
- 🔄 **Animation Export**: Keyframe animation support
- 🔄 **Physics Integration**: Cannon.js/Ammo.js physics export
- 🔄 **Material Templates**: Pre-configured material library
- 🔄 **Texture Support**: Image texture integration

### Community Contributions
We welcome contributions to expand the export system capabilities!

## Support

For issues or feature requests related to the export system, please check the main repository documentation or create an issue with the `export` label.
