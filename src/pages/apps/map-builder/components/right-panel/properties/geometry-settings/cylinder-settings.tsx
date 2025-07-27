import React from 'react';
import { DragInput } from '@/components/ui/drag-input';
import { Label } from '@/components/ui/label';
import { useMapBuilderStore } from '../../../../store';

interface CylinderSettingsProps {
  objectId: string;
}

export function CylinderSettings({ objectId }: CylinderSettingsProps) {
  const { updateObject } = useMapBuilderStore();
  const object = useMapBuilderStore((state) => state.getObjectById(objectId));

  if (!object) return null;

  const handleUpdateGeometry = (property: 'radius' | 'height', value: number) => {
    updateObject(object.id, {
      geometry: {
        ...object.geometry,
        [property]: Math.max(0.1, value)
      }
    });
  };

  const geometry = object.geometry || { radius: 0.5, height: 1 };

  return (
    <div className="space-y-3 p-4 bg-white/5 border border-white/10 rounded-lg">
      <Label className="text-white/80 text-sm font-medium">Dimensions</Label>
      <div className="space-y-2">
        <DragInput
          label="Radius"
          value={geometry.radius}
          onChange={(value) => handleUpdateGeometry('radius', value)}
          step={0.1}
          precision={2}
          min={0.1}
          compact
        />
        <DragInput
          label="Height"
          value={geometry.height}
          onChange={(value) => handleUpdateGeometry('height', value)}
          step={0.1}
          precision={2}
          min={0.1}
          compact
        />
      </div>
    </div>
  );
}
