import { bindings, createReel, putAsset } from "@/lib/cloudflare";
import { generateCaption, generateVoice, removeBackground } from "@/lib/providers";
import { processInputSchema } from "@/lib/validation";

export const runtime = "edge";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const image = form.get("image");
    if (!(image instanceof File)) return Response.json({ error: "Image is required" }, { status: 400 });
    if (!image.type.startsWith("image/")) return Response.json({ error: "Only image files are supported" }, { status: 400 });
    if (image.size > 8 * 1024 * 1024) return Response.json({ error: "Image is too large" }, { status: 413 });

    const parsed = processInputSchema.safeParse({
      price: form.get("price")?.toString() ?? "",
      shopName: form.get("shopName")?.toString() ?? "Apni Dukaan",
      sceneId: form.get("sceneId")?.toString() ?? "white",
    });
    if (!parsed.success) return Response.json({ error: "Please check price, shop name, and scene" }, { status: 400 });

    const input = new Uint8Array(await image.arrayBuffer());
    const product = await removeBackground(input, image.type);
    const caption = await generateCaption(product, parsed.data.price);
    const captionText = caption.hashtags.length ? `${caption.caption} ${caption.hashtags.join(" ")}` : caption.caption;
    const env = await bindings();
    const id = !env.DB && env.DEMO_MODE === "true" ? "demo-live" : crypto.randomUUID();
    const imageUrl = await putAsset(`${id}/product.png`, product, "image/png");
    const voice = await generateVoice(captionText);
    const audioUrl = voice ? await putAsset(`${id}/voice.mp3`, voice.bytes, voice.mimeType) : null;
    const reel = await createReel({
      id,
      caption: captionText,
      productName: caption.productName,
      price: parsed.data.price,
      shopName: parsed.data.shopName,
      sceneId: parsed.data.sceneId,
      imageUrl,
      audioUrl,
    });

    return Response.json({
      reel,
      uploadToken: btoa(id),
      share: `/r/${id}`,
      capabilities: { canRecordVideo: typeof MediaRecorder !== "undefined", canUseTts: Boolean(audioUrl) },
    });
  } catch (error) {
    console.error("process failed", error instanceof Error ? error.message : "unknown error");
    return Response.json({ error: "Reel nahi ban paayi. Dobara try karo." }, { status: 502 });
  }
}
