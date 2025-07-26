import React, { useRef, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Plane } from '@react-three/drei';
import * as THREE from 'three/webgpu';
import { useThree } from '@react-three/fiber';
import { useMapBuilderStore } from '../../store';

// Component for the preview object
type PreviewObjectProps = {
  position: THREE.Vector3 | null;
  dimensions: [number, number];
  stage: 'idle' | 'positioning' | 'sizing' | 'placed';
};

const PreviewObject: React.FC<PreviewObjectProps> = ({ position, dimensions, stage }) => {
  if (!position) return null;

  return (
    <mesh position={position} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={dimensions} />
      <meshStandardMaterial color="gray" opacity={stage === 'placed' ? 1 : 0.5} transparent />
    </mesh>
  );
};

export default function PlaneCreator() {
  const [preview, setPreview] = useState<{ position: THREE.Vector3; dimensions: [number, number] } | null>(null);
  const [stage, setStage] = useState<'idle' | 'positioning' | 'sizing'>('idle');
  const [lastMousePos, setLastMousePos] = useState<THREE.Vector3 | null>(null);
  const planeRef = useRef<THREE.Mesh>(null!);
  const { camera, raycaster, mouse, gl } = useThree();
  
  const { 
    finishCreating,
    cancelCreating,
    addObject,
    snapToGrid,
    activeShape,
    setActiveTool,
    selectObject
  } = useMapBuilderStore();

  // Handle mouse movement for preview positioning only in idle state
  useFrame(() => {
    if (stage === 'idle') {
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObject(planeRef.current);
      if (intersects.length > 0) {
        const point = intersects[0].point;
        point.y = 0; // Keep on ground plane
        
        // Snap to grid
        const snappedPoint = new THREE.Vector3(
          snapToGrid(point.x),
          point.y,
          snapToGrid(point.z)
        );
        
        setPreview({ position: snappedPoint, dimensions: [1, 1] });
      }
    }
  });

  // Handle mouse clicks for state progression
  const handleClick = () => {
    if (stage === 'idle') {
      if (preview) {
        setStage('sizing');
        setLastMousePos(preview.position);
      }
    } else if (stage === 'sizing') {
      if (preview) {
        // Create the final object
        const finalObject = {
          type: 'plane' as const,
          position: [
            preview.position.x,
            preview.position.y,
            preview.position.z
          ] as [number, number, number],
          rotation: [-Math.PI / 2, 0, 0] as [number, number, number], // Lay flat on ground
          scale: [preview.dimensions[0], preview.dimensions[1], 1] as [number, number, number],
          color: '#4f46e5',
          name: `plane_${Math.random().toString(36).substr(2, 6)}`,
        };
        
        const { addObject } = useMapBuilderStore.getState();
        addObject(finalObject);
        
        // Get the ID of the newly created object (it will be the last one)
        const { objects } = useMapBuilderStore.getState();
        const newObjectId = objects[objects.length - 1].id;
        
        // Auto-switch to select tool and select the created object
        finishCreating();
        setActiveTool('select');
        selectObject(newObjectId);
      }
      setStage('idle');
      setPreview(null);
      setLastMousePos(null);
    }
  };

  // Handle mouse movement for sizing
  const handleMouseMove = (event: MouseEvent) => {
    if (stage === 'sizing') {
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObject(planeRef.current);
      if (intersects.length > 0) {
        const currentPos = intersects[0].point;
        currentPos.y = 0; // Keep on ground plane
        
        // Snap to grid
        const snappedCurrentPos = new THREE.Vector3(
          snapToGrid(currentPos.x),
          currentPos.y,
          snapToGrid(currentPos.z)
        );
        
        if (lastMousePos && preview) {
          const deltaX = Math.abs(snappedCurrentPos.x - lastMousePos.x);
          const deltaZ = Math.abs(snappedCurrentPos.z - lastMousePos.z);
          const width = Math.max(0.1, deltaX * 2);
          const height = Math.max(0.1, deltaZ * 2);
          setPreview({ ...preview, dimensions: [width, height] });
        }
      }
    }
  };

  // Handle escape key to cancel
  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      cancelCreating();
      setStage('idle');
      setPreview(null);
      setLastMousePos(null);
    }
  };

  // Attach mouse events to the WebGL canvas
  useEffect(() => {
    const canvas = gl.domElement;
    canvas.addEventListener('click', handleClick);
    canvas.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      canvas.removeEventListener('click', handleClick);
      canvas.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [gl, stage, preview, lastMousePos]);

  // Only render if we're creating a plane
  if (activeShape !== 'plane') return null;

  return (
    <group>
      <Plane
        ref={planeRef}
        args={[100, 100]}
        rotation={[-Math.PI / 2, 0, 0]}
        visible={false}
      />
      {preview && <PreviewObject {...preview} stage={stage} />}
    </group>
  );
}
