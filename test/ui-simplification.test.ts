import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

describe("simplified clothing maker interface", () => {
  it("uses a focused English camera call to action on the home page", () => {
    const source = read("app/page.tsx");

    expect(source).toContain("Open camera");
    expect(source).toContain("T-shirt, shirt, saree, or top");
    expect(source).not.toContain("Photo Kheecho");
    expect(source).not.toContain("Recent");
    expect(source).not.toContain("listReels");
  });

  it("keeps only the four requested clothing choices on capture", () => {
    const source = read("app/capture/page.tsx");

    for (const label of ["T-shirt", "Shirt", "Saree", "Top"]) {
      expect(source).toContain(`label: "${label}"`);
    }
    expect(source).not.toContain("Women&apos;s kurti");
    expect(source).not.toContain("Women&apos;s dress");
    expect(source).not.toContain("placeholder=\"799\"");
    expect(source).not.toContain("placeholder=\"Dukaan naam\"");
  });

  it("applies Inter and negative two-percent tracking globally", () => {
    const layout = read("app/layout.tsx");
    const styles = read("app/globals.css");

    expect(layout).toContain('import { Inter } from "next/font/google"');
    expect(layout).toContain('<html lang="en"');
    expect(styles).toContain("letter-spacing: -0.02em");
  });

  it("does not expose scene filters in the result interface", () => {
    const source = read("app/reel/[id]/page.tsx");

    expect(source).not.toContain("SCENES.map");
    expect(source).not.toContain("setScene");
  });

  it("presents the result as a clothing image without legacy reel controls", () => {
    const source = read("app/reel/[id]/page.tsx");

    expect(source).toContain("Your look is ready");
    expect(source).not.toContain("renderReelVideo");
    expect(source).not.toContain("Play voice");
    expect(source).not.toContain("Create 10-second video");
  });
});
