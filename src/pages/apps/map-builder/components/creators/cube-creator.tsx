import React, { useRef, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Plane } from '@react-three/drei';
import * as THREE from 'three/webgpu';
import { useThree } from '@react-three/fiber';

// Component for the preview object
type PreviewObjectProps = {
  position: THREE.Vector3 | null;
  dimensions: number[];
  stage: 'idle' | 'positioning' | 'sizing' | 'depth' | 'placed';
};

const PreviewObject: React.FC<PreviewObjectProps> = ({ position, dimensions, stage }) => {
  if (!position) return null;

  // Adjust position for depth stage to grow from ground up
  const adjustedPosition = position.clone();
  if (stage === 'depth' || stage === 'placed') {
    adjustedPosition.y = dimensions[1] / 2; // Center the cube vertically based on depth
  }

  return (
    <mesh
      position={adjustedPosition}
      rotation={stage === 'positioning' || stage === 'sizing' ? [-Math.PI / 2, 0, 0] : [0, 0, 0]}
    >
      {stage === 'positioning' || stage === 'sizing' ? (
        <planeGeometry args={[dimensions[0], dimensions[2]]} />
      ) : (
        <boxGeometry args={dimensions as [number, number, number]} />
      )}
      <meshStandardMaterial color="gray" opacity={stage === 'placed' ? 1 : 0.5} transparent />
    </mesh>
  );
};

// Main Map Builder Component
type ObjectType = {
  position: THREE.Vector3;
  dimensions: number[];
  id: number;
};

type PreviewType = {
  position: THREE.Vector3;
  dimensions: number[];
};

export const CubeCreatorTest: React.FC = () => {
  const [objects, setObjects] = useState<ObjectType[]>([]);
  const [preview, setPreview] = useState<PreviewType | null>(null);
  const [stage, setStage] = useState<'idle' | 'positioning' | 'sizing' | 'depth'>('idle');
  const [lastMousePos, setLastMousePos] = useState<THREE.Vector3 | null>(null);
  const planeRef = useRef<THREE.Mesh>(null!);
  const { camera, raycaster, mouse, gl } = useThree();

  // Handle mouse movement for preview positioning only in idle state
  useFrame(() => {
    if (stage === 'idle') {
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObject(planeRef.current);
      if (intersects.length > 0) {
        const point = intersects[0].point;
        point.y = 0; // Keep on ground plane
        setPreview({ position: point, dimensions: [1, 0.1, 1] });
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
      setStage('depth');
    } else if (stage === 'depth') {
      if (preview) {
        setObjects([...objects, { ...preview, id: Date.now() }]);
      }
      setStage('idle');
      setPreview(null);
      setLastMousePos(null);
    }
  };

  // Handle mouse movement for sizing and depth
  const handleMouseMove = (event: MouseEvent) => {
    if (stage === 'sizing' || stage === 'depth') {
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObject(planeRef.current);
      if (intersects.length > 0) {
        const currentPos = intersects[0].point;
        currentPos.y = 0; // Keep on ground plane
        if (lastMousePos && preview) {
          const delta = currentPos.clone().sub(lastMousePos);

          if (stage === 'sizing') {
            const width = Math.max(0.1, preview.dimensions[0] + delta.x * 0.5);
            const height = Math.max(0.1, preview.dimensions[2] + delta.z * 0.5);
            setPreview({ ...preview, dimensions: [width, 0.1, height] });
          } else if (stage === 'depth') {
            const depth = Math.max(0.1, preview.dimensions[1] + delta.z * 0.5);
            setPreview({ ...preview, dimensions: [preview.dimensions[0], depth, preview.dimensions[2]] });
          }
        }
        setLastMousePos(currentPos);
      }
    }
  };

  // Attach mouse events to the WebGL canvas
  useEffect(() => {
    const canvas = gl.domElement;
    canvas.addEventListener('click', handleClick);
    canvas.addEventListener('mousemove', handleMouseMove);
    return () => {
      canvas.removeEventListener('click', handleClick);
      canvas.removeEventListener('mousemove', handleMouseMove);
    };
  }, [gl, stage, preview, lastMousePos]);

  return (
    <group>
      <Plane
        ref={planeRef}
        args={[100, 100]}
        rotation={[-Math.PI / 2, 0, 0]}
        visible={false}
      />
      {objects.map((obj) => (
        <PreviewObject key={obj.id} {...obj} stage="placed" />
      ))}
      {preview && <PreviewObject {...preview} stage={stage} />}
    </group>
  );
};