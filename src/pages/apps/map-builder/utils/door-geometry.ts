import * as THREE from 'three/webgpu';

/**
 * Creates a door geometry - essentially a box with a cutout
 * @param width Total width of the door
 * @param height Total height of the door
 * @param depth Total depth of the door
 * @param cutoutWidth Width of the cutout
 * @param cutoutHeight Height of the cutout
 * @param cutoutRadius Radius for the top of the cutout (arch effect)
 */
export function createDoorGeometry(
  width: number = 2,
  height: number = 2.5,
  depth: number = 0.2,
  cutoutWidth: number = 0.8,
  cutoutHeight: number = 1.8,
  cutoutRadius: number = 0
): THREE.BufferGeometry {
  // Create the outer box shape
  const shape = new THREE.Shape();
  shape.moveTo(-width / 2, -height / 2);
  shape.lineTo(width / 2, -height / 2);
  shape.lineTo(width / 2, height / 2);
  shape.lineTo(-width / 2, height / 2);
  shape.lineTo(-width / 2, -height / 2);

  // Create the cutout hole
  const hole = new THREE.Path();
  const cutoutLeft = -cutoutWidth / 2;
  const cutoutRight = cutoutWidth / 2;
  const cutoutBottom = -height / 2;
  const cutoutTop = cutoutBottom + cutoutHeight;

  // Start from bottom left of cutout
  hole.moveTo(cutoutLeft, cutoutBottom);
  hole.lineTo(cutoutRight, cutoutBottom);
  hole.lineTo(cutoutRight, cutoutTop - cutoutRadius);

  // Add arch if radius is specified
  if (cutoutRadius > 0) {
    // Right side of arch
    hole.lineTo(cutoutRadius, cutoutTop - cutoutRadius);
    // Arc across the top
    hole.arc(-cutoutRadius, 0, cutoutRadius, 0, Math.PI, false);
    // Left side of arch
    hole.lineTo(cutoutLeft, cutoutTop - cutoutRadius);
  } else {
    // Flat top
    hole.lineTo(cutoutRight, cutoutTop);
    hole.lineTo(cutoutLeft, cutoutTop);
  }

  hole.lineTo(cutoutLeft, cutoutBottom);

  // Add hole to shape
  shape.holes.push(hole);

  // Extrude the shape
  const extrudeSettings = {
    depth: depth,
    bevelEnabled: false,
  };

  const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
  
  // Center the geometry
  geometry.translate(0, 0, -depth / 2);
  
  return geometry;
}

/**
 * Rebuilds door geometry when parameters change
 */
export function updateDoorGeometry(
  geometry: THREE.BufferGeometry,
  width: number,
  height: number,
  depth: number,
  cutoutWidth: number,
  cutoutHeight: number,
  cutoutRadius: number
): THREE.BufferGeometry {
  // Dispose the old geometry
  geometry.dispose();
  
  // Create new geometry
  return createDoorGeometry(width, height, depth, cutoutWidth, cutoutHeight, cutoutRadius);
}
