import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useMapBuilderStore } from '../../../store';

interface ObjectInfoProps {
  objectId: string;
}

export function ObjectInfo({ objectId }: ObjectInfoProps) {
  const { updateObject } = useMapBuilderStore();
  const object = useMapBuilderStore((state) => state.getObjectById(objectId));

  if (!object) return null;

  const handleUpdateProperty = (property: string, value: any) => {
    updateObject(object.id, { [property]: value });
  };

  return (
    <div className="space-y-4 p-4 bg-white/5 border border-white/10 rounded-lg">
      <div className="space-y-3">
        <div>
          <Label className="text-white/80 text-sm font-medium mb-2 block">Name</Label>
          <Input
            value={object.name || ''}
            onChange={(e) => handleUpdateProperty('name', e.target.value)}
            placeholder="Object name..."
            className="bg-black/20 border-white/20 text-white placeholder-white/40 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-colors"
          />
        </div>

        <div>
          <Label className="text-white/80 text-sm font-medium mb-2 block">Type</Label>
          <div className="px-3 py-2 bg-black/20 border border-white/20 rounded-lg text-sm capitalize text-white/80">
            {object.type}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Checkbox
            checked={object.visible !== false}
            onCheckedChange={(checked) => handleUpdateProperty('visible', checked)}
            className="border-white/30 data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500"
          />
          <Label className="text-white/80 text-sm font-medium">Visible</Label>
        </div>
      </div>
    </div>
  );
}
