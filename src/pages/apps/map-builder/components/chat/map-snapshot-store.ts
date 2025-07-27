import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { MapObject } from '../../store';

export interface MapSnapshot {
  id: string;
  sessionId: string;
  messageId: string;
  timestamp: Date;
  label: string;
  beforeState: MapObject[];
  afterState: MapObject[];
  accepted: boolean;
}

interface MapSnapshotState {
  snapshots: MapSnapshot[];
  
  // Actions
  createSnapshot: (sessionId: string, messageId: string, label: string, beforeState: MapObject[], afterState: MapObject[]) => string;
  acceptSnapshot: (snapshotId: string) => void;
  revertSnapshot: (snapshotId: string) => Promise<void>;
  getSessionSnapshots: (sessionId: string) => MapSnapshot[];
  getMessageSnapshots: (sessionId: string, messageId: string) => MapSnapshot[];
  getPendingSnapshots: (sessionId: string) => MapSnapshot[];
  acceptAllSnapshots: (sessionId: string, messageId?: string) => void;
  revertAllSnapshots: (sessionId: string, messageId?: string) => Promise<void>;
  acceptAllPendingSnapshots: (sessionId: string) => void;
  revertAllPendingSnapshots: (sessionId: string) => Promise<void>;
  clearSessionSnapshots: (sessionId: string) => void;
  clearAll: () => void;
}

export const useMapSnapshotStore = create<MapSnapshotState>()(
  devtools(
    (set, get) => ({
      snapshots: [],
      
      createSnapshot: (sessionId, messageId, label, beforeState, afterState) => {
        const id = `snapshot_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        const snapshot: MapSnapshot = {
          id,
          sessionId,
          messageId,
          timestamp: new Date(),
          label,
          beforeState: JSON.parse(JSON.stringify(beforeState)), // Deep clone
          afterState: JSON.parse(JSON.stringify(afterState)), // Deep clone
          accepted: false
        };
        
        set((state) => ({
          snapshots: [...state.snapshots, snapshot]
        }));
        
        return id;
      },
      
      acceptSnapshot: (snapshotId) => {
        set((state) => ({
          snapshots: state.snapshots.map(snapshot =>
            snapshot.id === snapshotId
              ? { ...snapshot, accepted: true }
              : snapshot
          )
        }));
      },
      
      revertSnapshot: async (snapshotId) => {
        const snapshot = get().snapshots.find(s => s.id === snapshotId);
        if (!snapshot) return;
        
        // Import the store here to avoid circular dependency
        const { useMapBuilderStore } = await import('../../store');
        const mapStore = useMapBuilderStore.getState();
        
        // Restore the before state
        mapStore.objects.splice(0, mapStore.objects.length, ...snapshot.beforeState);
        
        // Remove the snapshot
        set((state) => ({
          snapshots: state.snapshots.filter(s => s.id !== snapshotId)
        }));
      },
      
      getSessionSnapshots: (sessionId) => {
        return get().snapshots.filter(snapshot => snapshot.sessionId === sessionId);
      },
      
      getMessageSnapshots: (sessionId, messageId) => {
        return get().snapshots.filter(snapshot => 
          snapshot.sessionId === sessionId && snapshot.messageId === messageId
        );
      },
      
      getPendingSnapshots: (sessionId) => {
        return get().snapshots.filter(snapshot => 
          snapshot.sessionId === sessionId && !snapshot.accepted
        );
      },
      
      acceptAllSnapshots: (sessionId, messageId) => {
        set((state) => ({
          snapshots: state.snapshots.map(snapshot => {
            if (snapshot.sessionId === sessionId && 
                (!messageId || snapshot.messageId === messageId)) {
              return { ...snapshot, accepted: true };
            }
            return snapshot;
          })
        }));
      },
      
      revertAllSnapshots: async (sessionId, messageId) => {
        const snapshots = get().snapshots.filter(snapshot => 
          snapshot.sessionId === sessionId && 
          (!messageId || snapshot.messageId === messageId) &&
          !snapshot.accepted
        );
        
        if (snapshots.length === 0) return;
        
        // Import the store here to avoid circular dependency
        const { useMapBuilderStore } = await import('../../store');
        const mapStore = useMapBuilderStore.getState();
        
        // Revert to the earliest before state
        const earliestSnapshot = snapshots.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())[0];
        mapStore.objects.splice(0, mapStore.objects.length, ...earliestSnapshot.beforeState);
        
        // Remove all related snapshots
        set((state) => ({
          snapshots: state.snapshots.filter(snapshot => 
            !(snapshot.sessionId === sessionId && 
              (!messageId || snapshot.messageId === messageId) &&
              !snapshot.accepted)
          )
        }));
      },
      
      acceptAllPendingSnapshots: (sessionId) => {
        set((state) => ({
          snapshots: state.snapshots.map(snapshot => {
            if (snapshot.sessionId === sessionId && !snapshot.accepted) {
              return { ...snapshot, accepted: true };
            }
            return snapshot;
          })
        }));
      },
      
      revertAllPendingSnapshots: async (sessionId) => {
        const pendingSnapshots = get().snapshots.filter(snapshot => 
          snapshot.sessionId === sessionId && !snapshot.accepted
        );
        
        if (pendingSnapshots.length === 0) return;
        
        // Import the store here to avoid circular dependency
        const { useMapBuilderStore } = await import('../../store');
        const mapStore = useMapBuilderStore.getState();
        
        // Revert to the earliest before state
        const earliestSnapshot = pendingSnapshots.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())[0];
        mapStore.objects.splice(0, mapStore.objects.length, ...earliestSnapshot.beforeState);
        
        // Remove all pending snapshots for this session
        set((state) => ({
          snapshots: state.snapshots.filter(snapshot => 
            !(snapshot.sessionId === sessionId && !snapshot.accepted)
          )
        }));
      },
      
      clearSessionSnapshots: (sessionId) => {
        set((state) => ({
          snapshots: state.snapshots.filter(snapshot => snapshot.sessionId !== sessionId)
        }));
      },
      
      clearAll: () => {
        set({ snapshots: [] });
      }
    }),
    {
      name: 'map-snapshot-store'
    }
  )
);
