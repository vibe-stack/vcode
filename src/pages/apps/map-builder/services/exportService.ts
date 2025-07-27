import { MapObject, GridSettings } from '../store';

export interface ExportOptions {
  format: 'typescript' | 'javascript';
  target: 'threejs';
  exportType: 'complete-scene' | 'objects-only';
  includeGrid: boolean;
  includeCamera: boolean;
  includeLighting: boolean;
  includeHelpers: boolean;
  moduleFormat: 'es6' | 'commonjs' | 'umd';
  minified: boolean;
  bundleGeometries: boolean;
  generateComments: boolean;
  geometryOptimization: boolean;
  materialOptimization: boolean;
}

export interface ExportData {
  objects: MapObject[];
  grid: GridSettings;
  camera?: {
    position: [number, number, number];
    target: [number, number, number];
  };
}

export class ExportService {
  
  static exportAsJSON(data: ExportData): string {
    return JSON.stringify(data, null, 2);
  }

  static exportAsTypeScript(data: ExportData, options: ExportOptions): string {
    const { objects, grid, camera } = data;

    // Generate imports based on target
    const imports = this.generateImports(options);
    
    // Generate types
    const types = this.generateTypes(options);
    
    // Generate the appropriate function based on export type
    let mainFunction: string;
    if (options.exportType === 'complete-scene') {
      // Generate complete scene creation function
      mainFunction = this.generateSceneFunction(objects, grid, camera, options);
    } else {
      // Generate objects-only function
      mainFunction = this.generateObjectsOnlyFunction(objects, grid, options);
    }
    
    // Generate helper functions if needed
    const helpers = this.generateHelperFunctions(objects, options);
    
    // Generate geometry functions
    const geometryFunctions = this.generateGeometryFunctions(objects, options);
    
    // Generate material functions
    const materialFunctions = this.generateMaterialFunctions(objects, options);
    
    return [
      imports,
      types,
      helpers,
      geometryFunctions,
      materialFunctions,
      mainFunction
    ].filter(Boolean).join('\n\n');
  }

  static exportAsJavaScript(data: ExportData, options: ExportOptions): string {
    const { objects, grid, camera } = data;

    // Generate imports/requires based on module format
    const imports = this.generateJSImports(options);
    
    // Generate the appropriate function based on export type
    let mainFunction: string;
    if (options.exportType === 'complete-scene') {
      // Generate complete scene creation function
      mainFunction = this.generateJSSceneFunction(objects, grid, camera, options);
    } else {
      // Generate objects-only function
      mainFunction = this.generateJSObjectsOnlyFunction(objects, grid, options);
    }
    
    // Generate helper functions if needed
    const helpers = this.generateJSHelperFunctions(objects, options);
    
    // Generate geometry functions
    const geometryFunctions = this.generateJSGeometryFunctions(objects, options);
    
    // Generate material functions
    const materialFunctions = this.generateJSMaterialFunctions(objects, options);
    
    return [
      imports,
      helpers,
      geometryFunctions,
      materialFunctions,
      mainFunction
    ].filter(Boolean).join('\n\n');
  }

  private static generateImports(options: ExportOptions): string {
    const comments = options.generateComments ? '// Three.js imports for scene creation\n' : '';
    
    if (options.exportType === 'complete-scene') {
      return `${comments}import * as THREE from 'three/webgpu';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
${options.includeLighting ? "import { RectAreaLightHelper } from 'three/examples/jsm/helpers/RectAreaLightHelper.js';" : ''}`;
    } else {
      return `${comments}import * as THREE from 'three/webgpu';`;
    }
  }

  private static generateJSImports(options: ExportOptions): string {
    const comments = options.generateComments ? '// Three.js imports for scene creation\n' : '';
    
    switch (options.moduleFormat) {
      case 'es6':
        return this.generateImports(options);
      
      case 'commonjs':
        if (options.exportType === 'complete-scene') {
          return `${comments}const THREE = require('three');
const { OrbitControls } = require('three/examples/jsm/controls/OrbitControls.js');`;
        } else {
          return `${comments}const THREE = require('three');`;
        }
      
      case 'umd':
        return `${comments}(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define(['three'], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory(require('three'));
  } else {
    root.MapScene = factory(root.THREE);
  }
}(typeof self !== 'undefined' ? self : this, function (THREE) {`;
      
      default:
        return '';
    }
  }

  private static generateTypes(options: ExportOptions): string {
    if (!options.generateComments) return '';
    
    return `/**
 * Scene configuration interface
 */
export interface SceneConfig {
  enableShadows?: boolean;
  shadowMapSize?: number;
  antialias?: boolean;
  pixelRatio?: number;
}

/**
 * Camera configuration interface
 */
export interface CameraConfig {
  fov?: number;
  near?: number;
  far?: number;
  position?: [number, number, number];
  target?: [number, number, number];
}`;
  }

  private static generateSceneFunction(objects: MapObject[], grid: GridSettings, camera: any, options: ExportOptions): string {
    const comments = options.generateComments ? `/**
 * Creates and configures the complete 3D scene
 * @param renderer - Three.js WebGL renderer
 * @param config - Scene configuration options
 * @returns Configured scene, camera, and controls
 */` : '';

    const functionName = 'createMapScene';
    const parameters = 'renderer: THREE.WebGLRenderer, config: SceneConfig = {}';
    
    return `${comments}
export function ${functionName}(${parameters}) {
  ${this.generateSceneSetup(options)}
  
  ${this.generateCameraSetup(camera, options)}
  
  ${this.generateLightingSetup(options)}
  
  ${this.generateObjectCreation(objects, options)}
  
  ${this.generateGridSetup(grid, options)}
  
  ${this.generateControlsSetup(options)}
  
  ${this.generateRenderLoop(options)}
  
  return {
    scene,
    camera,
    controls,
    renderer,
    animate: () => animate()
  };
}`;
  }

  private static generateJSSceneFunction(objects: MapObject[], grid: GridSettings, camera: any, options: ExportOptions): string {
    const comments = options.generateComments ? `/**
 * Creates and configures the complete 3D scene
 * @param {Object} renderer - Three.js WebGL renderer
 * @param {Object} config - Scene configuration options
 * @returns {Object} Configured scene, camera, and controls
 */` : '';

    const functionName = 'createMapScene';
    
    let code = `${comments}
function ${functionName}(renderer, config) {
  config = config || {};
  
  ${this.generateJSSceneSetup(options)}
  
  ${this.generateJSCameraSetup(camera, options)}
  
  ${this.generateJSLightingSetup(options)}
  
  ${this.generateJSObjectCreation(objects, options)}
  
  ${this.generateJSGridSetup(grid, options)}
  
  ${this.generateJSControlsSetup(options)}
  
  ${this.generateJSRenderLoop(options)}
  
  return {
    scene: scene,
    camera: camera,
    controls: controls,
    renderer: renderer,
    animate: function() { return animate(); }
  };
}`;

    if (options.moduleFormat === 'es6') {
      code = code.replace('function createMapScene', 'export function createMapScene');
    } else if (options.moduleFormat === 'commonjs') {
      code += '\n\nmodule.exports = { createMapScene };';
    } else if (options.moduleFormat === 'umd') {
      code += '\n\nreturn { createMapScene };\n});';
    }

    return code;
  }

  private static generateObjectsOnlyFunction(objects: MapObject[], grid: GridSettings, options: ExportOptions): string {
    const comments = options.generateComments ? `/**
 * Adds map objects to an existing Three.js scene
 * @param scene - Three.js scene to add objects to
 * @returns Array of created objects for further manipulation
 */` : '';

    const functionName = 'addMapObjects';
    const parameters = 'scene: THREE.Scene';
    
    return `${comments}
export function ${functionName}(${parameters}) {
  const objects: THREE.Object3D[] = [];
  
  ${this.generateObjectCreation(objects, options).replace(/scene\.add\((\w+)\);/g, 'scene.add($1); objects.push($1);')}
  
  ${options.includeGrid ? this.generateGridSetup(grid, options).replace('scene.add(gridHelper);', 'scene.add(gridHelper); objects.push(gridHelper);') : ''}
  
  return objects;
}`;
  }

  private static generateJSObjectsOnlyFunction(objects: MapObject[], grid: GridSettings, options: ExportOptions): string {
    const comments = options.generateComments ? `/**
 * Adds map objects to an existing Three.js scene
 * @param {Object} scene - Three.js scene to add objects to
 * @returns {Array} Array of created objects for further manipulation
 */` : '';

    const functionName = 'addMapObjects';
    
    let code = `${comments}
function ${functionName}(scene) {
  var objects = [];
  
  ${this.generateJSObjectCreation(objects, options).replace(/scene\.add\((\w+)\);/g, 'scene.add($1); objects.push($1);')}
  
  ${options.includeGrid ? this.generateJSGridSetup(grid, options).replace('scene.add(gridHelper);', 'scene.add(gridHelper); objects.push(gridHelper);') : ''}
  
  return objects;
}`;

    if (options.moduleFormat === 'es6') {
      code = code.replace('function addMapObjects', 'export function addMapObjects');
    } else if (options.moduleFormat === 'commonjs') {
      code += '\n\nmodule.exports = { addMapObjects };';
    } else if (options.moduleFormat === 'umd') {
      code += '\n\nreturn { addMapObjects };\n});';
    }

    return code;
  }

  private static generateSceneSetup(options: ExportOptions): string {
    const comments = options.generateComments ? '  // Create scene with optimized settings\n' : '';
    
    return `${comments}  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x1a1a1a);
  
  // Configure renderer
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, config.pixelRatio || 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = config.enableShadows !== false;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.shadowMap.autoUpdate = true;`;
  }

  private static generateJSSceneSetup(options: ExportOptions): string {
    const comments = options.generateComments ? '  // Create scene with optimized settings\n' : '';
    
    return `${comments}  var scene = new THREE.Scene();
  scene.background = new THREE.Color(0x1a1a1a);
  
  // Configure renderer
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, config.pixelRatio || 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = config.enableShadows !== false;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.shadowMap.autoUpdate = true;`;
  }

  private static generateCameraSetup(camera: any, options: ExportOptions): string {
    const pos = camera?.position || [10, 10, 10];
    const target = camera?.target || [0, 0, 0];
    const comments = options.generateComments ? '  // Setup camera with proper perspective\n' : '';
    
    return `${comments}  const camera = new THREE.PerspectiveCamera(
    config.fov || 75,
    window.innerWidth / window.innerHeight,
    config.near || 0.1,
    config.far || 1000
  );
  camera.position.set(${pos.join(', ')});
  camera.lookAt(${target.join(', ')});`;
  }

  private static generateJSCameraSetup(camera: any, options: ExportOptions): string {
    const pos = camera?.position || [10, 10, 10];
    const target = camera?.target || [0, 0, 0];
    const comments = options.generateComments ? '  // Setup camera with proper perspective\n' : '';
    
    return `${comments}  var camera = new THREE.PerspectiveCamera(
    config.fov || 75,
    window.innerWidth / window.innerHeight,
    config.near || 0.1,
    config.far || 1000
  );
  camera.position.set(${pos.join(', ')});
  camera.lookAt(${target.join(', ')});`;
  }

  private static generateLightingSetup(options: ExportOptions): string {
    if (!options.includeLighting) return '  // Lighting disabled in export options';
    
    const comments = options.generateComments ? '  // Professional lighting setup\n' : '';
    
    return `${comments}  // Ambient light for overall illumination
  const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
  scene.add(ambientLight);
  
  // Main directional light (sun)
  const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
  directionalLight.position.set(10, 10, 5);
  directionalLight.castShadow = true;
  directionalLight.shadow.mapSize.width = config.shadowMapSize || 2048;
  directionalLight.shadow.mapSize.height = config.shadowMapSize || 2048;
  directionalLight.shadow.camera.near = 0.5;
  directionalLight.shadow.camera.far = 50;
  directionalLight.shadow.camera.left = -20;
  directionalLight.shadow.camera.right = 20;
  directionalLight.shadow.camera.top = 20;
  directionalLight.shadow.camera.bottom = -20;
  scene.add(directionalLight);
  
  // Fill light
  const fillLight = new THREE.DirectionalLight(0x87ceeb, 0.3);
  fillLight.position.set(-10, 5, -5);
  scene.add(fillLight);`;
  }

  private static generateJSLightingSetup(options: ExportOptions): string {
    if (!options.includeLighting) return '  // Lighting disabled in export options';
    
    const comments = options.generateComments ? '  // Professional lighting setup\n' : '';
    
    return `${comments}  // Ambient light for overall illumination
  var ambientLight = new THREE.AmbientLight(0x404040, 0.6);
  scene.add(ambientLight);
  
  // Main directional light (sun)
  var directionalLight = new THREE.DirectionalLight(0xffffff, 1);
  directionalLight.position.set(10, 10, 5);
  directionalLight.castShadow = true;
  directionalLight.shadow.mapSize.width = config.shadowMapSize || 2048;
  directionalLight.shadow.mapSize.height = config.shadowMapSize || 2048;
  directionalLight.shadow.camera.near = 0.5;
  directionalLight.shadow.camera.far = 50;
  directionalLight.shadow.camera.left = -20;
  directionalLight.shadow.camera.right = 20;
  directionalLight.shadow.camera.top = 20;
  directionalLight.shadow.camera.bottom = -20;
  scene.add(directionalLight);
  
  // Fill light
  var fillLight = new THREE.DirectionalLight(0x87ceeb, 0.3);
  fillLight.position.set(-10, 5, -5);
  scene.add(fillLight);`;
  }

  private static generateObjectCreation(objects: MapObject[], options: ExportOptions): string {
    const comments = options.generateComments ? '  // Create scene objects\n' : '';
    
    const objectsCode = objects.map(obj => this.generateObjectCode(obj, options, false)).join('\n\n');
    
    return `${comments}${objectsCode}`;
  }

  private static generateJSObjectCreation(objects: MapObject[], options: ExportOptions): string {
    const comments = options.generateComments ? '  // Create scene objects\n' : '';
    
    const objectsCode = objects.map(obj => this.generateObjectCode(obj, options, true)).join('\n\n');
    
    return `${comments}${objectsCode}`;
  }

  private static generateObjectCode(obj: MapObject, options: ExportOptions, isJS: boolean): string {
    const varDeclaration = isJS ? 'var' : 'const';
    const safeName = obj.name?.replace(/[^a-zA-Z0-9]/g, '_') || `object_${obj.id}`;
    
    const comments = options.generateComments ? `  // ${obj.name || `Object ${obj.id}`} (${obj.type})\n` : '';
    
    // Generate geometry
    const geometryCode = this.generateGeometryCode(obj, options);
    
    // Generate material
    const materialCode = this.generateMaterialCode(obj, options);
    
    return `${comments}  ${varDeclaration} ${safeName}Geometry = ${geometryCode};
  ${varDeclaration} ${safeName}Material = ${materialCode};
  ${varDeclaration} ${safeName} = new THREE.Mesh(${safeName}Geometry, ${safeName}Material);
  ${safeName}.position.set(${obj.position.join(', ')});
  ${safeName}.rotation.set(${obj.rotation.join(', ')});
  ${safeName}.scale.set(${obj.scale.join(', ')});
  ${safeName}.castShadow = true;
  ${safeName}.receiveShadow = true;
  ${safeName}.userData = { id: '${obj.id}', name: '${obj.name}', type: '${obj.type}' };
  scene.add(${safeName});`;
  }

  private static generateGeometryCode(obj: MapObject, options: ExportOptions): string {
    const { type, scale, geometry } = obj;
    
    switch (type) {
      case 'box':
        return `new THREE.BoxGeometry(1, 1, 1)`;
      
      case 'sphere':
        const segments = options.geometryOptimization ? '16, 12' : '32, 32';
        return `new THREE.SphereGeometry(1, ${segments})`;
      
      case 'cylinder':
        const radialSegments = options.geometryOptimization ? '16' : '32';
        return `new THREE.CylinderGeometry(1, 1, 1, ${radialSegments})`;
      
      case 'plane':
        return `new THREE.PlaneGeometry(1, 1)`;
      
      case 'cone':
        const coneSegments = options.geometryOptimization ? '16' : '32';
        return `new THREE.ConeGeometry(1, 1, ${coneSegments})`;
      
      case 'door':
        return `createDoorGeometry(1, 1, 1, ${geometry?.cutoutWidth || 0.8}, ${geometry?.cutoutHeight || 1.8}, ${geometry?.cutoutRadius || 0})`;
      
      default:
        return `new THREE.BoxGeometry(1, 1, 1)`;
    }
  }

  private static generateMaterialCode(obj: MapObject, options: ExportOptions): string {
    const { color, material } = obj;
    
    const baseProperties = [`color: "${color}"`];
    
    if (material) {
      if (material.metalness !== undefined) baseProperties.push(`metalness: ${material.metalness}`);
      if (material.roughness !== undefined) baseProperties.push(`roughness: ${material.roughness}`);
      if (material.transparent) {
        baseProperties.push(`transparent: true`);
        baseProperties.push(`opacity: ${material.opacity || 1}`);
      }
      if (material.side && material.side !== 'front') {
        const sideValue = material.side === 'back' ? 'THREE.BackSide' : 
                         material.side === 'double' ? 'THREE.DoubleSide' : 'THREE.FrontSide';
        baseProperties.push(`side: ${sideValue}`);
      }
    }
    
    if (!options.materialOptimization) {
      // Add enhanced material properties for better visuals
      if (!material?.metalness) baseProperties.push('metalness: 0.1');
      if (!material?.roughness) baseProperties.push('roughness: 0.7');
    }
    
    return `new THREE.MeshStandardMaterial({\n    ${baseProperties.join(',\n    ')}\n  })`;
  }

  private static generateGridSetup(grid: GridSettings, options: ExportOptions): string {
    if (!options.includeGrid || !grid.visible) return '  // Grid disabled in export options';
    
    const comments = options.generateComments ? '  // Grid helper for reference\n' : '';
    
    return `${comments}  const gridHelper = new THREE.GridHelper(${grid.size}, ${grid.divisions}, 0x888888, 0x444444);
  scene.add(gridHelper);`;
  }

  private static generateJSGridSetup(grid: GridSettings, options: ExportOptions): string {
    if (!options.includeGrid || !grid.visible) return '  // Grid disabled in export options';
    
    const comments = options.generateComments ? '  // Grid helper for reference\n' : '';
    
    return `${comments}  var gridHelper = new THREE.GridHelper(${grid.size}, ${grid.divisions}, 0x888888, 0x444444);
  scene.add(gridHelper);`;
  }

  private static generateControlsSetup(options: ExportOptions): string {
    const comments = options.generateComments ? '  // Camera controls for interaction\n' : '';
    
    return `${comments}  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.screenSpacePanning = false;
  controls.minDistance = 1;
  controls.maxDistance = 100;
  controls.maxPolarAngle = Math.PI / 2;`;
  }

  private static generateJSControlsSetup(options: ExportOptions): string {
    const comments = options.generateComments ? '  // Camera controls for interaction\n' : '';
    
    return `${comments}  var controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.screenSpacePanning = false;
  controls.minDistance = 1;
  controls.maxDistance = 100;
  controls.maxPolarAngle = Math.PI / 2;`;
  }

  private static generateRenderLoop(options: ExportOptions): string {
    const comments = options.generateComments ? '  // Render loop\n' : '';
    
    return `${comments}  function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
  }
  
  // Handle window resize
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });`;
  }

  private static generateJSRenderLoop(options: ExportOptions): string {
    const comments = options.generateComments ? '  // Render loop\n' : '';
    
    return `${comments}  function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
  }
  
  // Handle window resize
  window.addEventListener('resize', function() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });`;
  }

  private static generateHelperFunctions(objects: MapObject[], options: ExportOptions): string {
    const hasDoors = objects.some(obj => obj.type === 'door');
    
    if (!hasDoors) return '';
    
    const comments = options.generateComments ? '/**\n * Creates a door geometry with cutout\n */\n' : '';
    
    return `${comments}function createDoorGeometry(width: number, height: number, depth: number, cutoutWidth: number, cutoutHeight: number, cutoutRadius: number): THREE.BufferGeometry {
  const shape = new THREE.Shape();
  
  // Outer rectangle
  shape.moveTo(-width / 2, -height / 2);
  shape.lineTo(width / 2, -height / 2);
  shape.lineTo(width / 2, height / 2);
  shape.lineTo(-width / 2, height / 2);
  shape.lineTo(-width / 2, -height / 2);
  
  // Inner cutout
  const hole = new THREE.Path();
  const cutoutX = -cutoutWidth / 2;
  const cutoutY = -height / 2;
  
  if (cutoutRadius > 0) {
    // Arched doorway
    hole.moveTo(cutoutX, cutoutY);
    hole.lineTo(cutoutX + cutoutWidth, cutoutY);
    hole.lineTo(cutoutX + cutoutWidth, cutoutY + cutoutHeight - cutoutRadius);
    hole.arc(-cutoutRadius, 0, cutoutRadius, 0, Math.PI, false);
    hole.lineTo(cutoutX, cutoutY + cutoutHeight - cutoutRadius);
    hole.lineTo(cutoutX, cutoutY);
  } else {
    // Rectangular doorway
    hole.moveTo(cutoutX, cutoutY);
    hole.lineTo(cutoutX + cutoutWidth, cutoutY);
    hole.lineTo(cutoutX + cutoutWidth, cutoutY + cutoutHeight);
    hole.lineTo(cutoutX, cutoutY + cutoutHeight);
    hole.lineTo(cutoutX, cutoutY);
  }
  
  shape.holes.push(hole);
  
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: depth,
    bevelEnabled: false
  });
  
  return geometry;
}`;
  }

  private static generateJSHelperFunctions(objects: MapObject[], options: ExportOptions): string {
    const hasDoors = objects.some(obj => obj.type === 'door');
    
    if (!hasDoors) return '';
    
    const comments = options.generateComments ? '/**\n * Creates a door geometry with cutout\n */\n' : '';
    
    return `${comments}function createDoorGeometry(width, height, depth, cutoutWidth, cutoutHeight, cutoutRadius) {
  var shape = new THREE.Shape();
  
  // Outer rectangle
  shape.moveTo(-width / 2, -height / 2);
  shape.lineTo(width / 2, -height / 2);
  shape.lineTo(width / 2, height / 2);
  shape.lineTo(-width / 2, height / 2);
  shape.lineTo(-width / 2, -height / 2);
  
  // Inner cutout
  var hole = new THREE.Path();
  var cutoutX = -cutoutWidth / 2;
  var cutoutY = -height / 2;
  
  if (cutoutRadius > 0) {
    // Arched doorway
    hole.moveTo(cutoutX, cutoutY);
    hole.lineTo(cutoutX + cutoutWidth, cutoutY);
    hole.lineTo(cutoutX + cutoutWidth, cutoutY + cutoutHeight - cutoutRadius);
    hole.arc(-cutoutRadius, 0, cutoutRadius, 0, Math.PI, false);
    hole.lineTo(cutoutX, cutoutY + cutoutHeight - cutoutRadius);
    hole.lineTo(cutoutX, cutoutY);
  } else {
    // Rectangular doorway
    hole.moveTo(cutoutX, cutoutY);
    hole.lineTo(cutoutX + cutoutWidth, cutoutY);
    hole.lineTo(cutoutX + cutoutWidth, cutoutY + cutoutHeight);
    hole.lineTo(cutoutX, cutoutY + cutoutHeight);
    hole.lineTo(cutoutX, cutoutY);
  }
  
  shape.holes.push(hole);
  
  var geometry = new THREE.ExtrudeGeometry(shape, {
    depth: depth,
    bevelEnabled: false
  });
  
  return geometry;
}`;
  }

  private static generateGeometryFunctions(objects: MapObject[], options: ExportOptions): string {
    if (!options.bundleGeometries) return '';
    
    const comments = options.generateComments ? '/**\n * Geometry factory functions\n */\n' : '';
    
    return `${comments}export const GeometryFactory = {
  createOptimizedBox: () => new THREE.BoxGeometry(1, 1, 1),
  createOptimizedSphere: () => new THREE.SphereGeometry(1, ${options.geometryOptimization ? '16, 12' : '32, 32'}),
  createOptimizedCylinder: () => new THREE.CylinderGeometry(1, 1, 1, ${options.geometryOptimization ? '16' : '32'}),
  createOptimizedPlane: () => new THREE.PlaneGeometry(1, 1),
  createOptimizedCone: () => new THREE.ConeGeometry(1, 1, ${options.geometryOptimization ? '16' : '32'})
};`;
  }

  private static generateJSGeometryFunctions(objects: MapObject[], options: ExportOptions): string {
    if (!options.bundleGeometries) return '';
    
    const comments = options.generateComments ? '/**\n * Geometry factory functions\n */\n' : '';
    
    return `${comments}var GeometryFactory = {
  createOptimizedBox: function() { return new THREE.BoxGeometry(1, 1, 1); },
  createOptimizedSphere: function() { return new THREE.SphereGeometry(1, ${options.geometryOptimization ? '16, 12' : '32, 32'}); },
  createOptimizedCylinder: function() { return new THREE.CylinderGeometry(1, 1, 1, ${options.geometryOptimization ? '16' : '32'}); },
  createOptimizedPlane: function() { return new THREE.PlaneGeometry(1, 1); },
  createOptimizedCone: function() { return new THREE.ConeGeometry(1, 1, ${options.geometryOptimization ? '16' : '32'}); }
};`;
  }

  private static generateMaterialFunctions(objects: MapObject[], options: ExportOptions): string {
    if (!options.materialOptimization) return '';
    
    const comments = options.generateComments ? '/**\n * Material factory functions\n */\n' : '';
    
    return `${comments}export const MaterialFactory = {
  createStandardMaterial: (color: string, metalness = 0.1, roughness = 0.7) => 
    new THREE.MeshStandardMaterial({ color, metalness, roughness }),
  
  createMetallicMaterial: (color: string) => 
    new THREE.MeshStandardMaterial({ color, metalness: 0.8, roughness: 0.2 }),
  
  createGlassMaterial: (color: string, opacity = 0.8) => 
    new THREE.MeshStandardMaterial({ 
      color, 
      transparent: true, 
      opacity, 
      metalness: 0.1, 
      roughness: 0.05 
    })
};`;
  }

  private static generateJSMaterialFunctions(objects: MapObject[], options: ExportOptions): string {
    if (!options.materialOptimization) return '';
    
    const comments = options.generateComments ? '/**\n * Material factory functions\n */\n' : '';
    
    return `${comments}var MaterialFactory = {
  createStandardMaterial: function(color, metalness, roughness) {
    metalness = metalness || 0.1;
    roughness = roughness || 0.7;
    return new THREE.MeshStandardMaterial({ color: color, metalness: metalness, roughness: roughness });
  },
  
  createMetallicMaterial: function(color) {
    return new THREE.MeshStandardMaterial({ color: color, metalness: 0.8, roughness: 0.2 });
  },
  
  createGlassMaterial: function(color, opacity) {
    opacity = opacity || 0.8;
    return new THREE.MeshStandardMaterial({ 
      color: color, 
      transparent: true, 
      opacity: opacity, 
      metalness: 0.1, 
      roughness: 0.05 
    });
  }
};`;
  }
}
