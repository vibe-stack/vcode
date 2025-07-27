import React, { useRef, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Plane } from '@react-three/drei';
import * as THREE from 'three/webgpu';
import { useThree } from '@react-three/fiber';
import { useMapBuilderStore, MapObject } from '../../store';
import { findHighestObjectIntersection } from '../../utils/aabb';
import { createDoorGeometry } from '../../utils/door-geometry';

// Component for the preview object
type PreviewObjectProps = {
  position: THREE.Vector3 | null;
  dimensions: [number, number, number];
  cutoutWidth: number;
  cutoutHeight: number;
  cutoutRadius: number;
  stage: 'idle' | 'positioning' | 'sizing' | 'depth' | 'cutout' | 'radius' | 'placed';
};

const PreviewObject: React.FC<PreviewObjectProps> = ({ 
  position, 
  dimensions, 
  cutoutWidth, 
  cutoutHeight, 
  cutoutRadius, 
  stage 
}) => {
  if (!position) return null;

  // Adjust position for different stages
  const adjustedPosition = position.clone();
  if (stage === 'depth' || stage === 'cutout' || stage === 'radius' || stage === 'placed') {
    adjustedPosition.y = position.y + dimensions[1] / 2; // Center the door vertically based on height
  }

  // Create geometry based on stage
  let geometry: React.ReactNode;
  
  if (stage === 'positioning' || stage === 'sizing') {
    // Show a flat rectangle on the ground
    geometry = <planeGeometry args={[dimensions[0], dimensions[2]]} />;
  } else if (stage === 'depth') {
    // Show the basic box
    geometry = <boxGeometry args={dimensions} />;
  } else {
    // Show the door with cutout
    const doorGeometry = createDoorGeometry(
      dimensions[0], 
      dimensions[1], 
      dimensions[2], 
      cutoutWidth, 
      cutoutHeight, 
      cutoutRadius
    );
    geometry = <primitive object={doorGeometry} />;
  }

  return (
    <mesh
      position={adjustedPosition}
      rotation={stage === 'positioning' || stage === 'sizing' ? [-Math.PI / 2, 0, 0] : [0, 0, 0]}
    >
      {geometry}
      <meshStandardMaterial color="gray" opacity={stage === 'placed' ? 1 : 0.5} transparent />
    </mesh>
  );
};

export default function DoorCreator() {
  const [preview, setPreview] = useState<{ 
    position: THREE.Vector3; 
    dimensions: [number, number, number];
    cutoutWidth: number;
    cutoutHeight: number;
    cutoutRadius: number;
  } | null>(null);
  const [stage, setStage] = useState<'idle' | 'positioning' | 'sizing' | 'depth' | 'cutout' | 'radius'>('idle');
  const [lastMousePos, setLastMousePos] = useState<THREE.Vector3 | null>(null);
  const [pointerLocked, setPointerLocked] = useState(false);
  const [accumDelta, setAccumDelta] = useState({ x: 0, y: 0 });
  const planeRef = useRef<THREE.Mesh>(null!);
  const { camera, raycaster, mouse, gl } = useThree();
  
  const { 
    finishCreating,
    cancelCreating,
    generateId,
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
      
      setPreview({ 
        position: snappedPoint, 
        dimensions: [1, 0.1, 1],
        cutoutWidth: 0.8,
        cutoutHeight: 1.8,
        cutoutRadius: 0
      });
    }
  });

  // Click handler for positioning
  const handleClick = () => {
    if (stage === 'idle') {
      setStage('positioning');
      setLastMousePos(preview?.position || null);
    } else if (stage === 'positioning') {
      setStage('sizing');
    } else if (stage === 'sizing') {
      setStage('depth');
    } else if (stage === 'depth') {
      setStage('cutout');
    } else if (stage === 'cutout') {
      setStage('radius');
    } else if (stage === 'radius') {
      // Create the final object
      if (preview) {
        const newObject: Omit<MapObject, 'id'> = {
          type: 'door',
          position: [preview.position.x, preview.position.y + preview.dimensions[1] / 2, preview.position.z],
          rotation: [0, 0, 0],
          scale: preview.dimensions,
          color: '#8B4513', // Brown color for door
          geometry: {
            width: preview.dimensions[0],
            height: preview.dimensions[1],
            depth: preview.dimensions[2],
            cutoutWidth: preview.cutoutWidth,
            cutoutHeight: preview.cutoutHeight,
            cutoutRadius: preview.cutoutRadius,
          },
          name: `Door ${generateId()}`,
        };

        const objectId = addObject(newObject);
        finishCreating();
        setActiveTool('select');
        selectObject(objectId);
        
        // Reset state
        setStage('idle');
        setPreview(null);
        setLastMousePos(null);
      }
    }
  };

  // Mouse move handler for resizing
  useFrame(() => {
    if (!preview || !lastMousePos || stage === 'idle') return;

    raycaster.setFromCamera(mouse, camera);
    
    if (stage === 'sizing') {
      // Handle width/depth sizing
      const groundIntersects = raycaster.intersectObject(planeRef.current);
      if (groundIntersects.length > 0) {
        const point = groundIntersects[0].point;
        const deltaX = Math.abs(point.x - lastMousePos.x);
        const deltaZ = Math.abs(point.z - lastMousePos.z);
        
        const newWidth = Math.max(0.1, deltaX * 2);
        const newDepth = Math.max(0.1, deltaZ * 2);
        
        setPreview(prev => prev ? {
          ...prev,
          dimensions: [newWidth, prev.dimensions[1], newDepth]
        } : null);
      }
    } else if ((stage === 'depth' || stage === 'cutout' || stage === 'radius') && pointerLocked) {
      // Use pointer lock deltas for infinite movement
      if (stage === 'depth') {
        // Height
        const heightDelta = -accumDelta.y * 0.01;
        const newHeight = Math.max(0.1, 1 + heightDelta);
        setPreview(prev => prev ? {
          ...prev,
          dimensions: [prev.dimensions[0], newHeight, prev.dimensions[2]]
        } : null);
      } else if (stage === 'cutout') {
        // Cutout size
        const cutoutWidthDelta = accumDelta.x * 0.01;
        const cutoutHeightDelta = -accumDelta.y * 0.01;
        const maxCutoutWidth = preview.dimensions[0] * 0.9;
        const maxCutoutHeight = preview.dimensions[1] * 0.9;
        const newCutoutWidth = Math.max(0.1, Math.min(maxCutoutWidth, 0.8 + cutoutWidthDelta));
        const newCutoutHeight = Math.max(0.1, Math.min(maxCutoutHeight, 1.8 + cutoutHeightDelta));
        setPreview(prev => prev ? {
          ...prev,
          cutoutWidth: newCutoutWidth,
          cutoutHeight: newCutoutHeight
        } : null);
      } else if (stage === 'radius') {
        // Cutout radius (arch)
        const radiusDelta = -accumDelta.y * 0.01;
        const maxRadius = preview.cutoutWidth / 2;
        const newRadius = Math.max(0, Math.min(maxRadius, radiusDelta));
        setPreview(prev => prev ? {
          ...prev,
          cutoutRadius: newRadius
        } : null);
      }
    }
  });

  // Handle escape key to cancel
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        cancelCreating();
        setStage('idle');
        setPreview(null);
        setLastMousePos(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cancelCreating]);

  // Handle canvas click
  useEffect(() => {
    const canvas = gl.domElement;
    const onClick = (e: MouseEvent) => {
      handleClick();
    };
    canvas.addEventListener('click', onClick);
    return () => canvas.removeEventListener('click', onClick);
  }, [stage, preview, gl.domElement]);

  // Request pointer lock immediately when entering pointer lock stages
  useEffect(() => {
    const canvas = gl.domElement;
    if (['depth', 'cutout', 'radius'].includes(stage) && !pointerLocked) {
      canvas.requestPointerLock();
    }
  }, [stage, pointerLocked, gl.domElement]);

  // Pointer lock event listeners
  useEffect(() => {
    const handlePointerLockChange = () => {
      setPointerLocked(document.pointerLockElement === gl.domElement);
      if (document.pointerLockElement !== gl.domElement) {
        setAccumDelta({ x: 0, y: 0 });
      }
    };
    document.addEventListener('pointerlockchange', handlePointerLockChange);
    return () => document.removeEventListener('pointerlockchange', handlePointerLockChange);
  }, [gl.domElement]);

  // Mouse move event for pointer lock
  useEffect(() => {
    if (!pointerLocked) return;
    const handleMouseMove = (e: MouseEvent) => {
      setAccumDelta(prev => ({
        x: prev.x + e.movementX,
        y: prev.y + e.movementY,
      }));
    };
    document.addEventListener('mousemove', handleMouseMove);
    return () => document.removeEventListener('mousemove', handleMouseMove);
  }, [pointerLocked]);

  // Exit pointer lock on Escape or when leaving stage
  useEffect(() => {
    if (!pointerLocked) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        document.exitPointerLock();
        cancelCreating();
        setStage('idle');
        setPreview(null);
        setLastMousePos(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [pointerLocked, cancelCreating]);

  // Reset pointer lock and deltas when leaving pointer lock stages
  useEffect(() => {
    if (!['depth', 'cutout', 'radius'].includes(stage) && pointerLocked) {
      document.exitPointerLock();
      setAccumDelta({ x: 0, y: 0 });
    }
    if (['depth', 'cutout', 'radius'].includes(stage)) {
      setAccumDelta({ x: 0, y: 0 });
    }
  }, [stage, pointerLocked]);

  if (activeShape !== 'door') return null;

  return (
    <>
      {/* Ground plane for interaction */}
      <Plane
        ref={planeRef}
        args={[1000, 1000]}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0, 0]}
        visible={false}
      />
      
      {/* Preview object */}
      {preview && (
        <PreviewObject
          position={preview.position}
          dimensions={preview.dimensions}
          cutoutWidth={preview.cutoutWidth}
          cutoutHeight={preview.cutoutHeight}
          cutoutRadius={preview.cutoutRadius}
          stage={stage}
        />
      )}
    </>
  );
}
