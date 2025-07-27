import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { useMapBuilderStore } from '../../../store';

interface MaterialSettingsProps {
  object: any;
}

export function MaterialSettings({ object }: MaterialSettingsProps) {
  const { updateObject } = useMapBuilderStore();

  const handleUpdateProperty = (property: string, value: any) => {
    updateObject(object.id, { [property]: value });
  };

  const handleUpdateMaterial = (property: string, value: any) => {
    updateObject(object.id, {
      material: {
        ...object.material,
        [property]: value
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Color */}
      <div>
        <Label className="text-white/80 mb-2">Color</Label>
        <div className="flex gap-2">
          <input
            type="color"
            value={object.color}
            onChange={(e) => handleUpdateProperty('color', e.target.value)}
            className="w-12 h-8 border border-white/20 rounded-lg cursor-pointer bg-white/10"
          />
          <Input
            type="text"
            value={object.color}
            onChange={(e) => handleUpdateProperty('color', e.target.value)}
            className="flex-1 bg-white/10 border-white/20 text-white placeholder-white/50 focus:ring-emerald-500"
          />
        </div>
      </div>

      {/* Material Properties */}
      <div>
        <Label className="text-white/80 mb-4">Material</Label>
        
        <div className="space-y-4">
          <div>
            <div className="flex justify-between items-center mb-2">
              <Label className="text-xs text-white/50">Metalness</Label>
              <span className="text-xs text-white/60">
                {(object.material?.metalness || 0).toFixed(1)}
              </span>
            </div>
            <Slider
              value={[object.material?.metalness || 0]}
              onValueChange={([value]) => handleUpdateMaterial('metalness', value)}
              min={0}
              max={1}
              step={0.1}
              className="w-full"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <Label className="text-xs text-white/50">Roughness</Label>
              <span className="text-xs text-white/60">
                {(object.material?.roughness || 0.5).toFixed(1)}
              </span>
            </div>
            <Slider
              value={[object.material?.roughness || 0.5]}
              onValueChange={([value]) => handleUpdateMaterial('roughness', value)}
              min={0}
              max={1}
              step={0.1}
              className="w-full"
            />
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              checked={object.material?.transparent || false}
              onCheckedChange={(checked) => handleUpdateMaterial('transparent', checked)}
              className="border-white/20"
            />
            <Label className="text-sm text-white/80">Transparent</Label>
          </div>

          {object.material?.transparent && (
            <div>
              <div className="flex justify-between items-center mb-2">
                <Label className="text-xs text-white/50">Opacity</Label>
                <span className="text-xs text-white/60">
                  {(object.material?.opacity || 1).toFixed(1)}
                </span>
              </div>
              <Slider
                value={[object.material?.opacity || 1]}
                onValueChange={([value]) => handleUpdateMaterial('opacity', value)}
                min={0}
                max={1}
                step={0.1}
                className="w-full"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
