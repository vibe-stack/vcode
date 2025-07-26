import React from 'react';
import { useMapBuilderStore, MapObject } from '../store';
import MapObjectMesh from './MapObjectMesh';

interface MapObjectsProps {
  onObjectClick?: (objectId: string, event: any) => void;
}

export default function MapObjects({ onObjectClick }: MapObjectsProps) {
  const { objects } = useMapBuilderStore();

  return (
    <>
      {objects.map((object) => (
        <MapObjectMesh
          key={object.id}
          object={object}
          onClick={onObjectClick}
        />
      ))}
    </>
  );
}
