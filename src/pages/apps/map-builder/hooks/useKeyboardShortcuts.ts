import { useEffect } from 'react';
import { useMapBuilderStore } from '../store';

export default function useKeyboardShortcuts() {
  const {
    selectedObjectIds,
    deleteSelected,
    duplicateSelected,
    clearSelection,
    setActiveTool,
    objects,
    selectObject,
  } = useMapBuilderStore();

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Prevent shortcuts when typing in inputs
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return;
      }

      const isCtrlOrCmd = event.ctrlKey || event.metaKey;

      switch (event.key.toLowerCase()) {
        // Delete selected objects
        case 'delete':
        case 'backspace':
          if (selectedObjectIds.length > 0) {
            event.preventDefault();
            deleteSelected();
          }
          break;

        // Duplicate selected objects
        case 'd':
          if (isCtrlOrCmd && selectedObjectIds.length > 0) {
            event.preventDefault();
            duplicateSelected();
          }
          break;

        // Clear selection
        case 'escape':
          event.preventDefault();
          clearSelection();
          break;

        // Select all objects
        case 'a':
          if (isCtrlOrCmd) {
            event.preventDefault();
            objects.forEach(obj => selectObject(obj.id, true));
          }
          break;

        // Tool shortcuts
        case 'v':
          if (!isCtrlOrCmd) {
            event.preventDefault();
            setActiveTool('select');
          }
          break;

        case 'g':
          if (!isCtrlOrCmd) {
            event.preventDefault();
            setActiveTool('move');
          }
          break;

        case 'r':
          if (!isCtrlOrCmd) {
            event.preventDefault();
            setActiveTool('rotate');
          }
          break;

        case 's':
          if (!isCtrlOrCmd) {
            event.preventDefault();
            setActiveTool('scale');
          }
          break;

        // Number keys for quick shape creation
        case '1':
          if (!isCtrlOrCmd) {
            event.preventDefault();
            // Box creation would be handled by parent component
          }
          break;

        case '2':
          if (!isCtrlOrCmd) {
            event.preventDefault();
            // Sphere creation would be handled by parent component
          }
          break;

        case '3':
          if (!isCtrlOrCmd) {
            event.preventDefault();
            // Cylinder creation would be handled by parent component
          }
          break;

        case '4':
          if (!isCtrlOrCmd) {
            event.preventDefault();
            // Cone creation would be handled by parent component
          }
          break;

        case '5':
          if (!isCtrlOrCmd) {
            event.preventDefault();
            // Plane creation would be handled by parent component
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [
    selectedObjectIds,
    objects,
    deleteSelected,
    duplicateSelected,
    clearSelection,
    setActiveTool,
    selectObject,
  ]);

  // Return keyboard shortcut info for display
  return {
    shortcuts: [
      { key: 'V', description: 'Select tool' },
      { key: 'G', description: 'Move tool' },
      { key: 'R', description: 'Rotate tool' },
      { key: 'S', description: 'Scale tool' },
      { key: 'Ctrl+D', description: 'Duplicate selected' },
      { key: 'Ctrl+A', description: 'Select all' },
      { key: 'Delete', description: 'Delete selected' },
      { key: 'Escape', description: 'Clear selection' },
      { key: '1-5', description: 'Quick create shapes' },
    ],
  };
}
