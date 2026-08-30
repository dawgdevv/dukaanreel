import "server-only";

import {
  GetObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import type { CreateReelInput, Reel } from "./types";
import { MOCK_IMAGE } from "./mock";
import { assetPath, normalizeAssetUrl } from "./cloudflare-url";

const REEL_PREFIX = "_reels/";
let client: S3Client | undefined;

type R2Config = {
  bucket: string;
  client: S3Client;
};

function requiredEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is not configured`);
  return value;
}

function r2(): R2Config {
  const accountId = requiredEnv("CLOUDFLARE_ACCOUNT_ID");
  const accessKeyId = requiredEnv("R2_ACCESS_KEY_ID");
  const secretAccessKey = requiredEnv("R2_SECRET_ACCESS_KEY");
  const bucket = requiredEnv("R2_BUCKET_NAME");

  client ??= new S3Client({
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    region: "auto",
    credentials: { accessKeyId, secretAccessKey },
  });

  return { bucket, client };
}

function reelKey(id: string): string {
  return `${REEL_PREFIX}${id}.json`;
}

function publicAssetUrl(key: string): string {
  return assetPath(key);
}

function isNotFound(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const candidate = error as { name?: string; $metadata?: { httpStatusCode?: number } };
  return candidate.name === "NoSuchKey" || candidate.$metadata?.httpStatusCode === 404;
}

async function writeReel(reel: Reel): Promise<void> {
  const config = r2();
  await config.client.send(new PutObjectCommand({
    Bucket: config.bucket,
    Key: reelKey(reel.id),
    Body: JSON.stringify(reel),
    ContentType: "application/json",
    CacheControl: "no-store",
  }));
}

async function readReelKey(key: string): Promise<Reel | null> {
  const config = r2();
  try {
    const response = await config.client.send(new GetObjectCommand({
      Bucket: config.bucket,
      Key: key,
    }));
    if (!response.Body) return null;
    const reel = JSON.parse(await response.Body.transformToString()) as Reel;
    const legacyBaseUrl = process.env.NEXT_PUBLIC_R2_PUBLIC_URL?.trim() || "";
    return { ...reel, imageUrl: normalizeAssetUrl(reel.imageUrl, legacyBaseUrl), audioUrl: reel.audioUrl ? normalizeAssetUrl(reel.audioUrl, legacyBaseUrl) : null, videoUrl: reel.videoUrl ? normalizeAssetUrl(reel.videoUrl, legacyBaseUrl) : null };
  } catch (error) {
    if (isNotFound(error)) return null;
    throw error;
  }
}

export async function createReel(input: CreateReelInput): Promise<Reel> {
  const reel: Reel = {
    ...input,
    videoUrl: input.videoUrl ?? null,
    status: input.status ?? "ready",
    createdAt: new Date().toISOString(),
  };
  await writeReel(reel);
  return reel;
}

export async function getReel(id: string): Promise<Reel | null> {
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
      voiceText: "Apni Dukaan par naya product, sirf 799 rupaye mein. Abhi WhatsApp par message karke order karein.",
      videoUrl: null,
      status: "ready",
      createdAt: new Date().toISOString(),
    };
  }
  return readReelKey(reelKey(id));
}

export async function listReels(limit = 9): Promise<Reel[]> {
  const config = r2();
  const response = await config.client.send(new ListObjectsV2Command({
    Bucket: config.bucket,
    Prefix: REEL_PREFIX,
    MaxKeys: 100,
  }));
  const keys = (response.Contents ?? []).flatMap((object) => object.Key ? [object.Key] : []);
  const records = await Promise.all(keys.map(readReelKey));
  return records
    .filter((reel): reel is Reel => Boolean(reel) && reel?.status !== "failed")
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, limit);
}

export async function updateReelVideo(id: string, videoUrl: string): Promise<Reel | null> {
  const reel = await getReel(id);
  if (!reel) return null;
  const updated: Reel = { ...reel, videoUrl, status: "ready" };
  await writeReel(updated);
  return updated;
}

export async function putAsset(key: string, value: Uint8Array, contentType: string): Promise<string> {
  const config = r2();
  await config.client.send(new PutObjectCommand({
    Bucket: config.bucket,
    Key: key,
    Body: value,
    ContentType: contentType,
    CacheControl: "public, max-age=31536000, immutable",
  }));
  return publicAssetUrl(key);
}

export async function putOriginalAsset(key: string, value: Uint8Array, contentType: string): Promise<void> {
  const config = r2();
  await config.client.send(new PutObjectCommand({
    Bucket: config.bucket,
    Key: key,
    Body: value,
    ContentType: contentType,
    CacheControl: "private, max-age=0, no-store",
  }));
}

export async function getAsset(key: string): Promise<{ bytes: Uint8Array; contentType: string } | null> {
  const config = r2();
  try {
    const response = await config.client.send(new GetObjectCommand({ Bucket: config.bucket, Key: key }));
    if (!response.Body) return null;
    return {
      bytes: await response.Body.transformToByteArray(),
      contentType: response.ContentType || "application/octet-stream",
    };
  } catch (error) {
    if (isNotFound(error)) return null;
    throw error;
  }
}

export function bytesToBase64(bytes: Uint8Array): string {
  return Buffer.from(bytes).toString("base64");
}

export function base64ToBytes(value: string): Uint8Array {
  return Uint8Array.from(Buffer.from(value.replace(/^data:[^;]+;base64,/, ""), "base64"));
}
