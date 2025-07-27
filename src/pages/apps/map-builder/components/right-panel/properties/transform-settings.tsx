import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useMapBuilderStore } from '../../../store';

interface TransformSettingsProps {
  object: any;
}

export function TransformSettings({ object }: TransformSettingsProps) {
  const { updateObject } = useMapBuilderStore();

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
    <div className="space-y-6">
      {/* Position */}
      <div>
        <Label className="text-white/80 mb-2">Position</Label>
        <div className="grid grid-cols-3 gap-2">
          <div>
            <Label className="text-xs text-white/50 mb-1">X</Label>
            <Input
              type="number"
              step="0.1"
              value={object.position[0].toFixed(2)}
              onChange={(e) => handleUpdatePosition('x', parseFloat(e.target.value) || 0)}
              className="bg-white/10 border-white/20 text-white placeholder-white/50 focus:ring-emerald-500"
            />
          </div>
          <div>
            <Label className="text-xs text-white/50 mb-1">Y</Label>
            <Input
              type="number"
              step="0.1"
              value={object.position[1].toFixed(2)}
              onChange={(e) => handleUpdatePosition('y', parseFloat(e.target.value) || 0)}
              className="bg-white/10 border-white/20 text-white placeholder-white/50 focus:ring-emerald-500"
            />
          </div>
          <div>
            <Label className="text-xs text-white/50 mb-1">Z</Label>
            <Input
              type="number"
              step="0.1"
              value={object.position[2].toFixed(2)}
              onChange={(e) => handleUpdatePosition('z', parseFloat(e.target.value) || 0)}
              className="bg-white/10 border-white/20 text-white placeholder-white/50 focus:ring-emerald-500"
            />
          </div>
        </div>
      </div>

      {/* Rotation */}
      <div>
        <Label className="text-white/80 mb-2">Rotation (degrees)</Label>
        <div className="grid grid-cols-3 gap-2">
          <div>
            <Label className="text-xs text-white/50 mb-1">X</Label>
            <Input
              type="number"
              step="1"
              value={((object.rotation[0] * 180) / Math.PI).toFixed(1)}
              onChange={(e) => handleUpdateRotation('x', parseFloat(e.target.value) || 0)}
              className="bg-white/10 border-white/20 text-white placeholder-white/50 focus:ring-emerald-500"
            />
          </div>
          <div>
            <Label className="text-xs text-white/50 mb-1">Y</Label>
            <Input
              type="number"
              step="1"
              value={((object.rotation[1] * 180) / Math.PI).toFixed(1)}
              onChange={(e) => handleUpdateRotation('y', parseFloat(e.target.value) || 0)}
              className="bg-white/10 border-white/20 text-white placeholder-white/50 focus:ring-emerald-500"
            />
          </div>
          <div>
            <Label className="text-xs text-white/50 mb-1">Z</Label>
            <Input
              type="number"
              step="1"
              value={((object.rotation[2] * 180) / Math.PI).toFixed(1)}
              onChange={(e) => handleUpdateRotation('z', parseFloat(e.target.value) || 0)}
              className="bg-white/10 border-white/20 text-white placeholder-white/50 focus:ring-emerald-500"
            />
          </div>
        </div>
      </div>

      {/* Scale */}
      <div>
        <Label className="text-white/80 mb-2">Scale</Label>
        
        {/* Uniform Scale */}
        <div className="mb-3">
          <Label className="text-xs text-white/50 mb-1">Uniform</Label>
          <Input
            type="number"
            step="0.1"
            min="0.1"
            value={object.scale[0].toFixed(2)}
            onChange={(e) => handleUniformScale(parseFloat(e.target.value) || 0.1)}
            className="bg-white/10 border-white/20 text-white placeholder-white/50 focus:ring-emerald-500"
          />
        </div>

        {/* Individual Scale */}
        <div className="grid grid-cols-3 gap-2">
          <div>
            <Label className="text-xs text-white/50 mb-1">X</Label>
            <Input
              type="number"
              step="0.1"
              min="0.1"
              value={object.scale[0].toFixed(2)}
              onChange={(e) => handleUpdateScale('x', parseFloat(e.target.value) || 0.1)}
              className="bg-white/10 border-white/20 text-white placeholder-white/50 focus:ring-emerald-500"
            />
          </div>
          <div>
            <Label className="text-xs text-white/50 mb-1">Y</Label>
            <Input
              type="number"
              step="0.1"
              min="0.1"
              value={object.scale[1].toFixed(2)}
              onChange={(e) => handleUpdateScale('y', parseFloat(e.target.value) || 0.1)}
              className="bg-white/10 border-white/20 text-white placeholder-white/50 focus:ring-emerald-500"
            />
          </div>
          <div>
            <Label className="text-xs text-white/50 mb-1">Z</Label>
            <Input
              type="number"
              step="0.1"
              min="0.1"
              value={object.scale[2].toFixed(2)}
              onChange={(e) => handleUpdateScale('z', parseFloat(e.target.value) || 0.1)}
              className="bg-white/10 border-white/20 text-white placeholder-white/50 focus:ring-emerald-500"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
