import React, { useRef, useState, useCallback } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useMapBuilderStore } from '../store';
import * as THREE from 'three/webgpu';
import { createDoorGeometry } from '../utils/door-geometry';

export default function InteractiveCreation() {
  const meshRef = useRef<THREE.Mesh>(null);
  const { camera, raycaster, pointer, gl } = useThree();
  const [isDragging, setIsDragging] = useState(false);
  const [startPoint, setStartPoint] = useState<THREE.Vector3 | null>(null);
  const [previewObject, setPreviewObject] = useState<any>(null);

  const { 
    isCreating, 
    creatingObject, 
    activeShape,
    grid,
    snapToGrid,
    updateCreatingObject,
    finishCreating,
    cancelCreating,
    generateId
  } = useMapBuilderStore();

  const getGroundIntersection = useCallback((pointer: THREE.Vector2) => {
    const planeGeometry = new THREE.PlaneGeometry(1000, 1000);
    const planeMaterial = new THREE.MeshBasicMaterial({ visible: false });
    const groundPlane = new THREE.Mesh(planeGeometry, planeMaterial);
    groundPlane.rotation.x = -Math.PI / 2;
    groundPlane.position.y = 0;

    raycaster.setFromCamera(pointer, camera);
    const intersects = raycaster.intersectObject(groundPlane);

    planeGeometry.dispose();
    planeMaterial.dispose();

    return intersects.length > 0 ? intersects[0].point : null;
  }, [camera, raycaster]);

  const calculateScale = useCallback((start: THREE.Vector3, end: THREE.Vector3, shapeType: string) => {
    const distance = start.distanceTo(end);
    const minSize = 0.5;
    const size = Math.max(minSize, distance);

    switch (shapeType) {
      case 'box':
        return [size, size, size] as [number, number, number];
      case 'sphere':
        return [size / 2, size / 2, size / 2] as [number, number, number];
      case 'cylinder':
        return [size / 2, size, size / 2] as [number, number, number];
      case 'cone':
        return [size / 2, size, size / 2] as [number, number, number];
      case 'plane':
        return [size, 0.01, size] as [number, number, number];
      default:
        return [size, size, size] as [number, number, number];
    }
  }, []);

  const handlePointerDown = useCallback((event: any) => {
    if (!isCreating || isDragging) return;

    const point = getGroundIntersection(pointer);
    if (!point) return;

    event.stopPropagation();
    setIsDragging(true);
    
    const snappedPoint = new THREE.Vector3(
      snapToGrid(point.x),
      point.y,
      snapToGrid(point.z)
    );
    
    setStartPoint(snappedPoint);

    // Create preview object
    const newObject = {
      id: generateId(),
      type: activeShape,
      position: [snappedPoint.x, snappedPoint.y + 0.5, snappedPoint.z] as [number, number, number],
      rotation: [0, 0, 0] as [number, number, number],
      scale: [0.1, 0.1, 0.1] as [number, number, number],
      color: '#4f46e5',
      name: `${activeShape}_${Math.random().toString(36).substr(2, 6)}`,
    };

    setPreviewObject(newObject);
    updateCreatingObject(newObject);

    gl.domElement.setPointerCapture(event.pointerId);
  }, [
    isCreating, 
    isDragging, 
    pointer, 
    snapToGrid, 
    activeShape, 
    generateId, 
    updateCreatingObject, 
    getGroundIntersection,
    gl.domElement
  ]);

  const handlePointerMove = useCallback((event: any) => {
    if (!isDragging || !startPoint || !previewObject) return;

    const point = getGroundIntersection(pointer);
    if (!point) return;

    const snappedPoint = new THREE.Vector3(
      snapToGrid(point.x),
      point.y,
      snapToGrid(point.z)
    );

    const scale = calculateScale(startPoint, snappedPoint, activeShape);
    const center = startPoint.clone().add(snappedPoint).multiplyScalar(0.5);

    const updatedObject = {
      ...previewObject,
      position: [center.x, center.y + scale[1] / 2, center.z] as [number, number, number],
      scale,
    };

    setPreviewObject(updatedObject);
    updateCreatingObject(updatedObject);
  }, [
    isDragging, 
    startPoint, 
    previewObject, 
    pointer, 
    snapToGrid, 
    calculateScale, 
    activeShape, 
    updateCreatingObject,
    getGroundIntersection
  ]);

  const handlePointerUp = useCallback((event: any) => {
    if (!isDragging) return;

    event.stopPropagation();
    setIsDragging(false);
    setStartPoint(null);
    
    if (previewObject) {
      finishCreating();
      setPreviewObject(null);
    }

    gl.domElement.releasePointerCapture(event.pointerId);
  }, [isDragging, previewObject, finishCreating, gl.domElement]);

  // Add event listeners to the canvas
  React.useEffect(() => {
    const canvas = gl.domElement;
    
    canvas.addEventListener('pointerdown', handlePointerDown);
    canvas.addEventListener('pointermove', handlePointerMove);
    canvas.addEventListener('pointerup', handlePointerUp);
    
    return () => {
      canvas.removeEventListener('pointerdown', handlePointerDown);
      canvas.removeEventListener('pointermove', handlePointerMove);
      canvas.removeEventListener('pointerup', handlePointerUp);
    };
  }, [handlePointerDown, handlePointerMove, handlePointerUp, gl.domElement]);

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
        return new THREE.PlaneGeometry(scale[0], scale[2]);
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
        opacity={isDragging ? 0.8 : 0.5}
        wireframe={!isDragging}
      />
    </mesh>
  );
}
