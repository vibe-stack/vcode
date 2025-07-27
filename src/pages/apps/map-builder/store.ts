import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import * as THREE from 'three/webgpu';

export interface MapObject {
  id: string;
  type: 'box' | 'sphere' | 'cylinder' | 'plane' | 'cone' | 'door';
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
  color: string;
  material?: {
    metalness?: number;
    roughness?: number;
    transparent?: boolean;
    opacity?: number;
    side?: 'front' | 'back' | 'double';
    castShadow?: boolean;
    receiveShadow?: boolean;
  };
  geometry?: {
    // Box
    width?: number;
    height?: number;
    depth?: number;
    // Sphere
    radius?: number;
    // Cylinder & Cone
    radiusTop?: number;
    radiusBottom?: number;
    // Door
    cutoutWidth?: number;
    cutoutHeight?: number;
    cutoutRadius?: number;
  };
  visible?: boolean;
  name?: string;
}

export interface GridSettings {
  size: number;
  divisions: number;
  visible: boolean;
  snapToGrid: boolean;
}

export interface MapBuilderState {
  // Map data
  objects: MapObject[];
  selectedObjectIds: string[];
  
  // Grid settings
  grid: GridSettings;
  
  // Editor state
  activeTool: 'select' | 'move' | 'rotate' | 'scale' | 'add';
  activeShape: 'box' | 'sphere' | 'cylinder' | 'plane' | 'cone' | 'door';
  isCreating: boolean;
  creatingObject: MapObject | null;
  
  // Camera
  cameraPosition: [number, number, number];
  cameraTarget: [number, number, number];
  
  // Actions
  addObject: (object: Omit<MapObject, 'id'>) => void;
  updateObject: (id: string, updates: Partial<MapObject>) => void;
  deleteObject: (id: string) => void;
  deleteSelected: () => void;
  selectObject: (id: string, multi?: boolean) => void;
  clearSelection: () => void;
  duplicateSelected: () => void;
  
  // Grid actions
  updateGrid: (updates: Partial<GridSettings>) => void;
  snapToGrid: (value: number) => number;
  
  // Tool actions
  setActiveTool: (tool: MapBuilderState['activeTool']) => void;
  setActiveShape: (shape: MapBuilderState['activeShape']) => void;
  startCreating: (shape: MapBuilderState['activeShape']) => void;
  finishCreating: () => void;
  cancelCreating: () => void;
  updateCreatingObject: (updates: Partial<MapObject>) => void;
  
  // Import/Export
  importFromJSON: (json: string) => void;
  
  // Utility
  generateId: () => string;
  getObjectById: (id: string) => MapObject | undefined;
}

export const useMapBuilderStore = create<MapBuilderState>()(
  devtools(
    (set, get) => ({
      // Initial state
      objects: [],
      selectedObjectIds: [],
      
      grid: {
        size: 50,
        divisions: 50,
        visible: true,
        snapToGrid: true,
      },
      
      activeTool: 'select',
      activeShape: 'box',
      isCreating: false,
      creatingObject: null,
      
      cameraPosition: [10, 10, 10],
      cameraTarget: [0, 0, 0],
      
      // Actions
      addObject: (object) => set((state) => {
        const id = state.generateId();
        const newObject: MapObject = {
          ...object,
          id,
          name: object.name || `${object.type}_${id.slice(0, 6)}`,
        };
        return {
          objects: [...state.objects, newObject],
        };
      }),
      
      updateObject: (id, updates) => set((state) => ({
        objects: state.objects.map(obj => 
          obj.id === id ? { ...obj, ...updates } : obj
        ),
      })),
      
      deleteObject: (id) => set((state) => ({
        objects: state.objects.filter(obj => obj.id !== id),
        selectedObjectIds: state.selectedObjectIds.filter(selectedId => selectedId !== id),
      })),
      
      deleteSelected: () => set((state) => ({
        objects: state.objects.filter(obj => !state.selectedObjectIds.includes(obj.id)),
        selectedObjectIds: [],
      })),
      
      selectObject: (id, multi = false) => set((state) => {
        if (multi) {
          const isSelected = state.selectedObjectIds.includes(id);
          return {
            selectedObjectIds: isSelected
              ? state.selectedObjectIds.filter(selectedId => selectedId !== id)
              : [...state.selectedObjectIds, id],
          };
        }
        return { selectedObjectIds: [id] };
      }),
      
      clearSelection: () => set({ selectedObjectIds: [] }),
      
      duplicateSelected: () => set((state) => {
        const selectedObjects = state.objects.filter(obj => 
          state.selectedObjectIds.includes(obj.id)
        );
        
        const duplicatedObjects = selectedObjects.map(obj => ({
          ...obj,
          id: state.generateId(),
          position: [
            obj.position[0] + (state.grid.snapToGrid ? state.grid.size / state.grid.divisions : 1),
            obj.position[1],
            obj.position[2],
          ] as [number, number, number],
          name: `${obj.name}_copy`,
        }));
        
        return {
          objects: [...state.objects, ...duplicatedObjects],
          selectedObjectIds: duplicatedObjects.map(obj => obj.id),
        };
      }),
      
      // Grid actions
      updateGrid: (updates) => set((state) => ({
        grid: { ...state.grid, ...updates },
      })),
      
      snapToGrid: (value) => {
        const { grid } = get();
        if (!grid.snapToGrid) return value;
        const gridSize = grid.size / grid.divisions;
        return Math.round(value / gridSize) * gridSize;
      },
      
      // Tool actions
      setActiveTool: (tool) => set({ activeTool: tool }),
      setActiveShape: (shape) => set({ activeShape: shape }),
      
      startCreating: (shape) => set({
        isCreating: true,
        activeShape: shape,
        activeTool: 'add',
      }),
      
      finishCreating: () => set({
        isCreating: false,
        creatingObject: null,
      }),
      
      cancelCreating: () => set({
        isCreating: false,
        creatingObject: null,
      }),
      
      updateCreatingObject: (updates) => set((state) => ({
        creatingObject: state.creatingObject ? { ...state.creatingObject, ...updates } : null,
      })),
      
      // Import/Export
      importFromJSON: (json) => {
        try {
          const data = JSON.parse(json);
          set({
            objects: data.objects || [],
            grid: { ...get().grid, ...data.grid },
            selectedObjectIds: [],
          });
        } catch (error) {
          console.error('Failed to import JSON:', error);
        }
      },
      
      // Utility
      generateId: () => Math.random().toString(36).substr(2, 9),
      
      getObjectById: (id) => get().objects.find(obj => obj.id === id),
    }),
    { name: 'map-builder-store' }
  )
);
