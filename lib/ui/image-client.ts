// Utilidades de imagen para el navegador (canvas). Solo se llaman desde
// componentes cliente. No usar en servidor.
import { aspectRatioValue, type ImageSpec } from '@/lib/domain/image-specs';

export interface ImageMeta {
  width: number;
  height: number;
  url: string;
}

export function loadImageMeta(file: File): Promise<ImageMeta> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight, url });
    img.onerror = () => reject(new Error('No se pudo leer la imagen'));
    img.src = url;
  });
}

/** Recorta al centro para lograr el aspect ratio de destino. Devuelve un File. */
export async function cropToAspect(file: File, spec: ImageSpec): Promise<File> {
  const target = aspectRatioValue(spec.aspectRatio);
  const meta = await loadImageMeta(file);
  const img = await loadHtmlImage(meta.url);
  const srcRatio = meta.width / meta.height;

  let sw = meta.width;
  let sh = meta.height;
  if (srcRatio > target) sw = Math.round(meta.height * target);
  else sh = Math.round(meta.width / target);
  const sx = Math.round((meta.width - sw) / 2);
  const sy = Math.round((meta.height - sh) / 2);

  // Escala máxima a la anchura recomendada del spec.
  const outW = Math.min(sw, spec.width);
  const outH = Math.round(outW / target);

  const canvas = document.createElement('canvas');
  canvas.width = outW;
  canvas.height = outH;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, outW, outH);
  URL.revokeObjectURL(meta.url);
  return canvasToFile(canvas, file.name, spec.formats.includes('png'));
}

/** Comprime (y opcionalmente reescala) hasta quedar bajo `maxBytes`. */
export async function compressImage(file: File, spec: ImageSpec): Promise<File> {
  const maxBytes = spec.maxSizeMB * 1024 * 1024;
  if (file.size <= maxBytes) return file;

  const meta = await loadImageMeta(file);
  const img = await loadHtmlImage(meta.url);
  let width = Math.min(meta.width, spec.width);
  let height = Math.round((width / meta.width) * meta.height);

  for (let attempt = 0; attempt < 6; attempt++) {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    canvas.getContext('2d')!.drawImage(img, 0, 0, width, height);
    // Calidad decreciente
    const quality = Math.max(0.5, 0.85 - attempt * 0.08);
    const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, 'image/jpeg', quality));
    if (blob && blob.size <= maxBytes) {
      URL.revokeObjectURL(meta.url);
      return new File([blob], renameExt(file.name, 'jpg'), { type: 'image/jpeg' });
    }
    width = Math.round(width * 0.85);
    height = Math.round(height * 0.85);
  }
  URL.revokeObjectURL(meta.url);
  // Último recurso: devuelve el original (el backend igual valida el tope).
  return file;
}

function loadHtmlImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

function canvasToFile(canvas: HTMLCanvasElement, name: string, png: boolean): Promise<File> {
  const type = png ? 'image/png' : 'image/jpeg';
  const ext = png ? 'png' : 'jpg';
  return new Promise((resolve) => {
    canvas.toBlob(
      (blob) => resolve(new File([blob!], renameExt(name, ext), { type })),
      type,
      png ? undefined : 0.9,
    );
  });
}

function renameExt(name: string, ext: string): string {
  const dot = name.lastIndexOf('.');
  return (dot >= 0 ? name.slice(0, dot) : name) + '.' + ext;
}
