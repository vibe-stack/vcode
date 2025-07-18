import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { persist } from "zustand/middleware";

export type EditorContentView = "code" | "agents" | "kanban";
export type FileExplorerTab = "files" | "git" | "tools" | "extensions" | "themes";

export interface EditorContentState {
  // Individual panel toggles
  codeVisible: boolean;
  agentsVisible: boolean;
  kanbanVisible: boolean;
  settingsVisible: boolean;
  
  // Toggle functions
  toggleCode: () => void;
  toggleAgents: () => void;
  toggleKanban: () => void;
  toggleSettings: () => void;
  
  // File explorer tab state
  fileExplorerTab: FileExplorerTab;
  setFileExplorerTab: (tab: FileExplorerTab) => void;
  
  // Legacy view property for backward compatibility
  view: EditorContentView;
  setView: (view: EditorContentView) => void;
  
  leftPanelSize: number; // Optional size for left panel
  rightPanelSize: number; // Optional size for right panel
  onResizeLeftPanel: (size: number) => void; // Callback for resizing left panel
  onResizeRightPanel: (size: number) => void; // Callback for resizing right panel
}

export const useEditorContentStore = create<EditorContentState>()(
  persist(
    immer((set) => ({
      // Individual panel toggles - default: code and agents on, kanban and settings off
      codeVisible: true,
      agentsVisible: true,
      kanbanVisible: false,
      settingsVisible: false,
      
      // Toggle functions
      toggleCode: () =>
        set((state) => {
          state.codeVisible = !state.codeVisible;
        }),
      toggleAgents: () =>
        set((state) => {
          state.agentsVisible = !state.agentsVisible;
          // Hide settings when showing agents
          if (state.agentsVisible) {
            state.settingsVisible = false;
          }
        }),
      toggleKanban: () =>
        set((state) => {
          state.kanbanVisible = !state.kanbanVisible;
        }),
      toggleSettings: () =>
        set((state) => {
          state.settingsVisible = !state.settingsVisible;
          // Hide agents when showing settings
          if (state.settingsVisible) {
            state.agentsVisible = false;
          }
        }),
      
      // File explorer tab state
      fileExplorerTab: "files",
      setFileExplorerTab: (tab) =>
        set((state) => {
          state.fileExplorerTab = tab;
        }),
      
      // Legacy view property for backward compatibility
      view: "code",
      setView: (view) =>
        set((state) => {
          state.view = view;
          // Update individual toggles based on view for backward compatibility
          if (view === "code") {
            state.codeVisible = true;
            state.agentsVisible = true;
            state.kanbanVisible = false;
          } else if (view === "agents") {
            state.codeVisible = false;
            state.agentsVisible = true;
            state.kanbanVisible = false;
          } else if (view === /* In the TypeScript code snippet provided, `"kanban"` is being used as a
          type in the `EditorContentView` type alias. */
            "kanban") {
            state.codeVisible = true;
            state.agentsVisible = false;
            state.kanbanVisible = true;
          }
        }),
      
      leftPanelSize: 20, // Default size for left panel
      rightPanelSize: 20, // Default size for right panel
      onResizeLeftPanel: (size) =>
        set((state) => {
          state.leftPanelSize = size;
        }),
      onResizeRightPanel: (size) =>
        set((state) => {
          state.rightPanelSize = size;
        }),
    })),
    {
      name: "editor-content-store", // unique name in storage
      partialize: (state) => ({
        codeVisible: state.codeVisible,
        agentsVisible: state.agentsVisible,
        kanbanVisible: state.kanbanVisible,
        settingsVisible: state.settingsVisible,
        fileExplorerTab: state.fileExplorerTab,
        view: state.view,
        leftPanelSize: state.leftPanelSize,
        rightPanelSize: state.rightPanelSize,
      }),
    },
  ),
);

export function useEditorContentView() {
  const { view, setView } = useEditorContentStore();
  return { view, setView };
}
