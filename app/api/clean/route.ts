import { NextRequest, NextResponse } from "next/server";

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

    // strip data URL prefix if present
    const b64 = raw.includes(",") ? raw.split(",")[1] : raw;
    const apiKey = process.env.REMOVE_BG_API_KEY || process.env.REMOVE_BG;
    if (!apiKey || apiKey.includes("your_")) {
      // fallback: return original with hint — client can use @imgly wasm locally
      return NextResponse.json(
        { error: "REMOVE_BG_API_KEY missing", fallback: true, png: raw },
        { status: 200 }
      );
    }

    // remove.bg expects form-data
    const form = new FormData();
    form.append("image_file_b64", b64);
    form.append("size", "auto");
    // transparent bg (default), no bg_color

    const res = await fetch("https://api.remove.bg/v1.0/removebg", {
      method: "POST",
      headers: { "X-Api-Key": apiKey },
      body: form as unknown as BodyInit,
    });

    if (!res.ok) {
      const text = await res.text();
      console.error("remove.bg error", res.status, text);
      return NextResponse.json({ error: `remove.bg ${res.status}`, details: text, fallback: true, png: raw }, { status: 200 });
    }

    const buffer = Buffer.from(await res.arrayBuffer());
    const pngBase64 = `data:image/png;base64,${buffer.toString("base64")}`;

    // Optional: upload to R2 if running on Cloudflare Workers (env.R2) — on Vercel this is no-op
    // For Vercel + R2 S3, handle in /api/upload separately; here just return

    return NextResponse.json({ png: pngBase64, width: 1080, height: 1920 });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "clean failed";
    console.error(msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ ok: true, route: "/api/clean", expects: "POST {imageBase64: dataUrl}" });
}
