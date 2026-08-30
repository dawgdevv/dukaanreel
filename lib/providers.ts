import OpenAI from "openai";
import { fallbackCaption, normalizeCaption, type CaptionResult } from "./validation";
import { base64ToBytes, bytesToBase64 } from "./cloudflare";
import { getModelTemplate, type GarmentCategory } from "./model-templates";

type PhotoAsset = { bytes: Uint8Array; mimeType: string };

export async function createTryOnPhoto(
  garment: PhotoAsset,
  category: GarmentCategory,
): Promise<PhotoAsset & { tryOn: boolean; templateId: string | null }> {
  const apiKey = process.env.OPENAI_API_KEY;
  const template = getModelTemplate(category);
  if (!apiKey || process.env.DEMO_MODE === "true") {
    return { ...garment, tryOn: false, templateId: null };
  }

  try {
    const modelResponse = await fetch(template.imageUrl);
    if (!modelResponse.ok) throw new Error(`model template failed: ${modelResponse.status}`);
    const modelBytes = new Uint8Array(await modelResponse.arrayBuffer());
    const modelMimeType = modelResponse.headers.get("content-type")?.split(";")[0] || "image/jpeg";
    const form = new FormData();
    const modelBuffer = new ArrayBuffer(modelBytes.byteLength);
    new Uint8Array(modelBuffer).set(modelBytes);
    const garmentBuffer = new ArrayBuffer(garment.bytes.byteLength);
    new Uint8Array(garmentBuffer).set(garment.bytes);
    form.append("model", process.env.OPENAI_IMAGE_MODEL ?? "gpt-image-2");
    form.append("image[]", new Blob([modelBuffer], { type: modelMimeType }), "model.jpg");
    form.append("image[]", new Blob([garmentBuffer], { type: garment.mimeType }), "garment.png");
    form.append(
      "prompt",
      [
        "Create a realistic ecommerce fashion photo using the first image as the exact person and the second image as the exact garment.",
        `The garment category is ${category}. Put the garment naturally on the person while preserving its exact color, print, embroidery, logo, text, fabric texture, cut, and proportions.`,
        category === "saree" ? "Dress the female model in the complete saree look with accurate blouse, pleats, waist drape, and pallu; do not omit the saree." : "Keep the person’s face, hair, skin tone, body proportions, pose, and neutral expression unchanged.",
        "Use a clean warm-white studio background, soft commercial lighting, full garment visibility, and no extra clothing, props, text, or watermark.",
      ].join(" "),
    );
    form.append("size", "1024x1536");
    form.append("quality", "high");
    form.append("output_format", "png");

    const response = await fetch("https://api.openai.com/v1/images/edits", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}` },
      body: form,
    });
    if (!response.ok) throw new Error(`try-on image generation failed: ${response.status}`);
    const result = await response.json() as { data?: Array<{ b64_json?: string }> };
    const imageBase64 = result.data?.[0]?.b64_json;
    if (!imageBase64) throw new Error("try-on image generation returned no image");
    return { bytes: base64ToBytes(imageBase64), mimeType: "image/png", tryOn: true, templateId: template.id };
  } catch (error) {
    console.error("try-on fallback", error instanceof Error ? error.message : "unknown error");
    return { ...garment, tryOn: false, templateId: null };
  }
}

export async function removeBackground(input: Uint8Array, mimeType: string): Promise<PhotoAsset> {
  const key = process.env.REMOVE_BG_API_KEY;
  if (!key || process.env.DEMO_MODE === "true") return { bytes: input, mimeType };
  try {
    const form = new FormData();
    const ownedBuffer = new ArrayBuffer(input.byteLength);
    new Uint8Array(ownedBuffer).set(input);
    form.append("image_file", new Blob([ownedBuffer], { type: mimeType }), "product.jpg");
    form.append("size", "auto");
    const response = await fetch("https://api.remove.bg/v1.0/removebg", { method: "POST", headers: { "X-Api-Key": key }, body: form });
    if (!response.ok) throw new Error(`background removal failed: ${response.status}`);
    return { bytes: new Uint8Array(await response.arrayBuffer()), mimeType: "image/png" };
  } catch (error) {
    console.error("background removal fallback", error instanceof Error ? error.message : "unknown error");
    return { bytes: input, mimeType };
  }
}

export async function createStudioProductPhoto(input: PhotoAsset): Promise<PhotoAsset & { studio: boolean }> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || process.env.DEMO_MODE === "true") return { ...input, studio: false };

  const ownedBuffer = new ArrayBuffer(input.bytes.byteLength);
  new Uint8Array(ownedBuffer).set(input.bytes);
  const form = new FormData();
  form.append("model", process.env.OPENAI_IMAGE_MODEL ?? "gpt-image-2");
  const inputExtension = input.mimeType === "image/jpeg" ? "jpg" : input.mimeType.split("/")[1] ?? "png";
  form.append("image[]", new Blob([ownedBuffer], { type: input.mimeType }), `product.${inputExtension}`);
  form.append(
    "prompt",
    [
      "Create a premium ecommerce studio photograph using the supplied product as the only subject.",
      "Preserve the exact product identity, shape, proportions, colors, material texture, patterns, logos, labels, and visible text.",
      "Do not redesign, beautify, add, remove, or replace any part of the product.",
      "Place it centered and fully visible on a seamless warm-white studio background with soft diffused commercial lighting, realistic contact shadow, crisp edges, and balanced contrast.",
      "No people, hands, hangers, props, decorations, badges, captions, or extra text.",
      "The result must look like a clean professional catalogue photograph in a 9:16 portrait composition.",
    ].join(" ")
  );
  form.append("size", "1152x2048");
  form.append("quality", "high");
  form.append("output_format", "png");

  try {
    const response = await fetch("https://api.openai.com/v1/images/edits", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}` },
      body: form,
    });
    if (!response.ok) {
      const requestId = response.headers.get("x-request-id");
      throw new Error(`studio image generation failed: ${response.status}${requestId ? ` (${requestId})` : ""}`);
    }

    const result = await response.json() as { data?: Array<{ b64_json?: string }> };
    const imageBase64 = result.data?.[0]?.b64_json;
    if (!imageBase64) throw new Error("studio image generation returned no image");
    return { bytes: base64ToBytes(imageBase64), mimeType: "image/png", studio: true };
  } catch (error) {
    console.error("studio image fallback", error instanceof Error ? error.message : "unknown error");
    return { ...input, studio: false };
  }
}

export async function generateCaption(image: Uint8Array, price: number | null): Promise<CaptionResult> {
  if (!process.env.OPENAI_API_KEY || process.env.DEMO_MODE === "true") return fallbackCaption(price);
  try {
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const response = await client.responses.create({
      model: process.env.OPENAI_VISION_MODEL ?? "gpt-4o-mini",
      input: [{ role: "user", content: [
        { type: "input_text", text: "Identify this product for a Delhi clothing shop. Return JSON with productName, caption, hashtags. Use short Hinglish, include a clear CTA, never invent brand/fabric/discount/stock, and use the supplied price exactly." },
        { type: "input_text", text: `Supplied price: ${price === null ? "not provided" : `₹${price}`}` },
        { type: "input_image", image_url: `data:image/png;base64,${bytesToBase64(image)}`, detail: "auto" },
      ] }],
    });
    const json = response.output_text.trim()
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/, "");
    const parsed = JSON.parse(json) as CaptionResult;
    return normalizeCaption(parsed, price);
  } catch (error) {
    console.error("caption fallback", error instanceof Error ? error.message : "unknown error");
    return fallbackCaption(price);
  }
}

export async function generateVoice(text: string): Promise<{ bytes: Uint8Array; mimeType: string } | null> {
  const key = process.env.ELEVENLABS_API_KEY;
  const voiceId = process.env.ELEVENLABS_VOICE_ID;
  if (!key || !voiceId || process.env.DEMO_MODE === "true") return null;
  const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voiceId)}?output_format=mp3_44100_128`, {
    method: "POST",
    headers: { "xi-api-key": key, "Content-Type": "application/json", Accept: "audio/mpeg" },
    body: JSON.stringify({
      text,
      model_id: process.env.ELEVENLABS_MODEL_ID ?? "eleven_multilingual_v2",
      voice_settings: {
        stability: 0.55,
        similarity_boost: 0.75,
        style: 0.2,
        use_speaker_boost: true,
        speed: 1.02,
      },
    }),
  });
  if (!response.ok) {
    const requestId = response.headers.get("request-id");
    throw new Error(`voice generation failed: ${response.status}${requestId ? ` (${requestId})` : ""}`);
  }
  return { bytes: new Uint8Array(await response.arrayBuffer()), mimeType: "audio/mpeg" };
}
