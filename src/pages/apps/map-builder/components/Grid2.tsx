import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three/webgpu';
import { Group, LineSegments } from 'three/webgpu';

interface Grid2Props {
  args?: [number, number];
  cellColor?: string;
  sectionColor?: string;
  fadeDistance?: number;
  fadeStrength?: number;
}

export default function Grid2({
  args = [10, 10],
  cellColor = "#666666",
  sectionColor = "#111111", 
  fadeDistance = 100,
  fadeStrength = 1
}: Grid2Props) {
  const groupRef = useRef<Group>(null);
  const meshRef = useRef<LineSegments>(null);
  
  const [size1, size2] = args;
  const size = Math.max(size1, size2);
  
  const { geometry, material } = useMemo(() => {
    const vertices = [];
    const colors = [];
    
    const cellColorObj = new THREE.Color(cellColor);
    const sectionColorObj = new THREE.Color(sectionColor);
    
    const halfSize = size / 2;
    const divisions = Math.floor(size / 1); // Create grid lines every 1 unit
    
    // Create grid lines
    for (let i = 0; i <= divisions; i++) {
      const position = (i / divisions) * size - halfSize;
      
      // Determine if this is a section line (every 10th line)
      const isSection = i % 10 === 0;
      const color = isSection ? sectionColorObj : cellColorObj;
      
      // Horizontal line
      vertices.push(-halfSize, 0, position);
      vertices.push(halfSize, 0, position);
      colors.push(color.r, color.g, color.b);
      colors.push(color.r, color.g, color.b);
      
      // Vertical line
      vertices.push(position, 0, -halfSize);
      vertices.push(position, 0, halfSize);
      colors.push(color.r, color.g, color.b);
      colors.push(color.r, color.g, color.b);
    }
    
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    
    const material = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.8
    });
    
    return { geometry, material };
  }, [size, cellColor, sectionColor]);
  
  // Handle fade effect
  useFrame(({ camera }) => {
    if (meshRef.current && fadeDistance > 0) {
      const distance = camera.position.distanceTo(meshRef.current.position);
      const fadeRatio = Math.max(0, 1 - (distance / fadeDistance) * fadeStrength);
      const mat = meshRef.current.material as THREE.LineBasicMaterial;
      mat.opacity = fadeRatio * 0.8;
    }
  });
  
  return (
    <group ref={groupRef}>
      <lineSegments ref={meshRef} geometry={geometry} material={material} />
    </group>
  );
} 