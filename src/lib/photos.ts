import { readReceipts } from "./ocr";
import type { KnownIngredient } from "./receipt";
import { supabase } from "./supabase";
import type { Zone } from "./types";

export interface ParsedItem {
  raw: string;
  name: string;
  zone: Zone;
}

export interface PhotoResult {
  items: ParsedItem[];
  local: boolean;
}

const MAX_EDGE = 1568;

async function toJpeg(file: File): Promise<{ media_type: "image/jpeg"; data: string }> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const blob = await new Promise<Blob>((res, rej) => canvas.toBlob((b) => (b ? res(b) : rej(new Error("encode"))), "image/jpeg", 0.85));
  const buf = new Uint8Array(await blob.arrayBuffer());
  let bin = "";
  for (let i = 0; i < buf.length; i += 0x8000) bin += String.fromCharCode(...buf.subarray(i, i + 0x8000));
  return { media_type: "image/jpeg", data: btoa(bin) };
}

let aiReady: Promise<boolean> | null = null;

// An empty request answers 400 (no images) only when the function has its API key, so the photos are uploaded only if the AI can read them.
function aiAvailable() {
  if (!supabase) return Promise.resolve(false);
  aiReady ??= supabase.functions
    .invoke("parse-photos", { body: {} })
    .then(({ error }) => (error as { context?: Response } | null)?.context?.status === 400)
    .catch(() => false);
  return aiReady;
}

export async function parsePhotos(files: File[], known: KnownIngredient[], onLocal: () => void, onProgress: (share: number) => void): Promise<PhotoResult> {
  const picked = files.slice(0, 6);
  if (await aiAvailable()) {
    try {
      const images = await Promise.all(picked.map(toJpeg));
      const { data, error } = await supabase!.functions.invoke<{ items: ParsedItem[] }>("parse-photos", { body: { images, known: known.map((k) => k.name) } });
      if (!error && data) return { items: data.items, local: false };
    } catch (e) {
      console.error(e);
    }
  }
  onLocal();
  return { items: await readReceipts(picked, known, onProgress), local: true };
}
