import { MapObject } from '../store';

export interface MapTemplate {
  id: string;
  name: string;
  description: string;
  objects: Omit<MapObject, 'id'>[];
  thumbnail?: string;
}

export const mapTemplates: MapTemplate[] = [
  {
    id: 'empty',
    name: 'Empty Scene',
    description: 'Start with a clean slate',
    objects: [],
  },
  {
    id: 'simple-room',
    name: 'Simple Room',
    description: 'A basic room layout with walls and floor',
    objects: [
      // Floor
      {
        type: 'plane',
        position: [0, 0, 0],
        rotation: [-Math.PI / 2, 0, 0],
        scale: [10, 0.1, 10],
        color: '#8b8b8b',
        name: 'Floor',
        material: { roughness: 0.8 },
      },
      // Walls
      {
        type: 'box',
        position: [0, 2.5, -5],
        rotation: [0, 0, 0],
        scale: [10, 5, 0.2],
        color: '#f0f0f0',
        name: 'Wall_Back',
        material: { roughness: 0.9 },
      },
      {
        type: 'box',
        position: [-5, 2.5, 0],
        rotation: [0, 0, 0],
        scale: [0.2, 5, 10],
        color: '#f0f0f0',
        name: 'Wall_Left',
        material: { roughness: 0.9 },
      },
      {
        type: 'box',
        position: [5, 2.5, 0],
        rotation: [0, 0, 0],
        scale: [0.2, 5, 10],
        color: '#f0f0f0',
        name: 'Wall_Right',
        material: { roughness: 0.9 },
      },
      {
        type: 'box',
        position: [0, 2.5, 5],
        rotation: [0, 0, 0],
        scale: [10, 5, 0.2],
        color: '#f0f0f0',
        name: 'Wall_Front',
        material: { roughness: 0.9 },
      },
    ],
  },
  {
    id: 'platform-game',
    name: 'Platformer Level',
    description: 'Basic platformer game layout',
    objects: [
      // Ground platforms
      {
        type: 'box',
        position: [0, 0.5, 0],
        rotation: [0, 0, 0],
        scale: [4, 1, 2],
        color: '#4a5568',
        name: 'Ground_Platform',
      },
      {
        type: 'box',
        position: [6, 1.5, 0],
        rotation: [0, 0, 0],
        scale: [3, 1, 2],
        color: '#4a5568',
        name: 'Platform_1',
      },
      {
        type: 'box',
        position: [12, 3, 0],
        rotation: [0, 0, 0],
        scale: [3, 1, 2],
        color: '#4a5568',
        name: 'Platform_2',
      },
      {
        type: 'box',
        position: [18, 2, 0],
        rotation: [0, 0, 0],
        scale: [4, 1, 2],
        color: '#4a5568',
        name: 'Platform_3',
      },
      // Obstacles
      {
        type: 'cylinder',
        position: [3, 2, 0],
        rotation: [0, 0, 0],
        scale: [0.5, 2, 0.5],
        color: '#e53e3e',
        name: 'Obstacle_1',
      },
      {
        type: 'cone',
        position: [9, 3, 0],
        rotation: [0, 0, 0],
        scale: [0.8, 1.5, 0.8],
        color: '#e53e3e',
        name: 'Obstacle_2',
      },
    ],
  },
  {
    id: 'maze-start',
    name: 'Maze Starter',
    description: 'Basic maze layout to build upon',
    objects: [
      // Outer walls
      {
        type: 'box',
        position: [0, 1, -8],
        rotation: [0, 0, 0],
        scale: [16, 2, 0.5],
        color: '#2d3748',
        name: 'Maze_Wall_North',
      },
      {
        type: 'box',
        position: [0, 1, 8],
        rotation: [0, 0, 0],
        scale: [16, 2, 0.5],
        color: '#2d3748',
        name: 'Maze_Wall_South',
      },
      {
        type: 'box',
        position: [-8, 1, 0],
        rotation: [0, 0, 0],
        scale: [0.5, 2, 16],
        color: '#2d3748',
        name: 'Maze_Wall_West',
      },
      {
        type: 'box',
        position: [8, 1, 0],
        rotation: [0, 0, 0],
        scale: [0.5, 2, 16],
        color: '#2d3748',
        name: 'Maze_Wall_East',
      },
      // Inner maze walls
      {
        type: 'box',
        position: [-4, 1, -4],
        rotation: [0, 0, 0],
        scale: [0.5, 2, 8],
        color: '#4a5568',
        name: 'Maze_Inner_1',
      },
      {
        type: 'box',
        position: [0, 1, 0],
        rotation: [0, 0, 0],
        scale: [8, 2, 0.5],
        color: '#4a5568',
        name: 'Maze_Inner_2',
      },
      {
        type: 'box',
        position: [4, 1, 4],
        rotation: [0, 0, 0],
        scale: [0.5, 2, 8],
        color: '#4a5568',
        name: 'Maze_Inner_3',
      },
      // Floor
      {
        type: 'plane',
        position: [0, 0, 0],
        rotation: [-Math.PI / 2, 0, 0],
        scale: [16, 0.1, 16],
        color: '#e2e8f0',
        name: 'Maze_Floor',
        material: { roughness: 0.8 },
      },
    ],
  },
  {
    id: 'showcase',
    name: 'Shape Showcase',
    description: 'Examples of all available shapes',
    objects: [
      {
        type: 'box',
        position: [-4, 1, 0],
        rotation: [0, 0.3, 0],
        scale: [1.5, 1.5, 1.5],
        color: '#3182ce',
        name: 'Example_Box',
        material: { metalness: 0.2, roughness: 0.3 },
      },
      {
        type: 'sphere',
        position: [-2, 1, 0],
        rotation: [0, 0, 0],
        scale: [1, 1, 1],
        color: '#38a169',
        name: 'Example_Sphere',
        material: { metalness: 0.8, roughness: 0.1 },
      },
      {
        type: 'cylinder',
        position: [0, 1.5, 0],
        rotation: [0, 0, 0],
        scale: [0.8, 3, 0.8],
        color: '#d69e2e',
        name: 'Example_Cylinder',
        material: { metalness: 0.5, roughness: 0.4 },
      },
      {
        type: 'cone',
        position: [2, 1, 0],
        rotation: [0, 0, 0],
        scale: [1, 2, 1],
        color: '#e53e3e',
        name: 'Example_Cone',
        material: { metalness: 0.1, roughness: 0.7 },
      },
      {
        type: 'plane',
        position: [4, 1.5, 0],
        rotation: [0, 0, 0],
        scale: [2, 2, 0.1],
        color: '#805ad5',
        name: 'Example_Plane',
        material: { metalness: 0, roughness: 0.9 },
      },
      // Base platform
      {
        type: 'plane',
        position: [0, 0, 0],
        rotation: [-Math.PI / 2, 0, 0],
        scale: [12, 0.1, 6],
        color: '#f7fafc',
        name: 'Showcase_Base',
        material: { roughness: 0.8 },
      },
    ],
  },
];

export function getTemplateById(id: string): MapTemplate | undefined {
  return mapTemplates.find(template => template.id === id);
}

export function createObjectsFromTemplate(template: MapTemplate, generateId: () => string): MapObject[] {
  return template.objects.map(obj => ({
    ...obj,
    id: generateId(),
  }));
}
