import * as THREE from 'three/webgpu';
import { MapObject } from '../store';

// Helper function to calculate AABB for an object
export const calculateObjectAABB = (object: MapObject): THREE.Box3 => {
  const box = new THREE.Box3();
  const position = new THREE.Vector3(...object.position);
  const scale = new THREE.Vector3(...object.scale);
  
  // Create a bounding box based on object type and scale
  let halfExtents = new THREE.Vector3();
  
  switch (object.type) {
    case 'box':
      halfExtents.set(scale.x / 2, scale.y / 2, scale.z / 2);
      break;
    case 'sphere':
      const radius = Math.max(scale.x, scale.y, scale.z) / 2;
      halfExtents.set(radius, radius, radius);
      break;
    case 'cylinder':
      halfExtents.set(scale.x / 2, scale.y / 2, scale.x / 2); // x scale is radius
      break;
    case 'cone':
      halfExtents.set(scale.x / 2, scale.y / 2, scale.x / 2); // x scale is radius
      break;
    case 'plane':
      halfExtents.set(scale.x / 2, 0.01, scale.z / 2); // Very thin for plane
      break;
    default:
      halfExtents.set(scale.x / 2, scale.y / 2, scale.z / 2);
  }
  
  box.setFromCenterAndSize(position, halfExtents.clone().multiplyScalar(2));
  return box;
};

// Helper function to check if a ray intersects with an object's AABB
export const rayIntersectsAABB = (ray: THREE.Ray, box: THREE.Box3): { intersects: boolean; distance: number; point?: THREE.Vector3 } => {
  const target = new THREE.Vector3();
  const intersectionPoint = ray.intersectBox(box, target);
  
  if (intersectionPoint) {
    const distance = ray.origin.distanceTo(intersectionPoint);
    return { intersects: true, distance, point: intersectionPoint };
  }
  
  return { intersects: false, distance: Infinity };
};

// Helper function to find the highest object intersection for stacking
export const findHighestObjectIntersection = (
  ray: THREE.Ray, 
  objects: MapObject[]
): { point: THREE.Vector3; height: number } | null => {
  let highestIntersection: { point: THREE.Vector3; height: number } | null = null;
  
  // Check intersections with all existing objects
  for (const object of objects) {
    const aabb = calculateObjectAABB(object);
    const intersection = rayIntersectsAABB(ray, aabb);
    
    if (intersection.intersects && intersection.point) {
      const topOfObject = aabb.max.y;
      
      // Keep track of the highest intersection
      if (!highestIntersection || topOfObject > highestIntersection.height) {
        // Use the XZ coordinates from the intersection point, but Y from the top of the AABB
        const point = intersection.point.clone();
        point.y = topOfObject;
        
        highestIntersection = {
          point,
          height: topOfObject
        };
      }
    }
  }
  
  return highestIntersection;
};
