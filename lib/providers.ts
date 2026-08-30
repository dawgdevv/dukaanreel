import OpenAI from "openai";
import { fallbackCaption, normalizeCaption, type CaptionResult } from "./validation";
import { base64ToBytes, bytesToBase64 } from "./cloudflare";

export async function removeBackground(input: Uint8Array, mimeType: string): Promise<Uint8Array> {
  const key = process.env.REMOVE_BG_API_KEY;
  if (!key || process.env.DEMO_MODE === "true") return input;
  const form = new FormData();
  const ownedBuffer = new ArrayBuffer(input.byteLength);
  new Uint8Array(ownedBuffer).set(input);
  form.append("image_file", new Blob([ownedBuffer], { type: mimeType }), "product.jpg");
  form.append("size", "auto");
  const response = await fetch("https://api.remove.bg/v1.0/removebg", { method: "POST", headers: { "X-Api-Key": key }, body: form });
  if (!response.ok) throw new Error(`background removal failed: ${response.status}`);
  return new Uint8Array(await response.arrayBuffer());
}

export async function createStudioProductPhoto(input: Uint8Array): Promise<{ bytes: Uint8Array; studio: boolean }> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || process.env.DEMO_MODE === "true") return { bytes: input, studio: false };

  const ownedBuffer = new ArrayBuffer(input.byteLength);
  new Uint8Array(ownedBuffer).set(input);
  const form = new FormData();
  form.append("model", process.env.OPENAI_IMAGE_MODEL ?? "gpt-image-2");
  form.append("image[]", new Blob([ownedBuffer], { type: "image/png" }), "product.png");
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
    return { bytes: base64ToBytes(imageBase64), studio: true };
  } catch (error) {
    console.error("studio image fallback", error instanceof Error ? error.message : "unknown error");
    return { bytes: input, studio: false };
  }
}

export async function generateCaption(image: Uint8Array, price: number | null): Promise<CaptionResult> {
  if (!process.env.OPENAI_API_KEY || process.env.DEMO_MODE === "true") return fallbackCaption(price);
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const response = await client.responses.create({
    model: process.env.OPENAI_VISION_MODEL ?? "gpt-4o-mini",
    input: [{ role: "user", content: [
      { type: "input_text", text: "Identify this product for a Delhi clothing shop. Return JSON with productName, caption, hashtags. Use short Hinglish, include a clear CTA, never invent brand/fabric/discount/stock, and use the supplied price exactly." },
      { type: "input_text", text: `Supplied price: ${price === null ? "not provided" : `₹${price}`}` },
      { type: "input_image", image_url: `data:image/png;base64,${bytesToBase64(image)}`, detail: "auto" },
    ] }],
  });
  try {
    const parsed = JSON.parse(response.output_text) as CaptionResult;
    return normalizeCaption(parsed, price);
  } catch {
    return fallbackCaption(price);
  }
}

export async function generateVoice(text: string): Promise<{ bytes: Uint8Array; mimeType: string } | null> {
  const key = process.env.ELEVENLABS_API_KEY;
  const voiceId = process.env.ELEVENLABS_VOICE_ID;
  if (!key || !voiceId || process.env.DEMO_MODE === "true") return null;
  const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
    method: "POST",
    headers: { "xi-api-key": key, "Content-Type": "application/json", Accept: "audio/mpeg" },
    body: JSON.stringify({ text, model_id: "eleven_multilingual_v2", output_format: "mp3_44100_128" }),
  });
  if (!response.ok) throw new Error(`voice generation failed: ${response.status}`);
  return { bytes: new Uint8Array(await response.arrayBuffer()), mimeType: "audio/mpeg" };
}
