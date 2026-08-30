import { describe, expect, it } from "vitest";
import {
  buildWhatsAppUrl,
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
});

it("encodes Hindi WhatsApp share text", () => {
  const url = buildWhatsAppUrl("Ye kurti fresh hai", "/r/abc123", "799");
  expect(url).toContain("wa.me/?text=");
  expect(decodeURIComponent(url.split("?text=")[1])).toContain("₹799");
});
