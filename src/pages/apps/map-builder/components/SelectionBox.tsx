import React, { useMemo } from 'react';
import { useMapBuilderStore } from '../store';
import * as THREE from 'three/webgpu';
import { createDoorGeometry } from '../utils/door-geometry';

export default function SelectionBox() {
  const { selectedObjectIds, objects } = useMapBuilderStore();
  
  const selectedObjects = objects.filter(obj => selectedObjectIds.includes(obj.id));

  // Calculate actual bounding box from geometry
  const boundingBoxes = useMemo(() => {
    if (selectedObjectIds.length === 0) return [];
    return selectedObjects.map(obj => {
      // Create a temporary geometry based on object type to get accurate bounds
      let geometry: THREE.BufferGeometry;
      
      switch (obj.type) {
        case 'box':
          geometry = new THREE.BoxGeometry(...obj.scale);
          break;
        case 'sphere':
          geometry = new THREE.SphereGeometry(obj.scale[0] / 2, 32, 16);
          break;
        case 'cone':
          geometry = new THREE.ConeGeometry(obj.scale[0] / 2, obj.scale[1], 32);
          break;
        case 'cylinder':
          geometry = new THREE.CylinderGeometry(obj.scale[0] / 2, obj.scale[0] / 2, obj.scale[1], 32);
          break;
        case 'plane':
          geometry = new THREE.PlaneGeometry(...obj.scale);
          break;
        case 'door':
          geometry = createDoorGeometry(
            obj.geometry?.width || obj.scale[0],
            obj.geometry?.height || obj.scale[1], 
            obj.geometry?.depth || obj.scale[2],
            obj.geometry?.cutoutWidth || 0.8,
            obj.geometry?.cutoutHeight || 1.8,
            obj.geometry?.cutoutRadius || 0
          );
          break;
        default:
          geometry = new THREE.BoxGeometry(...obj.scale);
      }

      // Apply transformations
      const matrix = new THREE.Matrix4();
      matrix.compose(
        new THREE.Vector3(...obj.position),
        new THREE.Quaternion().setFromEuler(new THREE.Euler(...obj.rotation)),
        new THREE.Vector3(1, 1, 1) // Scale already applied to geometry
      );
      
      geometry.applyMatrix4(matrix);
      
      // Calculate bounding box
      geometry.computeBoundingBox();
      const box = geometry.boundingBox!.clone();
      
      geometry.dispose();
      return box;
    });
  }, [selectedObjects]);

  // Create wireframe lines for AABB
  const aabbLines = useMemo(() => {
    if (boundingBoxes.length === 0) return null;

    // Union all bounding boxes
    const unionBox = new THREE.Box3();
    boundingBoxes.forEach(box => unionBox.union(box));

    const min = unionBox.min;
    const max = unionBox.max;

    // Create the 12 edges of the bounding box as line segments
    const points = [];
    
    // Bottom face edges
    points.push(min.x, min.y, min.z, max.x, min.y, min.z); // front bottom
    points.push(max.x, min.y, min.z, max.x, min.y, max.z); // right bottom
    points.push(max.x, min.y, max.z, min.x, min.y, max.z); // back bottom
    points.push(min.x, min.y, max.z, min.x, min.y, min.z); // left bottom
    
    // Top face edges
    points.push(min.x, max.y, min.z, max.x, max.y, min.z); // front top
    points.push(max.x, max.y, min.z, max.x, max.y, max.z); // right top
    points.push(max.x, max.y, max.z, min.x, max.y, max.z); // back top
    points.push(min.x, max.y, max.z, min.x, max.y, min.z); // left top
    
    // Vertical edges
    points.push(min.x, min.y, min.z, min.x, max.y, min.z); // front left
    points.push(max.x, min.y, min.z, max.x, max.y, min.z); // front right
    points.push(max.x, min.y, max.z, max.x, max.y, max.z); // back right
    points.push(min.x, min.y, max.z, min.x, max.y, max.z); // back left

    return (
      <lineSegments>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            array={new Float32Array(points)}
            count={points.length / 3}
            itemSize={3}
          />
        </bufferGeometry>
        <lineBasicMaterial 
          color="#50d71e" 
          transparent 
          opacity={0.8}
          depthTest={false}
        />
      </lineSegments>
    );
  }, [boundingBoxes]);

  // Early return after all hooks are called
  if (selectedObjectIds.length === 0) return null;

  return aabbLines;
}
