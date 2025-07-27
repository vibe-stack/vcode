import { tool } from 'ai';
import { z } from 'zod';
import type { MapObject } from '../../store';
import { useMapBuilderStore } from '../../store';

// Shared base params
export interface BaseShapeParams {
  position?: [number, number, number];
  scale?: [number, number, number];
  rotation?: [number, number, number];
  color?: string;
  name?: string;
}

export interface CubeParams extends BaseShapeParams {
  width?: number;
  height?: number;
  depth?: number;
}

export interface SphereParams extends BaseShapeParams {
  radius?: number;
}

export interface CylinderParams extends BaseShapeParams {
  radius?: number;
  height?: number;
}

export interface PlaneParams extends BaseShapeParams {
  width?: number;
  height?: number;
}

export interface DoorParams extends BaseShapeParams {
  width?: number;
  height?: number;
  depth?: number;
  cutoutWidth?: number;
  cutoutHeight?: number;
  cutoutRadius?: number;
}

export class MapBuilderTools {
  static async addCube(params: CubeParams): Promise<string> {
    const store = useMapBuilderStore.getState();
    const id = store.generateId();
    
    // Use specific dimensions if provided, otherwise fall back to scale, then defaults
    const width = params.width ?? (params.scale?.[0] ?? 1);
    const height = params.height ?? (params.scale?.[1] ?? 1);
    const depth = params.depth ?? (params.scale?.[2] ?? 1);
    
    const object: Omit<MapObject, 'id'> = {
      type: 'box',
      position: params.position || [0, 0, 0],
      rotation: params.rotation || [0, 0, 0],
      scale: [width, height, depth],
      color: params.color || '#ffffff',
      name: params.name || `Cube ${id.slice(-4)}`
    };
    store.addObject(object);
    return id;
  }

  static async addSphere(params: SphereParams): Promise<string> {
    const store = useMapBuilderStore.getState();
    const id = store.generateId();
    
    // Use radius if provided, otherwise fall back to scale, then default
    const radius = params.radius ?? (params.scale?.[0] ?? 1);
    
    const object: Omit<MapObject, 'id'> = {
      type: 'sphere',
      position: params.position || [0, 0, 0],
      rotation: params.rotation || [0, 0, 0],
      scale: [radius, radius, radius],
      color: params.color || '#ffffff',
      name: params.name || `Sphere ${id.slice(-4)}`
    };
    store.addObject(object);
    return id;
  }

  static async addCylinder(params: CylinderParams): Promise<string> {
    const store = useMapBuilderStore.getState();
    const id = store.generateId();
    
    // Use specific dimensions if provided, otherwise fall back to scale, then defaults
    const radius = params.radius ?? (params.scale?.[0] ?? 1);
    const height = params.height ?? (params.scale?.[1] ?? 1);
    
    const object: Omit<MapObject, 'id'> = {
      type: 'cylinder',
      position: params.position || [0, 0, 0],
      rotation: params.rotation || [0, 0, 0],
      scale: [radius, height, radius],
      color: params.color || '#ffffff',
      name: params.name || `Cylinder ${id.slice(-4)}`
    };
    store.addObject(object);
    return id;
  }

  static async addPlane(params: PlaneParams): Promise<string> {
    const store = useMapBuilderStore.getState();
    const id = store.generateId();
    
    // Use specific dimensions if provided, otherwise fall back to scale, then defaults
    const width = params.width ?? (params.scale?.[0] ?? 1);
    const height = params.height ?? (params.scale?.[1] ?? 1);
    
    const object: Omit<MapObject, 'id'> = {
      type: 'plane',
      position: params.position || [0, 0, 0],
      rotation: params.rotation || [0, 0, 0],
      scale: [width, height, 1],
      color: params.color || '#ffffff',
      name: params.name || `Plane ${id.slice(-4)}`
    };
    store.addObject(object);
    return id;
  }

  static async addDoor(params: DoorParams): Promise<string> {
    const store = useMapBuilderStore.getState();
    const id = store.generateId();
    
    // Use specific dimensions if provided, otherwise fall back to scale, then defaults
    const width = params.width ?? (params.scale?.[0] ?? 2);
    const height = params.height ?? (params.scale?.[1] ?? 2.5);
    const depth = params.depth ?? (params.scale?.[2] ?? 0.2);
    
    const object: Omit<MapObject, 'id'> = {
      type: 'door',
      position: params.position || [0, 0, 0],
      rotation: params.rotation || [0, 0, 0],
      scale: [width, height, depth],
      color: params.color || '#8B4513',
      name: params.name || `Door ${id.slice(-4)}`,
      geometry: {
        width: width,
        height: height,
        depth: depth,
        cutoutWidth: params.cutoutWidth || 0.8,
        cutoutHeight: params.cutoutHeight || 1.8,
        cutoutRadius: params.cutoutRadius || 0,
      }
    };
    store.addObject(object);
    return id;
  }

  static async removeObject(id: string): Promise<string> {
    const store = useMapBuilderStore.getState();
    store.deleteObject(id);
    return `Object ${id} removed successfully`;
  }

  static async getObjects(): Promise<{ id: string; type: string; name: string }[]> {
    const store = useMapBuilderStore.getState();

    return store.objects.map(obj => ({
      id: obj.id,
      type: obj.type,
      name: obj.name
    })) as { id: string; type: string; name: string }[];
  }

  static async getObject(id: string): Promise<MapObject | null> {
    const store = useMapBuilderStore.getState();
    return store.objects.find(obj => obj.id === id) || null;
  }

  static async getFullScene(): Promise<MapObject[]> {
    const store = useMapBuilderStore.getState();
    console.warn('getFullScene() called - this can be costly on large scenes with many objects');
    return [...store.objects];
  }
}

// Zod schemas for tool parameters
const baseShapeParams = {
  position: z.array(z.number()).length(3).optional().describe('Position [x, y, z] (default: [0, 0, 0])'),
  scale: z.array(z.number()).length(3).optional().describe('Scale [x, y, z] - used only if specific dimensions not provided'),
  rotation: z.array(z.number()).length(3).optional().describe('Rotation [x, y, z] in radians (default: [0, 0, 0])'),
  color: z.string().optional().describe('Hex color (default: #ffffff)'),
  name: z.string().optional().describe('Name for the object'),
};

const cubeParams = z.object({
  ...baseShapeParams,
  width: z.number().optional().describe('Width of the cube (default: 1)'),
  height: z.number().optional().describe('Height of the cube (default: 1)'),
  depth: z.number().optional().describe('Depth of the cube (default: 1)'),
});

const sphereParams = z.object({
  ...baseShapeParams,
  radius: z.number().optional().describe('Radius of the sphere (default: 1)'),
});

const cylinderParams = z.object({
  ...baseShapeParams,
  radius: z.number().optional().describe('Radius of the cylinder (default: 1)'),
  height: z.number().optional().describe('Height of the cylinder (default: 1)'),
});

const planeParams = z.object({
  ...baseShapeParams,
  width: z.number().optional().describe('Width of the plane (default: 1)'),
  height: z.number().optional().describe('Height of the plane (default: 1)'),
});

const doorParams = z.object({
  ...baseShapeParams,
  width: z.number().optional().describe('Width of the door (default: 2)'),
  height: z.number().optional().describe('Height of the door (default: 2.5)'),
  depth: z.number().optional().describe('Depth of the door (default: 0.2)'),
  cutoutWidth: z.number().optional().describe('Width of the cutout (default: 0.8)'),
  cutoutHeight: z.number().optional().describe('Height of the cutout (default: 1.8)'),
  cutoutRadius: z.number().optional().describe('Radius of the cutout arch (default: 0)'),
});

export const addCube = tool({
  description: 'Add a cube/box object to the 3D scene',
  parameters: cubeParams,
  execute: async (params) => {
    return await MapBuilderTools.addCube(params as CubeParams);
  },
});

export const addSphere = tool({
  description: 'Add a sphere object to the 3D scene',
  parameters: sphereParams,
  execute: async (params) => {
    return await MapBuilderTools.addSphere(params as SphereParams);
  },
});

export const addCylinder = tool({
  description: 'Add a cylinder object to the 3D scene',
  parameters: cylinderParams,
  execute: async (params) => {
    return await MapBuilderTools.addCylinder(params as CylinderParams);
  },
});

export const addPlane = tool({
  description: 'Add a plane object to the 3D scene',
  parameters: planeParams,
  execute: async (params) => {
    return await MapBuilderTools.addPlane(params as PlaneParams);
  },
});

export const addDoor = tool({
  description: 'Add a door object to the 3D scene. A door is a box with a cutout, optionally with an arch (radius) at the top.',
  parameters: doorParams,
  execute: async (params) => {
    return await MapBuilderTools.addDoor(params as DoorParams);
  },
});

export const removeObject = tool({
  description: 'Remove an object from the 3D scene by its ID',
  parameters: z.object({
    id: z.string().describe('The ID of the object to remove'),
  }),
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
  parameters: z.object({
    id: z.string().describe('The ID of the object to get'),
  }),
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
  addDoor,
  removeObject,
  getObjects,
  getObject,
  getFullScene,
};
