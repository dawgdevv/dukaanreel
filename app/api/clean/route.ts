import { NextRequest, NextResponse } from "next/server";
import { createStudioProductPhoto, removeBackground } from "@/lib/providers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { imageBase64, image } = body as { imageBase64?: string; image?: string };
    const raw = imageBase64 || image;
    if (!raw) {
      return NextResponse.json({ error: "imageBase64 required" }, { status: 400 });
    }

    if (raw.length > 12 * 1024 * 1024) {
      return NextResponse.json({ error: "Image is too large" }, { status: 413 });
    }

    // Strip the data URL prefix if present.
    const b64 = raw.includes(",") ? raw.split(",")[1] : raw;
    const mimeType = raw.match(/^data:([^;]+);base64,/)?.[1] ?? "image/jpeg";
    if (!mimeType.startsWith("image/")) {
      return NextResponse.json({ error: "Only image files are supported" }, { status: 400 });
    }

    const input = new Uint8Array(Buffer.from(b64, "base64"));
    if (input.byteLength > 8 * 1024 * 1024) {
      return NextResponse.json({ error: "Image is too large" }, { status: 413 });
    }

    const cutout = await removeBackground(input, mimeType);
    const studioPhoto = await createStudioProductPhoto(cutout);
    const png = `data:image/png;base64,${Buffer.from(studioPhoto.bytes).toString("base64")}`;

    return NextResponse.json({
      png,
      width: studioPhoto.studio ? 1152 : null,
      height: studioPhoto.studio ? 2048 : null,
      studio: studioPhoto.studio,
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "clean failed";
    console.error(msg);
    return NextResponse.json({ error: "Photo clean nahi ho paayi. Dobara try karo." }, { status: 502 });
  }
}

export async function GET() {
  return NextResponse.json({ ok: true, route: "/api/clean", expects: "POST {imageBase64: dataUrl}", output: "studio PNG" });
}
