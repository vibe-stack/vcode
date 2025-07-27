import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { DragInput } from '@/components/ui/drag-input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useMapBuilderStore } from '../../../store';
import * as THREE from 'three/webgpu';


interface MaterialSettingsProps {
  objectId: string;
}

export function MaterialSettings({ objectId }: MaterialSettingsProps) {
  const { updateObject } = useMapBuilderStore();
  const object = useMapBuilderStore((state) => state.getObjectById(objectId));

  if (!object) return null;

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
    <div className="space-y-6 p-4 bg-white/5 border border-white/10 rounded-lg">
      {/* Color */}
      <div className="space-y-3">
        <Label className="text-white/80 text-sm font-medium">Color</Label>
        <div className="flex gap-2">
          <input
            type="color"
            value={object.color}
            onChange={(e) => handleUpdateProperty('color', e.target.value)}
            className="w-12 h-8 border border-white/20 rounded-lg cursor-pointer bg-black/20"
          />
          <Input
            type="text"
            value={object.color}
            onChange={(e) => handleUpdateProperty('color', e.target.value)}
            className="flex-1 bg-black/20 border-white/20 text-white placeholder-white/40 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-colors"
          />
        </div>
      </div>

      {/* Material Properties */}
      <div className="space-y-4">
        <Label className="text-white/80 text-sm font-medium">Material Properties</Label>

        <div className="space-y-4">
          <div>
            <div className="flex justify-between items-center mb-2">
              <Label className="text-xs text-white/60">Metalness</Label>
              <span className="text-xs text-white/60 font-mono">
                {(object.material?.metalness || 0).toFixed(2)}
              </span>
            </div>
            <Slider
              value={[object.material?.metalness || 0]}
              onValueChange={([value]) => handleUpdateMaterial('metalness', value)}
              min={0}
              max={1}
              step={0.01}
              className="w-full"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <Label className="text-xs text-white/60">Roughness</Label>
              <span className="text-xs text-white/60 font-mono">
                {(object.material?.roughness || 0.5).toFixed(2)}
              </span>
            </div>
            <Slider
              value={[object.material?.roughness || 0.5]}
              onValueChange={([value]) => handleUpdateMaterial('roughness', value)}
              min={0}
              max={1}
              step={0.01}
              className="w-full"
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Checkbox
                checked={object.material?.castShadow !== false}
                onCheckedChange={(checked) => handleUpdateMaterial('castShadow', checked)}
                className="border-white/30 data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500"
              />
              <Label className="text-white/60 text-sm">Cast Shadow</Label>
            </div>

            <div className="flex items-center gap-3">
              <Checkbox
                checked={object.material?.receiveShadow !== false}
                onCheckedChange={(checked) => handleUpdateMaterial('receiveShadow', checked)}
                className="border-white/30 data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500"
              />
              <Label className="text-white/60 text-sm">Receive Shadow</Label>
            </div>

            <div className="flex items-center gap-3">
              <Checkbox
                checked={object.material?.transparent || false}
                onCheckedChange={(checked) => handleUpdateMaterial('transparent', checked)}
                className="border-white/30 data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500"
              />
              <Label className="text-white/60 text-sm">Transparent</Label>
            </div>

            <div className="space-y-2">
              <Label className="text-white/60 text-sm">Side Rendering</Label>
              <Select
                value={object.material?.side || 'front'}
                onValueChange={(value) => handleUpdateMaterial('side', value)}
              >
                <SelectTrigger className="bg-black/20 border-white/20 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="front">Front</SelectItem>
                  <SelectItem value="back">Back</SelectItem>
                  <SelectItem value="double">Double</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {object.material?.transparent && (
            <div className="space-y-2">
              <DragInput
                label="Opacity"
                value={object.material?.opacity || 1}
                onChange={(value) => handleUpdateMaterial('opacity', value)}
                step={0.01}
                precision={2}
                min={0}
                max={1}
                compact
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
