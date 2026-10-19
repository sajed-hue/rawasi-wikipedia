// Client-side image shrinking before upload (browser only).
//
// Storage is limited (Supabase free tier: 1 GB), and phone photos are often
// 6–12 MB — above the API's 5 MB limit. We downscale large images to at most
// MAX_DIMENSION px on the longest side and re-encode (WebP, or JPEG where the
// browser can't encode WebP). Small images are uploaded untouched. The backend
// still validates size, type and magic bytes — this is an optimization only.

const MAX_DIMENSION = 1600;
/** Below this size and dimension, upload the original as-is. */
const KEEP_ORIGINAL_UNDER_BYTES = 1024 * 1024;
const WEBP_QUALITY = 0.82;
const JPEG_QUALITY = 0.85;

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not read image"));
    };
    img.src = url;
  });
}

function toBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, type, quality));
}

/** Replace the file extension to match the new type. */
function renamed(name: string, extension: string): string {
  const base = name.replace(/\.[^.]+$/, "") || "image";
  return `${base}.${extension}`;
}

/**
 * Returns a smaller version of `file` when that helps, otherwise `file` itself.
 * Never throws for decoding problems: falls back to the original file so the
 * backend's validation decides.
 */
export async function shrinkImage(file: File): Promise<File> {
  let img: HTMLImageElement;
  try {
    img = await loadImage(file);
  } catch {
    return file;
  }

  const longest = Math.max(img.naturalWidth, img.naturalHeight);
  if (file.size <= KEEP_ORIGINAL_UNDER_BYTES && longest <= MAX_DIMENSION) return file;

  const scale = Math.min(1, MAX_DIMENSION / longest);
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(img.naturalWidth * scale));
  canvas.height = Math.max(1, Math.round(img.naturalHeight * scale));
  const ctx = canvas.getContext("2d");
  if (!ctx) return file;
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

  // Prefer WebP (keeps transparency, smaller). Browsers that can't encode WebP
  // return PNG instead — detect that and use JPEG on a white background.
  let blob = await toBlob(canvas, "image/webp", WEBP_QUALITY);
  let type = "image/webp";
  let extension = "webp";
  if (!blob || blob.type !== "image/webp") {
    ctx.globalCompositeOperation = "destination-over";
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    blob = await toBlob(canvas, "image/jpeg", JPEG_QUALITY);
    type = "image/jpeg";
    extension = "jpg";
  }

  // Keep the original if re-encoding didn't actually help.
  if (!blob || blob.size >= file.size) return file;
  return new File([blob], renamed(file.name, extension), { type, lastModified: Date.now() });
}
