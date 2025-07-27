import React from 'react';
import { DragInput } from '@/components/ui/drag-input';
import { Label } from '@/components/ui/label';
import { useMapBuilderStore } from '../../../../store';

interface DoorSettingsProps {
  objectId: string;
}

export function DoorSettings({ objectId }: DoorSettingsProps) {
  const { updateObject } = useMapBuilderStore();
  const object = useMapBuilderStore((state) => state.getObjectById(objectId));

  if (!object) return null;

  const handleUpdateGeometry = (property: string, value: number) => {
    updateObject(object.id, {
      geometry: {
        ...object.geometry,
        [property]: Math.max(0.1, value)
      }
    });
  };

  const geometry = object.geometry || { 
    width: 2, 
    height: 2.5, 
    depth: 0.2,
    cutoutWidth: 0.8,
    cutoutHeight: 1.8,
    cutoutRadius: 0
  };

  return (
    <div className="space-y-3 p-4 bg-white/5 border border-white/10 rounded-lg">
      <Label className="text-white/80 text-sm font-medium">Door Dimensions</Label>
      <div className="space-y-2">
        <DragInput
          label="Width"
          value={geometry.width}
          onChange={(value) => handleUpdateGeometry('width', value)}
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
        <DragInput
          label="Depth"
          value={geometry.depth}
          onChange={(value) => handleUpdateGeometry('depth', value)}
          step={0.1}
          precision={2}
          min={0.1}
          compact
        />
      </div>
      
      <Label className="text-white/80 text-sm font-medium">Cutout</Label>
      <div className="space-y-2">
        <DragInput
          label="C. Width"
          value={geometry.cutoutWidth}
          onChange={(value) => handleUpdateGeometry('cutoutWidth', value)}
          step={0.1}
          precision={2}
          min={0.1}
          max={(geometry.width || 2) * 0.9}
          compact
        />
        <DragInput
          label="C. Height"
          value={geometry.cutoutHeight}
          onChange={(value) => handleUpdateGeometry('cutoutHeight', value)}
          step={0.1}
          precision={2}
          min={0.1}
          max={(geometry.height || 2.5) * 0.9}
          compact
        />
        <DragInput
          label="Arch Radius"
          value={geometry.cutoutRadius}
          onChange={(value) => handleUpdateGeometry('cutoutRadius', value)}
          step={0.1}
          precision={2}
          min={0}
          max={(geometry.cutoutWidth || 0.8) / 2}
          compact
        />
      </div>
    </div>
  );
}
