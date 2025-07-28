import { AgentTool } from '@/lib/agent-chat';
import { MapBuilderTools } from './map-builder-tools';
import { useMapSnapshotStore } from './map-snapshot-store';
import { useMapBuilderStore } from '../../store';

export const mapBuilderAgentTools: AgentTool[] = [
  {
    name: 'addCube',
    description: 'Add a cube/box object to the 3D scene',
    parameters: {
      type: 'object',
      properties: {
        position: { type: 'array', items: { type: 'number' }, minItems: 3, maxItems: 3, description: 'Position [x, y, z] (default: [0, 0, 0])' },
        rotation: { type: 'array', items: { type: 'number' }, minItems: 3, maxItems: 3, description: 'Rotation [x, y, z] in radians (default: [0, 0, 0])' },
        color: { type: 'string', description: 'Hex color (default: #ffffff)' },
        name: { type: 'string', description: 'Name for the object' },
        width: { type: 'number', description: 'Width of the cube (default: 1)' },
        height: { type: 'number', description: 'Height of the cube (default: 1)' },
        depth: { type: 'number', description: 'Depth of the cube (default: 1)' },
      }
    },
    execute: async (args, context) => {
      // Get current state and capture snapshot
      const currentState = useMapBuilderStore.getState().objects;
      const result = await MapBuilderTools.addCube(args);
      
      // Capture snapshot if context provides sessionId and messageId
      if (context?.sessionId && context?.messageId) {
        const afterState = useMapBuilderStore.getState().objects;
        const snapshotStore = useMapSnapshotStore.getState();
        
        const initialState = snapshotStore.getMessageInitialState(context.messageId) || currentState;
        snapshotStore.createSnapshot(
          context.sessionId,
          context.messageId,
          'addCube executed',
          initialState,
          afterState
        );
      }
      
      return result;
    },
    requiresConfirmation: false,
  },
  {
    name: 'addSphere',
    description: 'Add a sphere object to the 3D scene',
    parameters: {
      type: 'object',
      properties: {
        position: { type: 'array', items: { type: 'number' }, minItems: 3, maxItems: 3, description: 'Position [x, y, z] (default: [0, 0, 0])' },
        rotation: { type: 'array', items: { type: 'number' }, minItems: 3, maxItems: 3, description: 'Rotation [x, y, z] in radians (default: [0, 0, 0])' },
        color: { type: 'string', description: 'Hex color (default: #ffffff)' },
        name: { type: 'string', description: 'Name for the object' },
        radius: { type: 'number', description: 'Radius of the sphere (default: 1)' },
      }
    },
    execute: async (args, context) => {
      const currentState = useMapBuilderStore.getState().objects;
      const result = await MapBuilderTools.addSphere(args);
      
      if (context?.sessionId && context?.messageId) {
        const afterState = useMapBuilderStore.getState().objects;
        const snapshotStore = useMapSnapshotStore.getState();
        
        const initialState = snapshotStore.getMessageInitialState(context.messageId) || currentState;
        snapshotStore.createSnapshot(
          context.sessionId,
          context.messageId,
          'addSphere executed',
          initialState,
          afterState
        );
      }
      
      return result;
    },
    requiresConfirmation: false,
  },
  {
    name: 'addCylinder',
    description: 'Add a cylinder object to the 3D scene',
    parameters: {
      type: 'object',
      properties: {
        position: { type: 'array', items: { type: 'number' }, minItems: 3, maxItems: 3, description: 'Position [x, y, z] (default: [0, 0, 0])' },
        rotation: { type: 'array', items: { type: 'number' }, minItems: 3, maxItems: 3, description: 'Rotation [x, y, z] in radians (default: [0, 0, 0])' },
        color: { type: 'string', description: 'Hex color (default: #ffffff)' },
        name: { type: 'string', description: 'Name for the object' },
        radius: { type: 'number', description: 'Radius of the cylinder (default: 1)' },
        height: { type: 'number', description: 'Height of the cylinder (default: 1)' },
      }
    },
    execute: async (args, context) => {
      const currentState = useMapBuilderStore.getState().objects;
      const result = await MapBuilderTools.addCylinder(args);
      
      if (context?.sessionId && context?.messageId) {
        const afterState = useMapBuilderStore.getState().objects;
        const snapshotStore = useMapSnapshotStore.getState();
        
        const initialState = snapshotStore.getMessageInitialState(context.messageId) || currentState;
        snapshotStore.createSnapshot(
          context.sessionId,
          context.messageId,
          'addCylinder executed',
          initialState,
          afterState
        );
      }
      
      return result;
    },
    requiresConfirmation: false,
  },
  {
    name: 'addPlane',
    description: 'Add a plane object to the 3D scene',
    parameters: {
      type: 'object',
      properties: {
        position: { type: 'array', items: { type: 'number' }, minItems: 3, maxItems: 3, description: 'Position [x, y, z] (default: [0, 0, 0])' },
        rotation: { type: 'array', items: { type: 'number' }, minItems: 3, maxItems: 3, description: 'Rotation [x, y, z] in radians (default: [0, 0, 0])' },
        color: { type: 'string', description: 'Hex color (default: #ffffff)' },
        name: { type: 'string', description: 'Name for the object' },
        width: { type: 'number', description: 'Width of the plane (default: 1)' },
        height: { type: 'number', description: 'Height of the plane (default: 1)' },
      }
    },
    execute: async (args, context) => {
      const currentState = useMapBuilderStore.getState().objects;
      const result = await MapBuilderTools.addPlane(args);
      
      if (context?.sessionId && context?.messageId) {
        const afterState = useMapBuilderStore.getState().objects;
        const snapshotStore = useMapSnapshotStore.getState();
        
        const initialState = snapshotStore.getMessageInitialState(context.messageId) || currentState;
        snapshotStore.createSnapshot(
          context.sessionId,
          context.messageId,
          'addPlane executed',
          initialState,
          afterState
        );
      }
      
      return result;
    },
    requiresConfirmation: false,
  },
  {
    name: 'addDoor',
    description: 'Add a door object to the 3D scene. A door is a box with a cutout, optionally with an arch (radius) at the top.',
    parameters: {
      type: 'object',
      properties: {
        position: { type: 'array', items: { type: 'number' }, minItems: 3, maxItems: 3, description: 'Position [x, y, z] (default: [0, 0, 0])' },
        rotation: { type: 'array', items: { type: 'number' }, minItems: 3, maxItems: 3, description: 'Rotation [x, y, z] in radians (default: [0, 0, 0])' },
        color: { type: 'string', description: 'Hex color (default: #8B4513)' },
        name: { type: 'string', description: 'Name for the object' },
        width: { type: 'number', description: 'Width of the door (default: 2)' },
        height: { type: 'number', description: 'Height of the door (default: 2.5)' },
        depth: { type: 'number', description: 'Depth of the door (default: 0.2)' },
        cutoutWidth: { type: 'number', description: 'Width of the cutout (default: 0.8)' },
        cutoutHeight: { type: 'number', description: 'Height of the cutout (default: 1.8)' },
        cutoutRadius: { type: 'number', description: 'Radius of the cutout arch (default: 0)' },
      }
    },
    execute: async (args, context) => {
      const currentState = useMapBuilderStore.getState().objects;
      const result = await MapBuilderTools.addDoor(args);
      
      if (context?.sessionId && context?.messageId) {
        const afterState = useMapBuilderStore.getState().objects;
        const snapshotStore = useMapSnapshotStore.getState();
        
        const initialState = snapshotStore.getMessageInitialState(context.messageId) || currentState;
        snapshotStore.createSnapshot(
          context.sessionId,
          context.messageId,
          'addDoor executed',
          initialState,
          afterState
        );
      }
      
      return result;
    },
    requiresConfirmation: false,
  },
  {
    name: 'removeObject',
    description: 'Remove an object from the 3D scene by its ID',
    parameters: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'The ID of the object to remove' },
      },
      required: ['id']
    },
    execute: async (args, context) => {
      const currentState = useMapBuilderStore.getState().objects;
      const result = await MapBuilderTools.removeObject(args.id);
      
      if (context?.sessionId && context?.messageId) {
        const afterState = useMapBuilderStore.getState().objects;
        const snapshotStore = useMapSnapshotStore.getState();
        
        const initialState = snapshotStore.getMessageInitialState(context.messageId) || currentState;
        snapshotStore.createSnapshot(
          context.sessionId,
          context.messageId,
          'removeObject executed',
          initialState,
          afterState
        );
      }
      
      return result;
    },
    requiresConfirmation: false,
  },
  {
    name: 'getObjects',
    description: 'Get a list of all objects in the scene with their IDs and types',
    parameters: {
      type: 'object',
      properties: {}
    },
    execute: async () => {
      return await MapBuilderTools.getObjects();
    },
    requiresConfirmation: false,
  },
  {
    name: 'getObject',
    description: 'Get all data for a specific object by its ID',
    parameters: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'The ID of the object to get' },
      },
      required: ['id']
    },
    execute: async (args) => {
      return await MapBuilderTools.getObject(args.id);
    },
    requiresConfirmation: false,
  },
  {
    name: 'getFullScene',
    description: 'Get all objects in the scene including all their data. WARNING: This can be costly on large scenes!',
    parameters: {
      type: 'object',
      properties: {}
    },
    execute: async () => {
      return await MapBuilderTools.getFullScene();
    },
    requiresConfirmation: false,
  },
];