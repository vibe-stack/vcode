import React, { useRef, useEffect, useState } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { TransformControls } from '@react-three/drei';
import { useMapBuilderStore } from '../store';
import * as THREE from 'three/webgpu';

export default function TransformGizmo() {
  const transformRef = useRef<any>(null);
  const [attachedObject, setAttachedObject] = useState<THREE.Object3D | null>(null);
  const { scene, camera, gl } = useThree();
  const { 
    selectedObjectIds, 
    activeTool, 
    objects, 
    updateObject,
    snapToGrid 
  } = useMapBuilderStore();

  // Get the currently selected object
  const selectedObject = selectedObjectIds.length === 1 
    ? objects.find(obj => obj.id === selectedObjectIds[0])
    : null;

  // Transform mode mapping
  const getTransformMode = () => {
    switch (activeTool) {
      case 'move': return 'translate';
      case 'rotate': return 'rotate';
      case 'scale': return 'scale';
      default: return null;
    }
  };

  const transformMode = getTransformMode();

  // Find and attach to the Three.js mesh
  useEffect(() => {
    if (selectedObject && transformMode) {
      let foundObject: THREE.Object3D | null = null;
      
      // Search for the mesh with the matching objectId
      scene.traverse((child) => {
        if (child.userData.objectId === selectedObject.id && child.type === 'Mesh') {
          foundObject = child;
        }
      });
      
      if (foundObject && transformRef.current) {
        setAttachedObject(foundObject);
        transformRef.current.attach(foundObject);
      }
    } else {
      if (transformRef.current) {
        transformRef.current.detach();
      }
      setAttachedObject(null);
    }
  }, [selectedObject, transformMode, scene, objects]);

  // Handle transform changes
  useEffect(() => {
    if (transformRef.current) {
      const controls = transformRef.current;
      
      const handleChange = () => {
        if (attachedObject && selectedObject) {
          const position = attachedObject.position.toArray() as [number, number, number];
          const rotation = attachedObject.rotation.toArray().slice(0, 3) as [number, number, number];
          const scale = attachedObject.scale.toArray() as [number, number, number];

          // Apply grid snapping to position if enabled and in translate mode
          let snappedPosition = position;
          if (transformMode === 'translate') {
            snappedPosition = [
              snapToGrid(position[0]),
              position[1], // Don't snap Y axis typically
              snapToGrid(position[2])
            ] as [number, number, number];
            
            // Update the object position if snapped
            if (snappedPosition[0] !== position[0] || snappedPosition[2] !== position[2]) {
              attachedObject.position.set(snappedPosition[0], snappedPosition[1], snappedPosition[2]);
            }
          }

          // Update the store
          updateObject(selectedObject.id, {
            position: snappedPosition,
            rotation,
            scale,
          });
        }
      };

      const handleDragStart = (event: any) => {
        // Disable orbit controls during transform
        gl.domElement.style.cursor = 'grabbing';
      };
      
      const handleDragEnd = (event: any) => {
        // Re-enable orbit controls
        gl.domElement.style.cursor = 'default';
      };

      controls.addEventListener('change', handleChange);
      controls.addEventListener('mouseDown', handleDragStart);
      controls.addEventListener('mouseUp', handleDragEnd);
      
      // Handle orbit controls disabling
      controls.addEventListener('dragging-changed', (event: any) => {
        // This will be handled by OrbitControls automatically
      });

      return () => {
        controls.removeEventListener('change', handleChange);
        controls.removeEventListener('mouseDown', handleDragStart);
        controls.removeEventListener('mouseUp', handleDragEnd);
      };
    }
  }, [transformRef.current, attachedObject, selectedObject, updateObject, snapToGrid, transformMode, gl]);

  // Don't render if no object selected or no transform tool active
  if (!selectedObject || !transformMode) {
    return null;
  }

  return (
    <TransformControls
      ref={transformRef}
      mode={transformMode}
      size={0.8}
      showX={true}
      showY={true}
      showZ={true}
      enabled={true}
      space="world"
    />
  );
}
