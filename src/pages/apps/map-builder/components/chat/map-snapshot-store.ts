import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { MapObject } from '../../store';
import { useMapBuilderStore } from '../../store';

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
  // Store initial state for each message to allow proper reversion
  messageInitialStates: Map<string, MapObject[]>;
  
  // Actions
  createSnapshot: (sessionId: string, messageId: string, label: string, beforeState: MapObject[], afterState: MapObject[]) => string;
  setMessageInitialState: (messageId: string, initialState: MapObject[]) => void;
  getMessageInitialState: (messageId: string) => MapObject[] | null;
  acceptSnapshot: (snapshotId: string) => void;
  revertSnapshot: (snapshotId: string) => Promise<void>;
  getSessionSnapshots: (sessionId: string) => MapSnapshot[];
  getMessageSnapshots: (sessionId: string, messageId: string) => MapSnapshot[];
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
      messageInitialStates: new Map(),
      
      setMessageInitialState: (messageId, initialState) => {
        set((state) => {
          const newMap = new Map(state.messageInitialStates);
          newMap.set(messageId, JSON.parse(JSON.stringify(initialState))); // Deep clone
          return { messageInitialStates: newMap };
        });
      },
      
      getMessageInitialState: (messageId) => {
        return get().messageInitialStates.get(messageId) || null;
      },
      
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
        const mapStore = useMapBuilderStore.getState();
        
        // If we have a messageId, try to use the initial state for that message
        if (messageId) {
          const initialState = get().getMessageInitialState(messageId);
          if (initialState) {
            // Restore to the initial state before any tools were executed for this message
            mapStore.objects.splice(0, mapStore.objects.length, ...initialState);
          } else {
            // Fallback to earliest before state if no initial state stored
            const earliestSnapshot = snapshots.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())[0];
            mapStore.objects.splice(0, mapStore.objects.length, ...earliestSnapshot.beforeState);
          }
        } else {
          // For session-wide revert, use earliest before state
          const earliestSnapshot = snapshots.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())[0];
          mapStore.objects.splice(0, mapStore.objects.length, ...earliestSnapshot.beforeState);
        }
        
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
        
        console.log(`🔄 Reverting ${pendingSnapshots.length} pending snapshots for session ${sessionId}`);
        
        // Import the store here to avoid circular dependency
        const mapStore = useMapBuilderStore.getState();
        
        // Find the earliest message that has pending snapshots
        const earliestPendingSnapshot = pendingSnapshots.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())[0];
        const earliestMessageId = earliestPendingSnapshot.messageId;
        
        // Try to get the initial state for the earliest message
        const initialState = get().getMessageInitialState(earliestMessageId);
        if (initialState) {
          console.log(`✅ Restoring to initial state before AI changes (${initialState.length} objects)`);
          // Restore to the initial state before any tools were executed
          mapStore.objects.splice(0, mapStore.objects.length, ...initialState);
        } else {
          console.log(`⚠️ No initial state found, falling back to earliest snapshot before state`);
          // Fallback to the earliest before state
          mapStore.objects.splice(0, mapStore.objects.length, ...earliestPendingSnapshot.beforeState);
        }
        
        // Remove all pending snapshots for this session
        set((state) => ({
          snapshots: state.snapshots.filter(snapshot => 
            !(snapshot.sessionId === sessionId && !snapshot.accepted)
          )
        }));
        
        console.log(`✅ Successfully reverted all pending snapshots for session ${sessionId}`);
      },
      
      clearSessionSnapshots: (sessionId) => {
        set((state) => {
          // Clear snapshots and initial states for this session
          const newMessageInitialStates = new Map(state.messageInitialStates);
          const snapshots = state.snapshots.filter(snapshot => snapshot.sessionId === sessionId);
          
          // Remove initial states for messages in this session
          snapshots.forEach(snapshot => {
            newMessageInitialStates.delete(snapshot.messageId);
          });
          
          return {
            snapshots: state.snapshots.filter(snapshot => snapshot.sessionId !== sessionId),
            messageInitialStates: newMessageInitialStates
          };
        });
      },
      
      clearAll: () => {
        set({ 
          snapshots: [],
          messageInitialStates: new Map()
        });
      }
    }),
    {
      name: 'map-snapshot-store'
    }
  )
);
