import { getCloudflareContext } from "@opennextjs/cloudflare";
import type { CreateReelInput, Reel } from "./types";
import { MOCK_IMAGE } from "./mock";

type D1Result = { results?: Record<string, unknown>[] };
type D1Statement = { bind: (...values: unknown[]) => D1Statement; all: <T>() => Promise<D1Result & { results?: T[] }>; run: () => Promise<unknown> };
type D1Database = { prepare: (query: string) => D1Statement };
type R2Bucket = { put: (key: string, value: ArrayBuffer | Uint8Array, options?: { httpMetadata?: { contentType?: string; cacheControl?: string } }) => Promise<unknown> };

type Bindings = {
  DB?: D1Database;
  R2?: R2Bucket;
  ASSET_BASE_URL?: string;
  NEXT_PUBLIC_R2_PUBLIC_URL?: string;
  DEMO_MODE?: string;
};

const memory = new Map<string, Reel>();

export async function bindings(): Promise<Bindings> {
  try {
    const context = await getCloudflareContext({ async: true });
    return (context.env ?? {}) as Bindings;
  } catch {
    return {
      DEMO_MODE: process.env.DEMO_MODE ?? "true",
      ASSET_BASE_URL: process.env.ASSET_BASE_URL,
      NEXT_PUBLIC_R2_PUBLIC_URL: process.env.NEXT_PUBLIC_R2_PUBLIC_URL,
    };
  }
}

function fromRow(row: Record<string, unknown>): Reel {
  return {
    id: String(row.id),
    caption: String(row.caption),
    productName: row.product_name ? String(row.product_name) : null,
    price: row.price === null || row.price === undefined ? null : Number(row.price),
    shopName: String(row.shop_name ?? "Apni Dukaan"),
    sceneId: String(row.scene_id ?? "white") as Reel["sceneId"],
    imageUrl: String(row.image_url),
    audioUrl: row.audio_url ? String(row.audio_url) : null,
    videoUrl: row.video_url ? String(row.video_url) : null,
    status: String(row.status ?? "ready") as Reel["status"],
    createdAt: String(row.created_at ?? new Date().toISOString()),
  };
}

export async function createReel(input: CreateReelInput): Promise<Reel> {
  const createdAt = new Date().toISOString();
  const reel: Reel = { ...input, videoUrl: input.videoUrl ?? null, status: input.status ?? "ready", createdAt };
  const env = await bindings();
  if (env.DB) {
    await env.DB.prepare(`INSERT INTO reels (id, caption, product_name, price, shop_name, scene_id, image_url, audio_url, video_url, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
      .bind(reel.id, reel.caption, reel.productName, reel.price, reel.shopName, reel.sceneId, reel.imageUrl, reel.audioUrl, reel.videoUrl, reel.status, createdAt).run();
  }
  memory.set(reel.id, reel);
  return reel;
}

export async function getReel(id: string): Promise<Reel | null> {
  const env = await bindings();
  if (env.DB) {
    const result = await env.DB.prepare("SELECT * FROM reels WHERE id = ? LIMIT 1").bind(id).all<Record<string, unknown>>();
    const row = result.results?.[0];
    if (row) return fromRow(row);
  }
  if (id === "demo-live") {
    return {
      id,
      caption: "Ye product fresh hai — ₹799 only! DM karo 💛 #newarrival #dukaanstyle #shoplocal",
      productName: "product",
      price: 799,
      shopName: "Apni Dukaan",
      sceneId: "white",
      imageUrl: MOCK_IMAGE,
      audioUrl: null,
      videoUrl: null,
      status: "ready",
      createdAt: new Date().toISOString(),
    };
  }
  return memory.get(id) ?? null;
}

export async function listReels(limit = 9): Promise<Reel[]> {
  const env = await bindings();
  if (env.DB) {
    const result = await env.DB.prepare("SELECT * FROM reels WHERE status != 'failed' ORDER BY created_at DESC LIMIT ?").bind(limit).all<Record<string, unknown>>();
    return (result.results ?? []).map(fromRow);
  }
  return [...memory.values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, limit);
}

export async function updateReelVideo(id: string, videoUrl: string): Promise<Reel | null> {
  const env = await bindings();
  if (env.DB) await env.DB.prepare("UPDATE reels SET video_url = ?, status = 'ready' WHERE id = ?").bind(videoUrl, id).run();
  const reel = memory.get(id);
  if (reel) {
    const updated = { ...reel, videoUrl, status: "ready" as const };
    memory.set(id, updated);
    return updated;
  }
  return getReel(id);
}

export async function putAsset(key: string, value: Uint8Array, contentType: string): Promise<string> {
  const env = await bindings();
  const baseUrl = (env.ASSET_BASE_URL ?? env.NEXT_PUBLIC_R2_PUBLIC_URL)?.replace(/\/$/, "");
  if (env.R2) {
    await env.R2.put(key, value, { httpMetadata: { contentType, cacheControl: "public, max-age=31536000, immutable" } });
    if (baseUrl) return `${baseUrl}/${key}`;
  }
  return `data:${contentType};base64,${bytesToBase64(value)}`;
}

export function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  return btoa(binary);
}

export function base64ToBytes(value: string): Uint8Array {
  const raw = atob(value.replace(/^data:[^;]+;base64,/, ""));
  return Uint8Array.from(raw, (char) => char.charCodeAt(0));
}
