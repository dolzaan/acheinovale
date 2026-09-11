import {
  PROPERTY_IMAGE_MAX_BYTES,
  PROPERTY_IMAGE_MAX_EDGE,
  PROPERTY_IMAGE_TARGET_BYTES,
} from "@/lib/supabase/storage";

const WEBP_QUALITIES = [0.82, 0.72, 0.62, 0.54] as const;
const MAX_RESIZE_PASSES = 3;

function loadImage(file: File) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error(`Não foi possível processar a foto “${file.name}”.`));
    };
    image.src = url;
  });
}

function canvasToWebp(canvas: HTMLCanvasElement, quality: number) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(blob => {
      if (blob) resolve(blob);
      else reject(new Error("O navegador não conseguiu otimizar a foto."));
    }, "image/webp", quality);
  });
}

function webpName(name: string) {
  const base = name.replace(/\.[^.]+$/, "").trim() || "foto-imovel";
  return `${base}.webp`;
}

export async function optimizePropertyImage(file: File) {
  const image = await loadImage(file);
  const largestEdge = Math.max(image.naturalWidth, image.naturalHeight);

  if (!Number.isFinite(largestEdge) || largestEdge <= 0) {
    throw new Error(`A foto “${file.name}” não possui dimensões válidas.`);
  }

  if (largestEdge <= PROPERTY_IMAGE_MAX_EDGE && file.size <= PROPERTY_IMAGE_TARGET_BYTES) {
    return file;
  }

  let scale = Math.min(1, PROPERTY_IMAGE_MAX_EDGE / largestEdge);
  let bestBlob: Blob | null = null;

  for (let pass = 0; pass < MAX_RESIZE_PASSES; pass += 1) {
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
    const context = canvas.getContext("2d", { alpha: true });
    if (!context) throw new Error("O navegador não conseguiu preparar a foto.");
    context.drawImage(image, 0, 0, canvas.width, canvas.height);

    for (const quality of WEBP_QUALITIES) {
      const blob = await canvasToWebp(canvas, quality);
      if (!bestBlob || blob.size < bestBlob.size) bestBlob = blob;
      if (blob.size <= PROPERTY_IMAGE_TARGET_BYTES) {
        return new File([blob], webpName(file.name), { type: "image/webp", lastModified: Date.now() });
      }
    }

    scale *= 0.82;
  }

  if (bestBlob && bestBlob.size <= PROPERTY_IMAGE_MAX_BYTES) {
    return new File([bestBlob], webpName(file.name), { type: "image/webp", lastModified: Date.now() });
  }
  if (file.size <= PROPERTY_IMAGE_MAX_BYTES) return file;
  throw new Error(`A foto “${file.name}” não pôde ser reduzida para menos de 2 MB.`);
}

export async function optimizePropertyImages(files: File[]) {
  const optimized: File[] = [];
  for (const file of files) optimized.push(await optimizePropertyImage(file));
  return optimized;
}
