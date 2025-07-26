import React, { useRef, useState, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useMapBuilderStore, MapObject } from '../store';
import * as THREE from 'three/webgpu';

interface MapObjectMeshProps {
  object: MapObject;
  onClick?: (objectId: string, event: any) => void;
}

export default function MapObjectMesh({ object, onClick }: MapObjectMeshProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const { selectedObjectIds, activeTool } = useMapBuilderStore();
  
  const isSelected = selectedObjectIds.includes(object.id);
  
  // Create geometry based on object type
  const createGeometry = () => {
    const { type, scale } = object;
    
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
      default:
        return new THREE.BoxGeometry(1, 1, 1);
    }
  };

  const geometry = createGeometry();

  const handleClick = (event: any) => {
    event.stopPropagation();
    if (onClick) {
      onClick(object.id, event);
    }
  };

  const handlePointerOver = (event: any) => {
    event.stopPropagation();
    setHovered(true);
    document.body.style.cursor = 'pointer';
  };

  const handlePointerOut = () => {
    setHovered(false);
    document.body.style.cursor = 'auto';
  };

  // Create material with selection and hover effects
  const createMaterial = () => {
    const baseColor = new THREE.Color(object.color);
    
    let finalColor = baseColor;
    if (isSelected) {
      finalColor = baseColor.clone().lerp(new THREE.Color('#ffffff'), 0.3);
    } else if (hovered) {
      finalColor = baseColor.clone().lerp(new THREE.Color('#ffffff'), 0.1);
    }

    return new THREE.MeshStandardMaterial({
      color: finalColor,
      metalness: object.material?.metalness || 0,
      roughness: object.material?.roughness || 0.5,
      transparent: object.material?.transparent || false,
      opacity: object.material?.opacity || 1,
    });
  };

  const material = createMaterial();

  useEffect(() => {
    return () => {
      geometry.dispose();
      material.dispose();
    };
  }, []);

  return (
    <mesh
      ref={meshRef}
      geometry={geometry}
      material={material}
      position={object.position}
      rotation={object.rotation}
      castShadow
      receiveShadow
      onClick={handleClick}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
      userData={{ objectId: object.id }}
    >
      {/* Wireframe overlay for selected objects */}
      {isSelected && (
        <meshBasicMaterial
          color="#ffff00"
          wireframe
          transparent
          opacity={0.5}
          depthTest={false}
        />
      )}
    </mesh>
  );
}
