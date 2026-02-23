import * as THREE from 'three';

// Generate procedural stone texture via canvas
export function createStoneTexture(baseR, baseG, baseB, size = 256) {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  // Base color
  ctx.fillStyle = `rgb(${baseR}, ${baseG}, ${baseB})`;
  ctx.fillRect(0, 0, size, size);

  // Add noise variation
  const imageData = ctx.getImageData(0, 0, size, size);
  const data = imageData.data;

  for (let i = 0; i < data.length; i += 4) {
    const noise = (Math.random() - 0.5) * 30;
    data[i] = Math.max(0, Math.min(255, data[i] + noise));
    data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + noise));
    data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + noise));
  }

  ctx.putImageData(imageData, 0, 0);

  // Add subtle mortar lines (stone block pattern)
  ctx.strokeStyle = `rgba(${Math.max(0, baseR - 15)}, ${Math.max(0, baseG - 15)}, ${Math.max(0, baseB - 15)}, 0.4)`;
  ctx.lineWidth = 1;

  const blockH = size / 4;
  const blockW = size / 2;
  for (let y = 0; y < size; y += blockH) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(size, y);
    ctx.stroke();

    const offset = (Math.floor(y / blockH) % 2) * blockW / 2;
    for (let x = offset; x < size; x += blockW) {
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x, y + blockH);
      ctx.stroke();
    }
  }

  // Add random cracks
  ctx.strokeStyle = `rgba(${Math.max(0, baseR - 25)}, ${Math.max(0, baseG - 25)}, ${Math.max(0, baseB - 25)}, 0.3)`;
  ctx.lineWidth = 0.5;
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    let x = Math.random() * size;
    let y = Math.random() * size;
    ctx.moveTo(x, y);
    for (let j = 0; j < 5; j++) {
      x += (Math.random() - 0.5) * 30;
      y += Math.random() * 20;
      ctx.lineTo(x, y);
    }
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(2, 2);
  return texture;
}

// Generate floor tile texture
export function createFloorTexture(baseR, baseG, baseB, size = 256) {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  // Base
  ctx.fillStyle = `rgb(${baseR}, ${baseG}, ${baseB})`;
  ctx.fillRect(0, 0, size, size);

  // Noise
  const imageData = ctx.getImageData(0, 0, size, size);
  const data = imageData.data;
  for (let i = 0; i < data.length; i += 4) {
    const noise = (Math.random() - 0.5) * 20;
    data[i] = Math.max(0, Math.min(255, data[i] + noise));
    data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + noise));
    data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + noise));
  }
  ctx.putImageData(imageData, 0, 0);

  // Grid lines for tiles
  ctx.strokeStyle = `rgba(${Math.max(0, baseR - 20)}, ${Math.max(0, baseG - 20)}, ${Math.max(0, baseB - 20)}, 0.5)`;
  ctx.lineWidth = 2;

  const tileSize = size / 4;
  for (let x = 0; x <= size; x += tileSize) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, size);
    ctx.stroke();
  }
  for (let y = 0; y <= size; y += tileSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(size, y);
    ctx.stroke();
  }

  // Stains and wear
  for (let i = 0; i < 5; i++) {
    const stainX = Math.random() * size;
    const stainY = Math.random() * size;
    const stainR = 10 + Math.random() * 20;
    const gradient = ctx.createRadialGradient(stainX, stainY, 0, stainX, stainY, stainR);
    gradient.addColorStop(0, `rgba(${Math.max(0, baseR - 20)}, ${Math.max(0, baseG - 15)}, ${Math.max(0, baseB - 10)}, 0.3)`);
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(stainX - stainR, stainY - stainR, stainR * 2, stainR * 2);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(8, 8);
  return texture;
}

// Generate wood grain texture
export function createWoodTexture(baseR, baseG, baseB, size = 128) {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  // Base
  ctx.fillStyle = `rgb(${baseR}, ${baseG}, ${baseB})`;
  ctx.fillRect(0, 0, size, size);

  // Wood grain lines
  ctx.strokeStyle = `rgba(${Math.max(0, baseR - 15)}, ${Math.max(0, baseG - 10)}, ${Math.max(0, baseB - 5)}, 0.4)`;
  ctx.lineWidth = 1;
  for (let y = 0; y < size; y += 3 + Math.random() * 4) {
    ctx.beginPath();
    ctx.moveTo(0, y + Math.random() * 2);
    for (let x = 0; x < size; x += 10) {
      ctx.lineTo(x, y + Math.sin(x * 0.05) * 2 + Math.random());
    }
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  return texture;
}
