"use client";

import type { FFmpeg } from "@ffmpeg/ffmpeg";
import { buildFfmpegReelArgs } from "./ffmpeg-command";

type RenderOptions = {
  imageUrl: string;
  caption: string;
  price: string;
  shopName: string;
  scene: string;
  audioUrl?: string | null;
};

let ffmpegPromise: Promise<FFmpeg> | null = null;
let reportRenderProgress: ((progress: number) => void) | null = null;

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Dressed model image could not be loaded"));
    image.src = url;
  });
}

async function getFfmpeg(): Promise<FFmpeg> {
  ffmpegPromise ??= (async () => {
    const { FFmpeg } = await import("@ffmpeg/ffmpeg");
    const instance = new FFmpeg();
    instance.on("progress", ({ progress }) => {
      reportRenderProgress?.(Math.max(0, Math.min(progress, 1)));
    });
    await instance.load({
      coreURL: "/ffmpeg/ffmpeg-core.js",
      wasmURL: "/ffmpeg/ffmpeg-core.wasm",
    });
    return instance;
  })();
  try {
    return await ffmpegPromise;
  } catch (error) {
    ffmpegPromise = null;
    throw error;
  }
}

function drawWrappedText(context: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number): void {
  const words = text.split(" ");
  let line = "";
  for (const word of words) {
    const next = `${line} ${word}`.trim();
    if (context.measureText(next).width > maxWidth && line) {
      context.fillText(line, x, y);
      line = word;
      y += lineHeight;
    } else line = next;
  }
  if (line) context.fillText(line, x, y);
}

async function composeFrame(options: RenderOptions, image: HTMLImageElement): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = 1080;
  canvas.height = 1920;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas unavailable");

  const background = options.scene === "boutique" ? "#fff7ed" : options.scene === "street" ? "#f5f5f4" : "#f4f4f5";
  context.fillStyle = background;
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = "rgba(255,255,255,0.62)";
  context.fillRect(42, 42, 996, 1836);

  const scale = Math.min(900 / image.width, 1200 / image.height);
  const width = image.width * scale;
  const height = image.height * scale;
  context.drawImage(image, (1080 - width) / 2, 190 + (1200 - height) / 2, width, height);

  context.fillStyle = "#18181b";
  context.font = "900 48px Arial";
  context.fillText(options.shopName || "Apni Dukaan", 82, 120);
  context.fillStyle = "#16a34a";
  context.font = "900 42px Arial";
  context.fillText(options.price || "Fresh arrival", 82, 178);
  context.fillStyle = "#18181b";
  context.font = "900 36px Arial";
  context.fillText("Naya stock aa gaya!", 82, 1370);
  context.fillStyle = "#18181b";
  context.font = "900 50px Arial";
  drawWrappedText(context, options.caption, 82, 1450, 916, 64);
  context.fillStyle = "#16a34a";
  context.font = "700 32px Arial";
  context.fillText("Apna size / colour ke liye DM karo", 82, 1770);

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("Could not compose reel frame")), "image/png");
  });
}

export async function renderReelVideo(
  options: RenderOptions,
  onProgress?: (stage: "preparing" | "loading" | "rendering", progress: number) => void,
): Promise<Blob> {
  if (typeof WebAssembly === "undefined") throw new Error("This browser cannot create the video");
  onProgress?.("preparing", 0.05);
  const image = await loadImage(options.imageUrl);
  const frame = await composeFrame(options, image);
  onProgress?.("loading", 0.1);
  const ffmpeg = await getFfmpeg();
  reportRenderProgress = (progress) => onProgress?.("rendering", 0.15 + progress * 0.8);

  try {
    await ffmpeg.writeFile("frame.png", new Uint8Array(await frame.arrayBuffer()));

    let hasAudio = false;
    if (options.audioUrl) {
      const response = await fetch(options.audioUrl);
      if (!response.ok) throw new Error("Voice audio could not be loaded");
      await ffmpeg.writeFile("audio.mp3", new Uint8Array(await response.arrayBuffer()));
      hasAudio = true;
    }

    const exitCode = await ffmpeg.exec(buildFfmpegReelArgs(hasAudio));
    if (exitCode !== 0) throw new Error("Video rendering failed");
    const output = await ffmpeg.readFile("reel.mp4");
    if (typeof output === "string") throw new Error("FFmpeg returned text instead of a video");
    const outputBytes = new Uint8Array(output);
    const ownedBuffer = new ArrayBuffer(outputBytes.byteLength);
    new Uint8Array(ownedBuffer).set(outputBytes);
    onProgress?.("rendering", 1);
    return new Blob([ownedBuffer], { type: "video/mp4" });
  } finally {
    reportRenderProgress = null;
    await Promise.allSettled([
      ffmpeg.deleteFile("frame.png"),
      ffmpeg.deleteFile("audio.mp3"),
      ffmpeg.deleteFile("reel.mp4"),
    ]);
  }
}
