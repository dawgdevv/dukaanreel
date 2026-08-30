import { getReel } from "@/lib/cloudflare";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const reel = await getReel(id);
  return reel ? Response.json({ reel }) : Response.json({ error: "Reel not found" }, { status: 404 });
}
