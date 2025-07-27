import React from 'react';
import { useMapBuilderStore } from '../../store';
import CubeCreator from './CubeCreator';
import SphereCreator from './SphereCreator';
import CylinderCreator from './CylinderCreator';
import ConeCreator from './ConeCreator';
import PlaneCreator from './PlaneCreator';
import DoorCreator from './DoorCreator';

export default function ObjectCreators() {
  const { isCreating, activeShape } = useMapBuilderStore();

  if (!isCreating) return null;

  // Render the appropriate creator based on active shape
  switch (activeShape) {
    case 'box':
      return <CubeCreator />;
    case 'sphere':
      return <SphereCreator />;
    case 'cylinder':
      return <CylinderCreator />;
    case 'cone':
      return <ConeCreator />;
    case 'plane':
      return <PlaneCreator />;
    case 'door':
      return <DoorCreator />;
    default:
      return null;
  }
}
