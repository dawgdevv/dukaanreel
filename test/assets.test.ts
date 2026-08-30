import { describe, expect, it } from "vitest";
import { assetPath, normalizeAssetUrl } from "@/lib/cloudflare-url";

describe("same-origin asset paths", () => {
  it("encodes each R2 key segment without exposing the bucket endpoint", () => {
    expect(assetPath("abc123/product image.png")).toBe("/api/assets/abc123/product%20image.png");
  });

  it("converts legacy R2 URLs to the same-origin asset route", () => {
    expect(normalizeAssetUrl("https://account.r2.cloudflarestorage.com/bucket/abc/product.png", "https://account.r2.cloudflarestorage.com/bucket"))
      .toBe("/api/assets/abc/product.png");
  });
});
