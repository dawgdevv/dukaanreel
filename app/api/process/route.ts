import { createReel, putAsset, putOriginalAsset } from "@/lib/cloudflare";
import { createStudioProductPhoto, createTryOnPhoto, generateCaption, generateVoice, removeBackground } from "@/lib/providers";
import { buildVoiceText, isSupportedImageType, processInputSchema } from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const image = form.get("image");
    if (!(image instanceof File)) return Response.json({ error: "Image is required" }, { status: 400 });
    if (!isSupportedImageType(image.type)) return Response.json({ error: "Use a JPEG, PNG, or WebP image" }, { status: 400 });
    if (image.size > 8 * 1024 * 1024) return Response.json({ error: "Image is too large" }, { status: 413 });

    const parsed = processInputSchema.safeParse({
      price: form.get("price")?.toString() ?? "",
      shopName: form.get("shopName")?.toString() ?? "Apni Dukaan",
      sceneId: form.get("sceneId")?.toString() ?? "white",
      garmentCategory: form.get("garmentCategory")?.toString() ?? "shirt",
    });
    if (!parsed.success) return Response.json({ error: "Please check price, shop name, and scene" }, { status: 400 });

    const id = crypto.randomUUID();
    const input = new Uint8Array(await image.arrayBuffer());
    const originalExtension = image.type === "image/png" ? "png" : image.type === "image/webp" ? "webp" : "jpg";
    const originalUpload = putOriginalAsset(`${id}/original.${originalExtension}`, input, image.type);
    const productCutout = await removeBackground(input, image.type);
    const tryOnResult = await createTryOnPhoto(productCutout, parsed.data.garmentCategory);
    const studioResult = tryOnResult.tryOn ? tryOnResult : await createStudioProductPhoto(productCutout);
    const product = studioResult.bytes;
    const productExtension = studioResult.mimeType === "image/jpeg" ? "jpg" : studioResult.mimeType.split("/")[1] ?? "png";
    const captionPromise = generateCaption(product, parsed.data.price);
    const finalUpload = putAsset(`${id}/product.${productExtension}`, product, studioResult.mimeType);
    const [caption, , imageUrl] = await Promise.all([captionPromise, originalUpload, finalUpload]);
    const captionText = caption.hashtags.length ? `${caption.caption} ${caption.hashtags.join(" ")}` : caption.caption;
    const voiceText = buildVoiceText(caption.productName, parsed.data.price, parsed.data.shopName);
    let audioUrl: string | null = null;
    try {
      const voice = await generateVoice(voiceText);
      if (voice) audioUrl = await putAsset(`${id}/voice.mp3`, voice.bytes, voice.mimeType);
    } catch (error) {
      console.error("voice generation fallback", error instanceof Error ? error.message : "unknown error");
    }
    const reel = await createReel({
      id,
      caption: captionText,
      productName: caption.productName,
      price: parsed.data.price,
      shopName: parsed.data.shopName,
      sceneId: parsed.data.sceneId,
      imageUrl,
      audioUrl,
      voiceText,
      garmentCategory: parsed.data.garmentCategory,
      modelTemplateId: tryOnResult.templateId,
    });

    return Response.json({
      reel,
      uploadToken: btoa(id),
      share: `/r/${id}`,
      capabilities: {
        canRecordVideo: typeof MediaRecorder !== "undefined",
        canUseTts: Boolean(audioUrl),
        voiceStatus: audioUrl ? "ready" : "unavailable",
        studioPhoto: "studio" in studioResult ? studioResult.studio : false,
        tryOnPhoto: tryOnResult.tryOn,
        modelTemplateId: tryOnResult.templateId,
      },
    });
  } catch (error) {
    console.error("process failed", error instanceof Error ? error.message : "unknown error");
    return Response.json({ error: "Reel nahi ban paayi. Dobara try karo." }, { status: 502 });
  }
}
