import * as THREE from 'three';

export function lerp(a, b, t) {
  return a + (b - a) * t;
}

export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function smoothstep(edge0, edge1, x) {
  const t = clamp((x - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
}

export function randomRange(min, max) {
  return Math.random() * (max - min) + min;
}

export function randomInt(min, max) {
  return Math.floor(randomRange(min, max + 1));
}

export function distance2D(x1, z1, x2, z2) {
  const dx = x2 - x1;
  const dz = z2 - z1;
  return Math.sqrt(dx * dx + dz * dz);
}

export function angleBetween(x1, z1, x2, z2) {
  return Math.atan2(x2 - x1, z2 - z1);
}

export function isInCone(originX, originZ, originAngle, targetX, targetZ, range, halfAngle) {
  const dist = distance2D(originX, originZ, targetX, targetZ);
  if (dist > range) return false;

  const angleToTarget = angleBetween(originX, originZ, targetX, targetZ);
  let diff = angleToTarget - originAngle;
  while (diff > Math.PI) diff -= Math.PI * 2;
  while (diff < -Math.PI) diff += Math.PI * 2;

  return Math.abs(diff) < halfAngle;
}

// Simple AABB collision
export function boxContains(box, x, z) {
  return x >= box.minX && x <= box.maxX && z >= box.minZ && z <= box.maxZ;
}

// Create a stone-like material with variation
export function createStoneMaterial(baseColor, roughness = 0.95) {
  return new THREE.MeshStandardMaterial({
    color: baseColor,
    roughness,
    metalness: 0.0,
  });
}

// Create wood material
export function createWoodMaterial(baseColor) {
  return new THREE.MeshStandardMaterial({
    color: baseColor,
    roughness: 0.85,
    metalness: 0.0,
  });
}

// Create iron/metal material
export function createMetalMaterial(baseColor) {
  return new THREE.MeshStandardMaterial({
    color: baseColor,
    roughness: 0.7,
    metalness: 0.4,
  });
}

export function createEmissiveMaterial(color, intensity = 1) {
  return new THREE.MeshStandardMaterial({
    color,
    emissive: color,
    emissiveIntensity: intensity,
    roughness: 0.5,
    metalness: 0.0,
  });
}
