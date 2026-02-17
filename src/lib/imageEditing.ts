/**
 * Client-side image editing utilities using Canvas API
 */

export function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

export async function rotateImage(url: string, degrees: 90 | 180 | 270): Promise<Blob> {
  const img = await loadImage(url);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d")!;

  if (degrees === 180) {
    canvas.width = img.width;
    canvas.height = img.height;
  } else {
    canvas.width = img.height;
    canvas.height = img.width;
  }

  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.rotate((degrees * Math.PI) / 180);
  ctx.drawImage(img, -img.width / 2, -img.height / 2);

  return new Promise((resolve) => canvas.toBlob((blob) => resolve(blob!), "image/png"));
}

export async function flipImage(url: string, direction: "horizontal" | "vertical"): Promise<Blob> {
  const img = await loadImage(url);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d")!;
  canvas.width = img.width;
  canvas.height = img.height;

  if (direction === "horizontal") {
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
  } else {
    ctx.translate(0, canvas.height);
    ctx.scale(1, -1);
  }
  ctx.drawImage(img, 0, 0);

  return new Promise((resolve) => canvas.toBlob((blob) => resolve(blob!), "image/png"));
}

export async function removeWhitespace(url: string, tolerance: number = 30): Promise<Blob> {
  const img = await loadImage(url);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d")!;
  canvas.width = img.width;
  canvas.height = img.height;
  ctx.drawImage(img, 0, 0);

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const { data, width, height } = imageData;

  const isWhitish = (i: number) =>
    data[i] > 255 - tolerance && data[i + 1] > 255 - tolerance && data[i + 2] > 255 - tolerance;

  let top = 0, bottom = height - 1, left = 0, right = width - 1;

  // Find top
  topLoop: for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (!isWhitish((y * width + x) * 4)) { top = y; break topLoop; }
    }
  }
  // Find bottom
  bottomLoop: for (let y = height - 1; y >= top; y--) {
    for (let x = 0; x < width; x++) {
      if (!isWhitish((y * width + x) * 4)) { bottom = y; break bottomLoop; }
    }
  }
  // Find left
  leftLoop: for (let x = 0; x < width; x++) {
    for (let y = top; y <= bottom; y++) {
      if (!isWhitish((y * width + x) * 4)) { left = x; break leftLoop; }
    }
  }
  // Find right
  rightLoop: for (let x = width - 1; x >= left; x--) {
    for (let y = top; y <= bottom; y++) {
      if (!isWhitish((y * width + x) * 4)) { right = x; break rightLoop; }
    }
  }

  const cropWidth = right - left + 1;
  const cropHeight = bottom - top + 1;

  if (cropWidth <= 0 || cropHeight <= 0) {
    return new Promise((resolve) => canvas.toBlob((blob) => resolve(blob!), "image/png"));
  }

  const croppedCanvas = document.createElement("canvas");
  const croppedCtx = croppedCanvas.getContext("2d")!;
  croppedCanvas.width = cropWidth;
  croppedCanvas.height = cropHeight;
  croppedCtx.drawImage(canvas, left, top, cropWidth, cropHeight, 0, 0, cropWidth, cropHeight);

  return new Promise((resolve) => croppedCanvas.toBlob((blob) => resolve(blob!), "image/png"));
}

export async function removeBackground(url: string, tolerance: number = 40): Promise<Blob> {
  const img = await loadImage(url);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d")!;
  canvas.width = img.width;
  canvas.height = img.height;
  ctx.drawImage(img, 0, 0);

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const { data, width, height } = imageData;

  // Sample corner pixels for background color
  const corners = [
    0, // top-left
    (width - 1) * 4, // top-right
    ((height - 1) * width) * 4, // bottom-left
    ((height - 1) * width + (width - 1)) * 4, // bottom-right
  ];
  
  let bgR = 0, bgG = 0, bgB = 0;
  corners.forEach(i => { bgR += data[i]; bgG += data[i+1]; bgB += data[i+2]; });
  bgR /= 4; bgG /= 4; bgB /= 4;

  // Flood fill from edges
  const visited = new Uint8Array(width * height);
  const queue: number[] = [];

  // Add edge pixels to queue
  for (let x = 0; x < width; x++) {
    queue.push(x); // top row
    queue.push((height - 1) * width + x); // bottom row
  }
  for (let y = 0; y < height; y++) {
    queue.push(y * width); // left column
    queue.push(y * width + width - 1); // right column
  }

  while (queue.length > 0) {
    const idx = queue.pop()!;
    if (visited[idx]) continue;
    
    const i = idx * 4;
    const dr = Math.abs(data[i] - bgR);
    const dg = Math.abs(data[i + 1] - bgG);
    const db = Math.abs(data[i + 2] - bgB);
    
    if (dr <= tolerance && dg <= tolerance && db <= tolerance) {
      visited[idx] = 1;
      data[i + 3] = 0; // make transparent
      
      const x = idx % width;
      const y = Math.floor(idx / width);
      if (x > 0) queue.push(idx - 1);
      if (x < width - 1) queue.push(idx + 1);
      if (y > 0) queue.push(idx - width);
      if (y < height - 1) queue.push(idx + width);
    }
  }

  ctx.putImageData(imageData, 0, 0);
  return new Promise((resolve) => canvas.toBlob((blob) => resolve(blob!), "image/png"));
}
