import { tool } from 'ai';
import { z } from 'zod';
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

  static async addPlane(params: AddShapeParams): Promise<string> {
    const { useMapBuilderStore } = await import('../../store');
    const store = useMapBuilderStore.getState();
    const id = store.generateId();
    
    const object: Omit<MapObject, 'id'> = {
      type: 'plane',
      position: params.position || [0, 0, 0],
      rotation: params.rotation || [0, 0, 0],
      scale: params.scale || [params.width || 1, params.height || 1, params.depth || 1],
      color: params.color || '#ffffff',
      name: params.name || `Plane ${id.slice(-4)}`
    };
    
    store.addObject(object);
    return id;
  }

  static async removeObject(id: string): Promise<string> {
    const { useMapBuilderStore } = await import('../../store');
    const store = useMapBuilderStore.getState();
    store.removeObject(id);
    return `Object ${id} removed successfully`;
  }

  static async getObjects(): Promise<{ id: string; type: string; name: string }[]> {
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
    return store.objects.find(obj => obj.id === id) || null;
  }

  static async getFullScene(): Promise<MapObject[]> {
    const { useMapBuilderStore } = await import('../../store');
    const store = useMapBuilderStore.getState();
    console.warn('getFullScene() called - this can be costly on large scenes with many objects');
    return [...store.objects];
  }
}

// Zod schemas for tool parameters
const addShapeParams = z.object({
  width: z.number().optional().describe('Width of the shape (default: 1)'),
  height: z.number().optional().describe('Height of the shape (default: 1)'),
  depth: z.number().optional().describe('Depth of the shape (default: 1)'),
  position: z.array(z.number()).length(3).optional().describe('Position [x, y, z] (default: [0, 0, 0])'),
  scale: z.array(z.number()).length(3).optional().describe('Scale [x, y, z] (default: [1, 1, 1])'),
  rotation: z.array(z.number()).length(3).optional().describe('Rotation [x, y, z] in radians (default: [0, 0, 0])'),
  color: z.string().optional().describe('Hex color (default: #ffffff)'),
  name: z.string().optional().describe('Name for the object'),
});

const removeObjectParams = z.object({
  id: z.string().describe('The ID of the object to remove'),
});

const getObjectParams = z.object({
  id: z.string().describe('The ID of the object to get'),
});

// AI SDK Tool definitions
export const addCube = tool({
  description: 'Add a cube/box object to the 3D scene',
  parameters: addShapeParams,
  execute: async (params) => {
    return await MapBuilderTools.addCube(params);
  },
});

export const addSphere = tool({
  description: 'Add a sphere object to the 3D scene',
  parameters: addShapeParams,
  execute: async (params) => {
    return await MapBuilderTools.addSphere(params);
  },
});

export const addCylinder = tool({
  description: 'Add a cylinder object to the 3D scene',
  parameters: addShapeParams,
  execute: async (params) => {
    return await MapBuilderTools.addCylinder(params);
  },
});

export const addPlane = tool({
  description: 'Add a plane object to the 3D scene',
  parameters: addShapeParams,
  execute: async (params) => {
    return await MapBuilderTools.addPlane(params);
  },
});

export const removeObject = tool({
  description: 'Remove an object from the 3D scene by its ID',
  parameters: removeObjectParams,
  execute: async (params) => {
    return await MapBuilderTools.removeObject(params.id);
  },
});

export const getObjects = tool({
  description: 'Get a list of all objects in the scene with their IDs and types',
  parameters: z.object({}),
  execute: async () => {
    return await MapBuilderTools.getObjects();
  },
});

export const getObject = tool({
  description: 'Get all data for a specific object by its ID',
  parameters: getObjectParams,
  execute: async (params) => {
    return await MapBuilderTools.getObject(params.id);
  },
});

export const getFullScene = tool({
  description: 'Get all objects in the scene including all their data. WARNING: This can be costly on large scenes!',
  parameters: z.object({}),
  execute: async () => {
    return await MapBuilderTools.getFullScene();
  },
});

// Export tools object for the AI SDK
export const mapBuilderToolDefinitions = {
  addCube,
  addSphere,
  addCylinder,
  addPlane,
  removeObject,
  getObjects,
  getObject,
  getFullScene,
};
