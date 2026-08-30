import { getAsset } from "@/lib/cloudflare";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ key: string[] }> }) {
  const { key: segments } = await params;
  const key = segments.join("/");
  if (!key || key.includes("..") || key.length > 240) {
    return Response.json({ error: "Invalid asset path" }, { status: 400 });
  }

  const asset = await getAsset(key);
  if (!asset) return Response.json({ error: "Asset not found" }, { status: 404 });
  return new Response(asset.bytes as BodyInit, {
    headers: {
      "Content-Type": asset.contentType,
      "Cache-Control": "public, max-age=31536000, immutable",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
