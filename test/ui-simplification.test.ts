import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

describe("simplified clothing maker interface", () => {
  it("presents the home page as a playful transformation lab", () => {
    const source = read("app/page.tsx");

    expect(source).toContain("Make something weird");
    expect(source).toContain("Put anything on anything.");
    expect(source).toContain("A can. A logo. A random idea.");
    expect(source).not.toContain("polished product image");
    expect(source).not.toContain("AI studio");
    expect(source).not.toContain("Photo Kheecho");
  });

  it("keeps the homepage curated and moves R2 generations behind Show more", () => {
    const home = read("app/page.tsx");

    expect(home).not.toContain("listReels");
    expect(home).not.toContain("reel.imageUrl");
    expect(home).toContain('href="/creations"');
    expect(home).toContain("Show more");

    const creationsPath = new URL("../app/creations/page.tsx", import.meta.url);
    expect(existsSync(creationsPath)).toBe(true);
    const creations = read("app/creations/page.tsx");
    expect(creations).toContain('import { listReels } from "@/lib/cloudflare"');
    expect(creations).toContain("await listReels()");
    expect(creations).toContain("reel.imageUrl");
    expect(creations).toContain("href={`/r/${reel.id}`}");
  });

  it("showcases the five supplied experiments in an accessible gallery", () => {
    const source = read("app/page.tsx");

    expect(source).toContain('import Image from "next/image"');
    expect(source).toContain('aria-label="Weird transformation gallery"');
    for (const label of ["Can → tee", "Label → saree", "Midnight mode", "Logo remix", "Soft chaos"]) {
      expect(source).toContain(`label: "${label}"`);
    }
    expect(source.match(/\/experiments\//g)).toHaveLength(5);
  });

  it("uses experimental product messaging in page metadata", () => {
    const source = read("app/layout.tsx");

    expect(source).toContain("8x.dresses — Make Something Weird");
    expect(source).toContain("Turn a can, logo, doodle, or any random idea into something wearable.");
    expect(source).not.toContain("AI Clothing Maker");
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
