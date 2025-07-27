import React from 'react';
import { BoxSettings } from './box-settings';
import { SphereSettings } from './sphere-settings';
import { CylinderSettings } from './cylinder-settings';
import { ConeSettings } from './cone-settings';

interface GeometrySettingsProps {
  object: any;
}

export function GeometrySettings({ object }: GeometrySettingsProps) {
  switch (object.type) {
    case 'box':
      return <BoxSettings object={object} />;
    case 'sphere':
      return <SphereSettings object={object} />;
    case 'cylinder':
      return <CylinderSettings object={object} />;
    case 'cone':
      return <ConeSettings object={object} />;
    case 'plane':
      return <BoxSettings object={object} />; // Plane uses width/height like box
    default:
      return null;
  }
}
