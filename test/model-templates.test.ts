import { describe, expect, it } from "vitest";
import { getModelTemplate, garmentCategories } from "@/lib/model-templates";

describe("model template selection", () => {
  it("selects a male template for shirts", () => {
    expect(getModelTemplate("shirt").gender).toBe("male");
  });

  it("selects a female ethnic template for sarees", () => {
    const template = getModelTemplate("saree");
    expect(template.gender).toBe("female");
    expect(template.category).toContain("saree");
  });

  it("exposes only supported garment categories", () => {
    expect(garmentCategories).toEqual(["shirt", "kurti", "dress", "saree"]);
  });
});
