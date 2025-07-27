import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useMapBuilderStore } from '../../../store';

interface ObjectInfoProps {
  object: any;
}

export function ObjectInfo({ object }: ObjectInfoProps) {
  const { updateObject } = useMapBuilderStore();

  const handleUpdateProperty = (property: string, value: any) => {
    updateObject(object.id, { [property]: value });
  };

  return (
    <div className="space-y-4">
      <div>
        <Label className="text-white/80 mb-2">Name</Label>
        <Input
          value={object.name || ''}
          onChange={(e) => handleUpdateProperty('name', e.target.value)}
          className="bg-white/10 border-white/20 text-white placeholder-white/50 focus:ring-emerald-500 focus:border-transparent"
        />
      </div>

      <div>
        <Label className="text-white/80 mb-2">Type</Label>
        <div className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-sm capitalize text-white/80">
          {object.type}
        </div>
      </div>
    </div>
  );
}
