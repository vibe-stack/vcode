import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { persist } from 'zustand/middleware';

export type EditorContentView = 'code' | 'agents' | 'auto';

export interface EditorContentState {
    view: EditorContentView;
    setView: (view: EditorContentView) => void;
    leftPanelSize: number; // Size for left panel
    rightPanelSize: number; // Size for right panel
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
            leftPanelSize: 25, // Default size for left panel
            rightPanelSize: 25, // Default size for right panel
            onResizeLeftPanel: (size) => set((state) => {
                // Ensure size is within reasonable bounds
                state.leftPanelSize = Math.max(15, Math.min(50, size));
            }),
            onResizeRightPanel: (size) => set((state) => {
                // Ensure size is within reasonable bounds
                state.rightPanelSize = Math.max(15, Math.min(50, size));
            }),
        })),
        {
            name: 'editor-content-store', // unique name in storage
            partialize: (state) => ({ 
                view: state.view, 
                leftPanelSize: state.leftPanelSize, 
                rightPanelSize: state.rightPanelSize 
            }),
        }
    )
);

export function useEditorContentView() {
    const { view, setView } = useEditorContentStore();
    return { view, setView };
}