import React from 'react';
import { DragInput } from '@/components/ui/drag-input';
import { Label } from '@/components/ui/label';
import { useMapBuilderStore } from '../../../store';

interface TransformSettingsProps {
  objectId: string;
}

export function TransformSettings({ objectId }: TransformSettingsProps) {
  const { updateObject } = useMapBuilderStore();
  const object = useMapBuilderStore((state) => state.getObjectById(objectId));

  if (!object) return null;

  const handleUpdatePosition = (axis: 'x' | 'y' | 'z', value: number) => {
    const newPosition = [...object.position] as [number, number, number];
    const axisIndex = axis === 'x' ? 0 : axis === 'y' ? 1 : 2;
    newPosition[axisIndex] = value;
    updateObject(object.id, { position: newPosition });
  };

  const handleUpdateRotation = (axis: 'x' | 'y' | 'z', value: number) => {
    const newRotation = [...object.rotation] as [number, number, number];
    const axisIndex = axis === 'x' ? 0 : axis === 'y' ? 1 : 2;
    newRotation[axisIndex] = (value * Math.PI) / 180; // Convert degrees to radians
    updateObject(object.id, { rotation: newRotation });
  };

  const handleUpdateScale = (axis: 'x' | 'y' | 'z', value: number) => {
    const newScale = [...object.scale] as [number, number, number];
    const axisIndex = axis === 'x' ? 0 : axis === 'y' ? 1 : 2;
    newScale[axisIndex] = Math.max(0.1, value);
    updateObject(object.id, { scale: newScale });
  };

  const handleUniformScale = (value: number) => {
    const scale = Math.max(0.1, value);
    updateObject(object.id, { 
      scale: [scale, scale, scale] as [number, number, number] 
    });
  };

  return (
    <div className="space-y-6 p-4 bg-white/5 border border-white/10 rounded-lg">
      {/* Position */}
      <div className="space-y-3">
        <Label className="text-white/80 text-sm font-medium">Position</Label>
        <div className="space-y-2">
          <DragInput
            label="X"
            value={object.position[0]}
            onChange={(value) => handleUpdatePosition('x', value)}
            step={0.1}
            precision={2}
            compact
          />
          <DragInput
            label="Y"
            value={object.position[1]}
            onChange={(value) => handleUpdatePosition('y', value)}
            step={0.1}
            precision={2}
            compact
          />
          <DragInput
            label="Z"
            value={object.position[2]}
            onChange={(value) => handleUpdatePosition('z', value)}
            step={0.1}
            precision={2}
            compact
          />
        </div>
      </div>

      {/* Rotation */}
      <div className="space-y-3">
        <Label className="text-white/80 text-sm font-medium">Rotation</Label>
        <div className="space-y-2">
          <DragInput
            label="X"
            value={(object.rotation[0] * 180) / Math.PI}
            onChange={(value) => handleUpdateRotation('x', value)}
            step={1}
            precision={1}
            suffix="°"
            compact
          />
          <DragInput
            label="Y"
            value={(object.rotation[1] * 180) / Math.PI}
            onChange={(value) => handleUpdateRotation('y', value)}
            step={1}
            precision={1}
            suffix="°"
            compact
          />
          <DragInput
            label="Z"
            value={(object.rotation[2] * 180) / Math.PI}
            onChange={(value) => handleUpdateRotation('z', value)}
            step={1}
            precision={1}
            suffix="°"
            compact
          />
        </div>
      </div>

      {/* Scale */}
      <div className="space-y-3">
        <Label className="text-white/80 text-sm font-medium">Scale</Label>
        
        {/* Uniform Scale */}
        <div className="space-y-2">
          <DragInput
            label="Uniform"
            value={object.scale[0]}
            onChange={handleUniformScale}
            step={0.1}
            precision={2}
            min={0.1}
            compact
          />
        </div>

        {/* Individual Scale */}
        <div className="space-y-2">
          <DragInput
            label="X"
            value={object.scale[0]}
            onChange={(value) => handleUpdateScale('x', value)}
            step={0.1}
            precision={2}
            min={0.1}
            compact
          />
          <DragInput
            label="Y"
            value={object.scale[1]}
            onChange={(value) => handleUpdateScale('y', value)}
            step={0.1}
            precision={2}
            min={0.1}
            compact
          />
          <DragInput
            label="Z"
            value={object.scale[2]}
            onChange={(value) => handleUpdateScale('z', value)}
            step={0.1}
            precision={2}
            min={0.1}
            compact
          />
        </div>
      </div>
    </div>
  );
}
