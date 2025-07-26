import React from 'react';
import { useMapBuilderStore } from '../store';
import * as THREE from 'three/webgpu';

export default function SelectionBox() {
  const { selectedObjectIds, objects } = useMapBuilderStore();

  if (selectedObjectIds.length === 0) return null;

  const selectedObjects = objects.filter(obj => selectedObjectIds.includes(obj.id));

  // Calculate bounding box of all selected objects
  const calculateBoundingBox = () => {
    if (selectedObjects.length === 0) return null;

    const box = new THREE.Box3();
    
    selectedObjects.forEach(obj => {
      const objBox = new THREE.Box3();
      const center = new THREE.Vector3(...obj.position);
      const size = new THREE.Vector3(...obj.scale);
      
      objBox.setFromCenterAndSize(center, size);
      box.union(objBox);
    });

    return box;
  };

  const boundingBox = calculateBoundingBox();
  
  if (!boundingBox) return null;

  const center = boundingBox.getCenter(new THREE.Vector3());
  const size = boundingBox.getSize(new THREE.Vector3());

  return (
    <mesh position={[center.x, center.y, center.z]}>
      <boxGeometry args={[size.x + 0.2, size.y + 0.2, size.z + 0.2]} />
      <meshBasicMaterial
        color="#00ff00"
        wireframe
        transparent
        opacity={0.3}
        depthTest={false}
      />
    </mesh>
  );
}
