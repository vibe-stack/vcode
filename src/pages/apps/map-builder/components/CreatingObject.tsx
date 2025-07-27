import React, { useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useMapBuilderStore } from '../store';
import * as THREE from 'three/webgpu';
import { createDoorGeometry } from '../utils/door-geometry';

export default function CreatingObject() {
  const meshRef = useRef<THREE.Mesh>(null);
  const { camera, raycaster, pointer } = useThree();
  const { 
    isCreating, 
    creatingObject, 
    grid,
    snapToGrid,
    updateCreatingObject 
  } = useMapBuilderStore();

  useFrame(() => {
    if (!isCreating || !creatingObject || !meshRef.current) return;

    // Raycast to ground plane to get mouse position in 3D space
    const planeGeometry = new THREE.PlaneGeometry(1000, 1000);
    const planeMaterial = new THREE.MeshBasicMaterial({ visible: false });
    const groundPlane = new THREE.Mesh(planeGeometry, planeMaterial);
    groundPlane.rotation.x = -Math.PI / 2;
    groundPlane.position.y = 0;

    raycaster.setFromCamera(pointer, camera);
    const intersects = raycaster.intersectObject(groundPlane);

    if (intersects.length > 0) {
      const point = intersects[0].point;
      
      // Snap to grid if enabled
      const snappedX = snapToGrid(point.x);
      const snappedZ = snapToGrid(point.z);
      
      updateCreatingObject({
        position: [snappedX, creatingObject.position[1], snappedZ],
      });
    }

    // Cleanup
    planeGeometry.dispose();
    planeMaterial.dispose();
  });

  if (!isCreating || !creatingObject) return null;

  // Create geometry based on object type
  const createGeometry = () => {
    const { type, scale } = creatingObject;
    
    switch (type) {
      case 'box':
        return new THREE.BoxGeometry(scale[0], scale[1], scale[2]);
      case 'sphere':
        return new THREE.SphereGeometry(scale[0], 32, 32);
      case 'cylinder':
        return new THREE.CylinderGeometry(scale[0], scale[0], scale[1], 32);
      case 'plane':
        return new THREE.PlaneGeometry(scale[0], scale[1]);
      case 'cone':
        return new THREE.ConeGeometry(scale[0], scale[1], 32);
      case 'door':
        return createDoorGeometry(
          scale[0], 
          scale[1], 
          scale[2],
          creatingObject.geometry?.cutoutWidth || 0.8,
          creatingObject.geometry?.cutoutHeight || 1.8,
          creatingObject.geometry?.cutoutRadius || 0
        );
      default:
        return new THREE.BoxGeometry(1, 1, 1);
    }
  };

  const geometry = createGeometry();

  return (
    <mesh
      ref={meshRef}
      geometry={geometry}
      position={creatingObject.position}
      rotation={creatingObject.rotation}
    >
      <meshStandardMaterial
        color={creatingObject.color}
        transparent
        opacity={0.7}
        wireframe
      />
    </mesh>
  );
}
