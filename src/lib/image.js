// src/lib/image.js
// Normalize images to display reliably in iOS PWA (HEIC/HEIF can render black)
// and keep them lightweight (avoid localStorage quota issues).

function readAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error || new Error("FileReader error"));
    reader.onload = () => resolve(String(reader.result || ""));
    reader.readAsDataURL(file);
  });
}

function clamp(n, a, b) {
  return Math.max(a, Math.min(b, n));
}

async function decodeBitmap(file) {
  // Best effort: ask browser to apply EXIF orientation if supported.
  try {
    return await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    // Fallback: plain decode
    return await createImageBitmap(file);
  }
}

export async function fileToDisplayDataUrl(file, opts = {}) {
  const quality = typeof opts.quality === "number" ? clamp(opts.quality, 0.5, 0.95) : 0.88;
  const maxDim = typeof opts.maxDim === "number" ? clamp(opts.maxDim, 240, 1440) : 720;
  if (!file) return null;

  const t = (file.type || "").toLowerCase();
  const isAlreadySafe = t === "image/jpeg" || t === "image/jpg" || t === "image/png" || t === "image/webp";

  // If it's already safe, still resize/compress because iPhone photos can be huge.
  // We only skip processing for small files.
  const shouldProcess = !isAlreadySafe || file.size > 350 * 1024; // >350KB

  if (!shouldProcess) {
    try {
      return await readAsDataURL(file);
    } catch {
      return null;
    }
  }

  try {
    const bmp = await decodeBitmap(file);

    const w = bmp.width || 1;
    const h = bmp.height || 1;
    const scale = Math.min(1, maxDim / Math.max(w, h));
    const outW = Math.max(1, Math.round(w * scale));
    const outH = Math.max(1, Math.round(h * scale));

    const canvas = document.createElement("canvas");
    canvas.width = outW;
    canvas.height = outH;
    const ctx = canvas.getContext("2d", { alpha: false });
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(bmp, 0, 0, outW, outH);

    // Always encode to JPEG for max compatibility in iOS PWA
    return canvas.toDataURL("image/jpeg", quality);
  } catch (e) {
    // Fallback: still store original DataURL (may fail on some iOS builds)
    try {
      return await readAsDataURL(file);
    } catch {
      return null;
    }
  }
}
