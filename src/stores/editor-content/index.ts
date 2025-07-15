import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { persist } from 'zustand/middleware';

export type EditorContentView = 'code' | 'agents';

export interface EditorContentState {
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
            view: 'code',
            setView: (view) => set((state) => {
                state.view = view;
            }),
            leftPanelSize: 20, // Default size for left panel
            rightPanelSize: 20, // Default size for right panel
            onResizeLeftPanel: (size) => set((state) => {
                state.leftPanelSize = size;
            }),
            onResizeRightPanel: (size) => set((state) => {
                state.rightPanelSize = size;
            }),
        })),
        {
            name: 'editor-content-store', // unique name in storage
            partialize: (state) => ({ view: state.view, leftPanelSize: state.leftPanelSize, rightPanelSize: state.rightPanelSize }), // only persist 'view'
        }
    )
);

export function useEditorContentView() {
    const { view, setView } = useEditorContentStore();
    return { view, setView };
}