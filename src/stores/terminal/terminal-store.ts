import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";

export interface TerminalTab {
  id: string;
  title: string;
  cwd: string;
  pid: number;
  isActive: boolean;
}

export interface TerminalSplit {
  id: string;
  terminalId: string;
  title: string;
  cwd: string;
  pid: number;
}

export interface TerminalState {
  // Terminal tabs
  tabs: TerminalTab[];
  activeTabId: string | null;

  // Terminal splits within active tab
  splits: TerminalSplit[];
  activeSplitId: string | null;

  // Terminal visibility
  isVisible: boolean;
  height: number;

  // Actions
  createTab: (terminalInfo: {
    id: string;
    title: string;
    cwd: string;
    pid: number;
  }) => void;
  removeTab: (tabId: string) => void;
  setActiveTab: (tabId: string) => void;
  updateTab: (tabId: string, updates: Partial<TerminalTab>) => void;

  createSplit: (
    tabId: string,
    terminalInfo: { id: string; title: string; cwd: string; pid: number },
  ) => void;
  removeSplit: (splitId: string) => void;
  setActiveSplit: (splitId: string) => void;
  updateSplit: (splitId: string, updates: Partial<TerminalSplit>) => void;

  setVisible: (visible: boolean) => void;
  setHeight: (height: number) => void;

  // Get splits for active tab
  getActiveSplits: () => TerminalSplit[];

  // Cleanup
  cleanup: () => void;
}

export const useTerminalStore = create<TerminalState>()(
  subscribeWithSelector((set, get) => ({
    tabs: [],
    activeTabId: null,
    splits: [],
    activeSplitId: null,
    isVisible: false,
    height: 300,

    createTab: (terminalInfo) => {
      const newTab: TerminalTab = {
        id: terminalInfo.id,
        title: terminalInfo.title,
        cwd: terminalInfo.cwd,
        pid: terminalInfo.pid,
        isActive: true,
      };

      set((state) => {
        // Mark all other tabs as inactive
        const updatedTabs = state.tabs.map((tab) => ({
          ...tab,
          isActive: false,
        }));

        return {
          tabs: [...updatedTabs, newTab],
          activeTabId: newTab.id,
          splits: [],
          activeSplitId: null,
          isVisible: true,
        };
      });
    },

    removeTab: (tabId) => {
      set((state) => {
        const updatedTabs = state.tabs.filter((tab) => tab.id !== tabId);
        let newActiveTabId = state.activeTabId;

        // If removing active tab, select another one
        if (state.activeTabId === tabId) {
          newActiveTabId = updatedTabs.length > 0 ? updatedTabs[0].id : null;
        }

        // Update active state
        const finalTabs = updatedTabs.map((tab) => ({
          ...tab,
          isActive: tab.id === newActiveTabId,
        }));

        // Remove splits for this tab
        const updatedSplits = state.splits.filter(
          (split) => split.terminalId !== tabId,
        );

        return {
          tabs: finalTabs,
          activeTabId: newActiveTabId,
          splits: updatedSplits,
          activeSplitId: updatedSplits.length > 0 ? updatedSplits[0].id : null,
          isVisible: finalTabs.length > 0,
        };
      });
    },

    setActiveTab: (tabId) => {
      set((state) => {
        const updatedTabs = state.tabs.map((tab) => ({
          ...tab,
          isActive: tab.id === tabId,
        }));

        return {
          tabs: updatedTabs,
          activeTabId: tabId,
          splits: [],
          activeSplitId: null,
        };
      });
    },

    updateTab: (tabId, updates) => {
      set((state) => ({
        tabs: state.tabs.map((tab) =>
          tab.id === tabId ? { ...tab, ...updates } : tab,
        ),
      }));
    },

    createSplit: (tabId, terminalInfo) => {
      const newSplit: TerminalSplit = {
        id: `split-${Date.now()}`,
        terminalId: terminalInfo.id,
        title: terminalInfo.title,
        cwd: terminalInfo.cwd,
        pid: terminalInfo.pid,
      };

      set((state) => ({
        splits: [...state.splits, newSplit],
        activeSplitId: newSplit.id,
      }));
    },

    removeSplit: (splitId) => {
      set((state) => {
        const updatedSplits = state.splits.filter(
          (split) => split.id !== splitId,
        );
        let newActiveSplitId = state.activeSplitId;

        // If removing active split, select another one
        if (state.activeSplitId === splitId) {
          newActiveSplitId =
            updatedSplits.length > 0 ? updatedSplits[0].id : null;
        }

        return {
          splits: updatedSplits,
          activeSplitId: newActiveSplitId,
        };
      });
    },

    setActiveSplit: (splitId) => {
      set({ activeSplitId: splitId });
    },

    updateSplit: (splitId, updates) => {
      set((state) => ({
        splits: state.splits.map((split) =>
          split.id === splitId ? { ...split, ...updates } : split,
        ),
      }));
    },

    setVisible: (visible) => {
      set({ isVisible: visible });
    },

    setHeight: (height) => {
      set({ height });
    },

    getActiveSplits: () => {
      const state = get();
      return state.splits;
    },

    cleanup: () => {
      set({
        tabs: [],
        activeTabId: null,
        splits: [],
        activeSplitId: null,
        isVisible: false,
      });
    },
  })),
);
