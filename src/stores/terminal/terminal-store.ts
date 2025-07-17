import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

export interface TerminalSplit {
  id: string;
  terminalId: string;
  title: string;
  cwd: string;
  pid: number;
}

export interface TerminalTab {
  id: string;
  title: string;
  cwd: string;
  pid: number;
  isActive: boolean;
  splits: TerminalSplit[];
  activeSplitId: string | null;
}

export interface TerminalState {
  // Terminal tabs
  tabs: TerminalTab[];
  activeTabId: string | null;
  
  // Terminal visibility
  isVisible: boolean;
  height: number;
  
  // Actions
  createTab: (terminalInfo: { id: string; title: string; cwd: string; pid: number }) => void;
  removeTab: (tabId: string) => void;
  setActiveTab: (tabId: string) => void;
  updateTab: (tabId: string, updates: Partial<Omit<TerminalTab, 'splits' | 'activeSplitId'>>) => void;
  
  createSplit: (tabId: string, terminalInfo: { id: string; title: string; cwd: string; pid: number }) => void;
  removeSplit: (tabId: string, splitId: string) => void;
  setActiveSplit: (tabId: string, splitId: string | null) => void;
  updateSplit: (tabId: string, splitId: string, updates: Partial<TerminalSplit>) => void;
  
  setVisible: (visible: boolean) => void;
  setHeight: (height: number) => void;
  
  // Get splits for specific tab
  getTabSplits: (tabId: string) => TerminalSplit[];
  getActiveTab: () => TerminalTab | null;
  
  // Cleanup
  cleanup: () => void;
}

export const useTerminalStore = create<TerminalState>()(
  subscribeWithSelector((set, get) => ({
    tabs: [],
    activeTabId: null,
    isVisible: false,
    height: 300,

    createTab: (terminalInfo) => {
      const newTab: TerminalTab = {
        id: terminalInfo.id,
        title: terminalInfo.title,
        cwd: terminalInfo.cwd,
        pid: terminalInfo.pid,
        isActive: true,
        splits: [],
        activeSplitId: null
      };

      set((state) => {
        // Mark all other tabs as inactive
        const updatedTabs = state.tabs.map(tab => ({ ...tab, isActive: false }));
        
        return {
          tabs: [...updatedTabs, newTab],
          activeTabId: newTab.id,
          isVisible: true
        };
      });
    },

    removeTab: (tabId) => {
      set((state) => {
        const tabToRemove = state.tabs.find(tab => tab.id === tabId);
        const updatedTabs = state.tabs.filter(tab => tab.id !== tabId);
        let newActiveTabId = state.activeTabId;
        
        // If removing active tab, select another one
        if (state.activeTabId === tabId) {
          newActiveTabId = updatedTabs.length > 0 ? updatedTabs[0].id : null;
        }
        
        // Update active state
        const finalTabs = updatedTabs.map(tab => ({
          ...tab,
          isActive: tab.id === newActiveTabId
        }));
        
        return {
          tabs: finalTabs,
          activeTabId: newActiveTabId,
          isVisible: finalTabs.length > 0
        };
      });
    },

    setActiveTab: (tabId) => {
      set((state) => {
        const updatedTabs = state.tabs.map(tab => ({
          ...tab,
          isActive: tab.id === tabId
        }));
        
        return {
          tabs: updatedTabs,
          activeTabId: tabId
        };
      });
    },

    updateTab: (tabId, updates) => {
      set((state) => ({
        tabs: state.tabs.map(tab => 
          tab.id === tabId ? { ...tab, ...updates } : tab
        )
      }));
    },

    createSplit: (tabId, terminalInfo) => {
      const newSplit: TerminalSplit = {
        id: `split-${Date.now()}`,
        terminalId: terminalInfo.id,
        title: terminalInfo.title,
        cwd: terminalInfo.cwd,
        pid: terminalInfo.pid
      };

      set((state) => ({
        tabs: state.tabs.map(tab => 
          tab.id === tabId 
            ? { 
                ...tab, 
                splits: [...tab.splits, newSplit],
                activeSplitId: newSplit.id
              }
            : tab
        )
      }));
    },

    removeSplit: (tabId, splitId) => {
      set((state) => ({
        tabs: state.tabs.map(tab => {
          if (tab.id !== tabId) return tab;
          
          const updatedSplits = tab.splits.filter(split => split.id !== splitId);
          let newActiveSplitId = tab.activeSplitId;
          
          // If removing active split, select another one
          if (tab.activeSplitId === splitId) {
            newActiveSplitId = updatedSplits.length > 0 ? updatedSplits[0].id : null;
          }
          
          return {
            ...tab,
            splits: updatedSplits,
            activeSplitId: newActiveSplitId
          };
        })
      }));
    },

    setActiveSplit: (tabId, splitId) => {
      set((state) => ({
        tabs: state.tabs.map(tab => 
          tab.id === tabId 
            ? { ...tab, activeSplitId: splitId }
            : tab
        )
      }));
    },

    updateSplit: (tabId, splitId, updates) => {
      set((state) => ({
        tabs: state.tabs.map(tab => 
          tab.id === tabId 
            ? {
                ...tab,
                splits: tab.splits.map(split => 
                  split.id === splitId ? { ...split, ...updates } : split
                )
              }
            : tab
        )
      }));
    },

    setVisible: (visible) => {
      set({ isVisible: visible });
    },

    setHeight: (height) => {
      set({ height });
    },

    getTabSplits: (tabId) => {
      const state = get();
      const tab = state.tabs.find(t => t.id === tabId);
      return tab?.splits || [];
    },

    getActiveTab: () => {
      const state = get();
      return state.tabs.find(tab => tab.isActive) || null;
    },

    cleanup: () => {
      set({
        tabs: [],
        activeTabId: null,
        isVisible: false
      });
    }
  }))
);
