import React, { useRef, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Plane } from '@react-three/drei';
import * as THREE from 'three/webgpu';
import { useThree } from '@react-three/fiber';
import { useMapBuilderStore } from '../../store';
import { findHighestObjectIntersection } from '../../utils/aabb';

// Component for the preview object
type PreviewObjectProps = {
  position: THREE.Vector3 | null;
  radius: number;
  height: number;
  stage: 'idle' | 'positioning' | 'radius' | 'height' | 'placed';
};

const PreviewObject: React.FC<PreviewObjectProps> = ({ position, radius, height, stage }) => {
  if (!position) return null;

  const adjustedPosition = position.clone();
  if (stage === 'height' || stage === 'placed') {
    adjustedPosition.y = position.y + height / 2; // Center the cone vertically from base position
  }

  return (
    <mesh position={adjustedPosition}>
      {stage === 'positioning' ? (
        // Show a circle (flat ring) on the ground
        <ringGeometry args={[radius * 0.9, radius, 32]} />
      ) : stage === 'radius' ? (
        // Show the cone at minimal height
        <coneGeometry args={[radius, 0.1, 32]} />
      ) : (
        // Show the full cone
        <coneGeometry args={[radius, height, 32]} />
      )}
      <meshStandardMaterial color="gray" opacity={stage === 'placed' ? 1 : 0.5} transparent />
    </mesh>
  );
};

export default function ConeCreator() {
  const [preview, setPreview] = useState<{ position: THREE.Vector3; radius: number; height: number } | null>(null);
  const [stage, setStage] = useState<'idle' | 'positioning' | 'radius' | 'height'>('idle');
  const [startMousePos, setStartMousePos] = useState<THREE.Vector3 | null>(null);
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
      
      // Get all existing objects from the store
      const { objects } = useMapBuilderStore.getState();
      
      // Create a ray from the camera
      const ray = raycaster.ray.clone();
      
      // Check intersections with existing objects first
      let groundIntersection: THREE.Vector3 | null = null;
      
      // Check intersection with ground plane first
      const groundIntersects = raycaster.intersectObject(planeRef.current);
      if (groundIntersects.length > 0) {
        groundIntersection = groundIntersects[0].point.clone();
        groundIntersection.y = 0; // Ensure it's on the ground
      }
      
      // Find highest object intersection using shared utility
      const highestIntersection = findHighestObjectIntersection(ray, objects);
      
      // Use the highest intersection, or fall back to ground
      let finalPoint: THREE.Vector3;
      if (highestIntersection) {
        finalPoint = highestIntersection.point;
      } else if (groundIntersection) {
        finalPoint = groundIntersection;
      } else {
        return; // No valid intersection found
      }
      
      // Snap to grid
      const snappedPoint = new THREE.Vector3(
        snapToGrid(finalPoint.x),
        finalPoint.y,
        snapToGrid(finalPoint.z)
      );
      
      setPreview({ position: snappedPoint, radius: 0.5, height: 1 });
    }
  });

  // Handle mouse clicks for state progression
  const handleClick = () => {
    if (stage === 'idle') {
      if (preview) {
        setStage('radius');
        setStartMousePos(preview.position.clone());
      }
    } else if (stage === 'radius') {
      setStage('height');
    } else if (stage === 'height') {
      if (preview) {
        // Create the final object
        const finalObject = {
          type: 'cone' as const,
          position: [
            preview.position.x,
            preview.position.y + preview.height / 2, // Center vertically from base position
            preview.position.z
          ] as [number, number, number],
          rotation: [0, 0, 0] as [number, number, number],
          scale: [preview.radius, preview.height, preview.radius] as [number, number, number],
          color: '#4f46e5',
          name: `cone_${Math.random().toString(36).substr(2, 6)}`,
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
      setStartMousePos(null);
    }
  };

  // Handle mouse movement for radius and height adjustment
  const handleMouseMove = (event: MouseEvent) => {
    if (stage === 'radius') {
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObject(planeRef.current);
      if (intersects.length > 0) {
        const currentPos = intersects[0].point;
        
        if (startMousePos && preview) {
          const distance = startMousePos.distanceTo(currentPos);
          const radius = Math.max(0.1, distance);
          
          setPreview({ ...preview, radius });
        }
      }
    } else if (stage === 'height') {
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObject(planeRef.current);
      if (intersects.length > 0) {
        const currentPos = intersects[0].point;
        
        if (startMousePos && preview) {
          const deltaZ = currentPos.z - startMousePos.z;
          const height = Math.max(0.1, Math.abs(deltaZ) * 2);
          
          setPreview({ ...preview, height });
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
      setStartMousePos(null);
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
  }, [gl, stage, preview, startMousePos]);

  // Only render if we're creating a cone
  if (activeShape !== 'cone') return null;

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
