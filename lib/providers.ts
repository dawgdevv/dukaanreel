import OpenAI from "openai";
import { fallbackCaption, normalizeCaption, type CaptionResult } from "./validation";
import { bytesToBase64 } from "./cloudflare";

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
