import { supabase } from "./supabase";
import type { Zone } from "./types";

export interface ParsedItem {
  raw: string;
  name: string;
  zone: Zone;
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

export class PhotosUnavailable extends Error {}

export async function parsePhotos(files: File[], known: string[]): Promise<ParsedItem[]> {
  if (!supabase) throw new PhotosUnavailable();
  const images = await Promise.all(files.slice(0, 6).map(toJpeg));
  const { data, error } = await supabase.functions.invoke<{ items: ParsedItem[] }>("parse-photos", { body: { images, known } });
  if (error || !data) throw error ?? new Error("empty");
  return data.items;
}
