import { z } from "zod";
import { garmentCategories, type GarmentCategory } from "./model-templates";

export const sceneIds = ["white", "boutique", "street"] as const;
export type SceneId = (typeof sceneIds)[number];
export { garmentCategories };
export type { GarmentCategory };

export const supportedImageTypes = ["image/jpeg", "image/png", "image/webp"] as const;

export function isSupportedImageType(mimeType: string): boolean {
  return supportedImageTypes.includes(mimeType as (typeof supportedImageTypes)[number]);
}

export const processInputSchema = z.object({
  price: z
    .union([z.string(), z.number()])
    .optional()
    .transform((value) => (value === undefined || value === "" ? null : Number(value)))
    .refine((value) => value === null || Number.isInteger(value), "Price must be an integer")
    .refine((value) => value === null || (value >= 0 && value <= 10_000_000), "Price is out of range"),
  shopName: z.string().trim().max(60).optional().default("Apni Dukaan"),
  sceneId: z.enum(sceneIds).default("white"),
  garmentCategory: z.enum(garmentCategories).default("shirt"),
});

export type CaptionResult = {
  productName: string;
  caption: string;
  hashtags: string[];
};

export function normalizeCaption(input: CaptionResult, price: number | null): CaptionResult {
  const productName = typeof input.productName === "string" ? input.productName : "product";
  const caption = typeof input.caption === "string" ? input.caption : "Ye product fresh hai — DM karo 💛";
  const inputHashtags = Array.isArray(input.hashtags) ? input.hashtags : [];
  const safeCaption = caption.trim().replace(/\s+/g, " ");
  const withoutPrice = safeCaption.replace(/₹\s?[\d,]+/g, "").replace(/\s{2,}/g, " ").trim();
  const pricedCaption = price === null ? withoutPrice : `${withoutPrice} — ₹${price.toLocaleString("en-IN")} only!`;
  const hashtags = inputHashtags
    .filter((tag): tag is string => typeof tag === "string")
    .map((tag) => tag.trim().replace(/^#?/, "#").replace(/[^#\w\u0900-\u097F]/g, ""))
    .filter((tag) => tag.length > 1)
    .slice(0, 3);

  return {
    productName: productName.trim().slice(0, 80) || "product",
    caption: pricedCaption.slice(0, 180),
    hashtags,
  };
}

export function buildWhatsAppUrl(caption: string, sharePath: string, price: string | number | null): string {
  const priceText = price === null || price === "" ? "" : ` ₹${price}`;
  const text = `${caption}${priceText}\nDekho: ${sharePath}`;
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}

export function fallbackCaption(price: number | null): CaptionResult {
  const caption = price === null ? "Ye product fresh hai — DM karo 💛" : `Ye product fresh hai — ₹${price.toLocaleString("en-IN")} only! DM karo 💛`;
  return { productName: "product", caption, hashtags: ["#newarrival", "#dukaanstyle", "#shoplocal"] };
}

export function buildVoiceText(productName: string, price: number | null, shopName: string): string {
  const product = productName.trim().replace(/[#₹]/g, "").replace(/\s+/g, " ").slice(0, 60) || "naya product";
  const shop = shopName.trim().replace(/[#₹]/g, "").replace(/\s+/g, " ").slice(0, 60) || "Apni Dukaan";
  const offer = price === null ? "ab available hai" : `sirf ${price.toLocaleString("en-IN")} rupaye mein`;
  return `${shop} par ${product}, ${offer}. Abhi WhatsApp par message karke order karein.`;
}
