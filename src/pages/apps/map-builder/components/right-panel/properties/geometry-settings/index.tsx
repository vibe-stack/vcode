import React from 'react';
import { useMapBuilderStore } from '../../../../store';
import { BoxSettings } from './box-settings';
import { SphereSettings } from './sphere-settings';
import { CylinderSettings } from './cylinder-settings';
import { ConeSettings } from './cone-settings';
import { DoorSettings } from './door-settings';

interface GeometrySettingsProps {
  objectId: string;
}

export function GeometrySettings({ objectId }: GeometrySettingsProps) {
  const object = useMapBuilderStore((state) => state.getObjectById(objectId));

  if (!object) return null;

  switch (object.type) {
    case 'box':
      return <BoxSettings objectId={objectId} />;
    case 'sphere':
      return <SphereSettings objectId={objectId} />;
    case 'cylinder':
      return <CylinderSettings objectId={objectId} />;
    case 'cone':
      return <ConeSettings objectId={objectId} />;
    case 'plane':
      return <BoxSettings objectId={objectId} />; // Plane uses width/height like box
    case 'door':
      return <DoorSettings objectId={objectId} />;
    default:
      return null;
  }
}
