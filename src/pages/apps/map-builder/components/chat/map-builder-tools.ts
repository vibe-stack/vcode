import type { MapObject } from '../../store';

export interface AddShapeParams {
  width?: number;
  height?: number;
  depth?: number;
  position?: [number, number, number];
  scale?: [number, number, number];
  rotation?: [number, number, number];
  color?: string;
  name?: string;
}

export class MapBuilderTools {
  static async addCube(params: AddShapeParams): Promise<string> {
    const { useMapBuilderStore } = await import('../../store');
    const store = useMapBuilderStore.getState();
    const id = store.generateId();
    
    const object: Omit<MapObject, 'id'> = {
      type: 'box',
      position: params.position || [0, 0, 0],
      rotation: params.rotation || [0, 0, 0],
      scale: params.scale || [params.width || 1, params.height || 1, params.depth || 1],
      color: params.color || '#ffffff',
      name: params.name || `Cube ${id.slice(-4)}`
    };
    
    store.addObject(object);
    return id;
  }

  static async addSphere(params: AddShapeParams): Promise<string> {
    const { useMapBuilderStore } = await import('../../store');
    const store = useMapBuilderStore.getState();
    const id = store.generateId();
    
    const object: Omit<MapObject, 'id'> = {
      type: 'sphere',
      position: params.position || [0, 0, 0],
      rotation: params.rotation || [0, 0, 0],
      scale: params.scale || [params.width || 1, params.height || 1, params.depth || 1],
      color: params.color || '#ffffff',
      name: params.name || `Sphere ${id.slice(-4)}`
    };
    
    store.addObject(object);
    return id;
  }

  static async addCylinder(params: AddShapeParams): Promise<string> {
    const { useMapBuilderStore } = await import('../../store');
    const store = useMapBuilderStore.getState();
    const id = store.generateId();
    
    const object: Omit<MapObject, 'id'> = {
      type: 'cylinder',
      position: params.position || [0, 0, 0],
      rotation: params.rotation || [0, 0, 0],
      scale: params.scale || [params.width || 1, params.height || 1, params.depth || 1],
      color: params.color || '#ffffff',
      name: params.name || `Cylinder ${id.slice(-4)}`
    };
    
    store.addObject(object);
    return id;
  }

  static async removeObject(id: string): Promise<boolean> {
    const { useMapBuilderStore } = await import('../../store');
    const store = useMapBuilderStore.getState();
    const objectExists = store.getObjectById(id) !== undefined;
    
    if (objectExists) {
      store.deleteObject(id);
      return true;
    }
    
    return false;
  }

  static async getObjects(): Promise<Array<{ id: string; type: string; name?: string }>> {
    const { useMapBuilderStore } = await import('../../store');
    const store = useMapBuilderStore.getState();
    return store.objects.map(obj => ({
      id: obj.id,
      type: obj.type,
      name: obj.name
    }));
  }

  static async getObject(id: string): Promise<MapObject | null> {
    const { useMapBuilderStore } = await import('../../store');
    const store = useMapBuilderStore.getState();
    return store.getObjectById(id) || null;
  }

  static async getFullScene(): Promise<MapObject[]> {
    const { useMapBuilderStore } = await import('../../store');
    const store = useMapBuilderStore.getState();
    console.warn('getFullScene() called - this can be costly on large scenes with many objects');
    return [...store.objects];
  }
}

// Tool definitions for AI SDK
export const mapBuilderToolDefinitions = {
  addCube: {
    description: 'Add a cube/box object to the 3D scene',
    parameters: {
      type: 'object',
      properties: {
        width: { type: 'number', description: 'Width of the cube (default: 1)' },
        height: { type: 'number', description: 'Height of the cube (default: 1)' },
        depth: { type: 'number', description: 'Depth of the cube (default: 1)' },
        position: { 
          type: 'array', 
          items: { type: 'number' }, 
          minItems: 3, 
          maxItems: 3,
          description: 'Position [x, y, z] (default: [0, 0, 0])' 
        },
        scale: { 
          type: 'array', 
          items: { type: 'number' }, 
          minItems: 3, 
          maxItems: 3,
          description: 'Scale [x, y, z] (default: [1, 1, 1])' 
        },
        rotation: { 
          type: 'array', 
          items: { type: 'number' }, 
          minItems: 3, 
          maxItems: 3,
          description: 'Rotation [x, y, z] in radians (default: [0, 0, 0])' 
        },
        color: { type: 'string', description: 'Hex color (default: #ffffff)' },
        name: { type: 'string', description: 'Name for the object' }
      }
    }
  },
  
  addSphere: {
    description: 'Add a sphere object to the 3D scene',
    parameters: {
      type: 'object',
      properties: {
        width: { type: 'number', description: 'Width/diameter of the sphere (default: 1)' },
        height: { type: 'number', description: 'Height/diameter of the sphere (default: 1)' },
        depth: { type: 'number', description: 'Depth/diameter of the sphere (default: 1)' },
        position: { 
          type: 'array', 
          items: { type: 'number' }, 
          minItems: 3, 
          maxItems: 3,
          description: 'Position [x, y, z] (default: [0, 0, 0])' 
        },
        scale: { 
          type: 'array', 
          items: { type: 'number' }, 
          minItems: 3, 
          maxItems: 3,
          description: 'Scale [x, y, z] (default: [1, 1, 1])' 
        },
        rotation: { 
          type: 'array', 
          items: { type: 'number' }, 
          minItems: 3, 
          maxItems: 3,
          description: 'Rotation [x, y, z] in radians (default: [0, 0, 0])' 
        },
        color: { type: 'string', description: 'Hex color (default: #ffffff)' },
        name: { type: 'string', description: 'Name for the object' }
      }
    }
  },
  
  addCylinder: {
    description: 'Add a cylinder object to the 3D scene',
    parameters: {
      type: 'object',
      properties: {
        width: { type: 'number', description: 'Width/diameter of the cylinder (default: 1)' },
        height: { type: 'number', description: 'Height of the cylinder (default: 1)' },
        depth: { type: 'number', description: 'Depth/diameter of the cylinder (default: 1)' },
        position: { 
          type: 'array', 
          items: { type: 'number' }, 
          minItems: 3, 
          maxItems: 3,
          description: 'Position [x, y, z] (default: [0, 0, 0])' 
        },
        scale: { 
          type: 'array', 
          items: { type: 'number' }, 
          minItems: 3, 
          maxItems: 3,
          description: 'Scale [x, y, z] (default: [1, 1, 1])' 
        },
        rotation: { 
          type: 'array', 
          items: { type: 'number' }, 
          minItems: 3, 
          maxItems: 3,
          description: 'Rotation [x, y, z] in radians (default: [0, 0, 0])' 
        },
        color: { type: 'string', description: 'Hex color (default: #ffffff)' },
        name: { type: 'string', description: 'Name for the object' }
      }
    }
  },
  
  removeObject: {
    description: 'Remove an object from the 3D scene by its ID',
    parameters: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'The ID of the object to remove' }
      },
      required: ['id']
    }
  },
  
  getObjects: {
    description: 'Get a list of all objects in the scene with their IDs and types',
    parameters: {
      type: 'object',
      properties: {}
    }
  },
  
  getObject: {
    description: 'Get all data for a specific object by its ID',
    parameters: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'The ID of the object to get' }
      },
      required: ['id']
    }
  },
  
  getFullScene: {
    description: 'Get all objects in the scene including all their data. WARNING: This can be costly on large scenes!',
    parameters: {
      type: 'object',
      properties: {}
    }
  }
};
