import type { ParsedItem } from "./photos";
import { parseReceipt, type KnownIngredient } from "./receipt";

const MAX_PIXELS = 4_000_000;

async function prepare(file: File) {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(2, Math.sqrt(MAX_PIXELS / (bitmap.width * bitmap.height)));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const ctx = canvas.getContext("2d")!;
  ctx.filter = "grayscale(1) contrast(1.4)";
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return canvas;
}

export async function readReceipts(files: File[], known: KnownIngredient[], onProgress?: (share: number) => void): Promise<ParsedItem[]> {
  const { createWorker } = await import("tesseract.js");
  let done = 0;
  const worker = await createWorker("ces", 1, {
    logger: (m) => {
      if (m.status === "recognizing text") onProgress?.((done + m.progress) / files.length);
    },
  });
  try {
    let text = "";
    for (const file of files) {
      const { data } = await worker.recognize(await prepare(file));
      text += `${data.text}\n`;
      done++;
    }
    return parseReceipt(text, known);
  } finally {
    await worker.terminate();
  }
}
