import { putAsset, updateReelVideo } from "@/lib/cloudflare";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const id = request.headers.get("x-reel-id");
  const token = request.headers.get("x-upload-token");
  const contentType = request.headers.get("content-type") ?? "";
  if (!id || token !== btoa(id)) return Response.json({ error: "Invalid upload token" }, { status: 401 });
  if (!/^video\/(webm|mp4)/.test(contentType)) return Response.json({ error: "Unsupported video type" }, { status: 400 });
  const bytes = new Uint8Array(await request.arrayBuffer());
  if (bytes.byteLength > 25 * 1024 * 1024) return Response.json({ error: "Video is too large" }, { status: 413 });
  const videoUrl = await putAsset(`${id}/reel.${contentType.includes("mp4") ? "mp4" : "webm"}`, bytes, contentType);
  const reel = await updateReelVideo(id, videoUrl);
  if (!reel) return Response.json({ error: "Reel not found" }, { status: 404 });
  return Response.json({ id, videoUrl, status: "ready" });
}
