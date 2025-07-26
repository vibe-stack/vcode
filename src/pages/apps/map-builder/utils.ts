import { useMapBuilderStore } from './store';
import { createObjectsFromTemplate, getTemplateById } from './templates';

export function loadDemoScene() {
  const { importFromJSON, generateId } = useMapBuilderStore.getState();
  
  const template = getTemplateById('showcase');
  if (!template) return;

  const templateObjects = createObjectsFromTemplate(template, generateId);
  const demoData = {
    objects: templateObjects,
    grid: {
      size: 50,
      divisions: 50,
      visible: true,
      snapToGrid: true,
    },
  };

  importFromJSON(JSON.stringify(demoData));
}

export function clearScene() {
  const { importFromJSON } = useMapBuilderStore.getState();
  
  const emptyData = {
    objects: [],
    grid: {
      size: 50,
      divisions: 50,
      visible: true,
      snapToGrid: true,
    },
  };

  importFromJSON(JSON.stringify(emptyData));
}
