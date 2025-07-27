import React, { useRef, useState, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useMapBuilderStore, MapObject } from '../store';
import * as THREE from 'three/webgpu';
import { createDoorGeometry } from '../utils/door-geometry';

interface MapObjectMeshProps {
  object: MapObject;
  onClick?: (objectId: string, event: any) => void;
}

export default function MapObjectMesh({ object, onClick }: MapObjectMeshProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const [currentGeometry, setCurrentGeometry] = useState<THREE.BufferGeometry | null>(null);
  const { selectedObjectIds, activeTool } = useMapBuilderStore();
  
  const isSelected = selectedObjectIds.includes(object.id);
  
  // Create geometry based on object type
  const createGeometry = () => {
    const { type } = object;
    
    switch (type) {
      case 'box':
        return new THREE.BoxGeometry(1, 1, 1); // Unit size, scaling done via transform
      case 'sphere':
        return new THREE.SphereGeometry(1, 32, 32); // Unit radius
      case 'cylinder':
        return new THREE.CylinderGeometry(1, 1, 1, 32); // Unit size
      case 'plane':
        return new THREE.PlaneGeometry(1, 1); // Unit size
      case 'cone':
        return new THREE.ConeGeometry(1, 1, 32); // Unit size
      case 'door':
        return createDoorGeometry(
          object.geometry?.width || object.scale[0],
          object.geometry?.height || object.scale[1], 
          object.geometry?.depth || object.scale[2],
          object.geometry?.cutoutWidth || 0.8,
          object.geometry?.cutoutHeight || 1.8,
          object.geometry?.cutoutRadius || 0
        );
      default:
        return new THREE.BoxGeometry(1, 1, 1);
    }
  };

  // Handle geometry updates for door type
  useEffect(() => {
    if (object.type === 'door') {
      const newGeometry = createGeometry();
      
      // Dispose old geometry if it exists
      if (currentGeometry) {
        currentGeometry.dispose();
      }
      
      setCurrentGeometry(newGeometry);
      
      // Update mesh geometry
      if (meshRef.current) {
        meshRef.current.geometry = newGeometry;
      }
      
      return () => {
        if (newGeometry) {
          newGeometry.dispose();
        }
      };
    } else {
      // For non-door objects, create geometry once
      if (!currentGeometry) {
        const newGeometry = createGeometry();
        setCurrentGeometry(newGeometry);
      }
    }
  }, [object.type, object.geometry, object.scale]);

  const geometry = currentGeometry || createGeometry();

  // Apply scale correctly based on object type
  const getObjectScale = () => {
    if (object.type === 'cylinder') {
      // For cylinders: [radius, height, radius] -> [x_scale, y_scale, z_scale]
      return [object.scale[0], object.scale[1], object.scale[0]] as [number, number, number];
    } else if (object.type === 'door') {
      // For doors, scaling is already baked into the geometry
      return [1, 1, 1] as [number, number, number];
    }
    return object.scale;
  };

  // Ensure mesh scale is synchronized with object scale
  useEffect(() => {
    if (meshRef.current) {
      const correctScale = getObjectScale();
      meshRef.current.scale.fromArray(correctScale);
    }
  }, [object.scale, object.type]);

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

    // Convert side string to Three.js constant
    let sideValue: THREE.Side = THREE.FrontSide; // default
    switch (object.material?.side) {
      case 'front':
        sideValue = THREE.FrontSide;
        break;
      case 'back':
        sideValue = THREE.BackSide;
        break;
      case 'double':
        sideValue = THREE.DoubleSide;
        break;
      default:
        sideValue = THREE.FrontSide;
    }

    return new THREE.MeshStandardMaterial({
      color: finalColor,
      metalness: object.material?.metalness || 0,
      roughness: object.material?.roughness || 0.5,
      transparent: object.material?.transparent || false,
      opacity: object.material?.opacity || 1,
      side: sideValue,
    });
  };

  const material = createMaterial();

  useEffect(() => {
    return () => {
      if (currentGeometry) {
        currentGeometry.dispose();
      }
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
      scale={getObjectScale()}
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
