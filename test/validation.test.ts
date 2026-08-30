import { describe, expect, it } from "vitest";
import {
  buildWhatsAppUrl,
  buildVoiceText,
  isSupportedImageType,
  normalizeCaption,
  processInputSchema,
} from "@/lib/validation";

describe("process input", () => {
  it("accepts a bounded anonymous reel request", () => {
    const result = processInputSchema.safeParse({
      price: "799",
      shopName: "Lajpat Boutique",
      sceneId: "white",
    });

    expect(result.success).toBe(true);
    if (result.success) expect(result.data.price).toBe(799);
  });

  it("rejects an invalid scene", () => {
    expect(
      processInputSchema.safeParse({ sceneId: "neon", price: "799" }).success,
    ).toBe(false);
  });
});

describe("photo upload", () => {
  it("accepts supported product photo formats", () => {
    expect(isSupportedImageType("image/jpeg")).toBe(true);
    expect(isSupportedImageType("image/png")).toBe(true);
    expect(isSupportedImageType("image/webp")).toBe(true);
  });

  it("rejects unsupported image payloads", () => {
    expect(isSupportedImageType("image/svg+xml")).toBe(false);
    expect(isSupportedImageType("text/plain")).toBe(false);
  });
});

describe("caption normalization", () => {
  it("preserves the supplied price and limits hashtags", () => {
    const result = normalizeCaption(
      {
        productName: "red kurti",
        caption: "Fresh red kurti — ₹0 only!",
        hashtags: ["#one", "#two", "#three", "#four"],
      },
      799,
    );

    expect(result.caption).toContain("₹799");
    expect(result.hashtags).toHaveLength(3);
  });

  it("handles malformed model hashtags without failing the pipeline", () => {
    const result = normalizeCaption(
      { productName: "kurti", caption: "Fresh kurti", hashtags: "#fresh" as unknown as string[] },
      799,
    );
    expect(result.hashtags).toEqual([]);
    expect(result.caption).toContain("₹799");
  });
});

it("encodes Hindi WhatsApp share text", () => {
  const url = buildWhatsAppUrl("Ye kurti fresh hai", "/r/abc123", "799");
  expect(url).toContain("wa.me/?text=");
  expect(decodeURIComponent(url.split("?text=")[1])).toContain("₹799");
});

describe("voice script", () => {
  it("uses the identified product, shop, and exact supplied price", () => {
    const text = buildVoiceText("red kurti", 799, "Lajpat Boutique");
    expect(text).toContain("Lajpat Boutique");
    expect(text).toContain("red kurti");
    expect(text).toContain("799 rupaye");
    expect(text).toContain("WhatsApp");
  });

  it("does not invent a price when none was supplied", () => {
    expect(buildVoiceText("saree", null, "Apni Dukaan")).not.toContain("rupaye");
  });
});
