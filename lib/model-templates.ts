export const garmentCategories = ["shirt", "kurti", "dress", "saree"] as const;
export type GarmentCategory = (typeof garmentCategories)[number];

export type ModelTemplate = {
  id: string;
  gender: "male" | "female";
  category: GarmentCategory[];
  imageUrl: string;
};

const templates: ModelTemplate[] = [
  {
    id: "male-shirt-01",
    gender: "male",
    category: ["shirt"],
    imageUrl: process.env.MODEL_TEMPLATE_MALE_URL || "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=1200&q=85",
  },
  {
    id: "female-ethnic-01",
    gender: "female",
    category: ["kurti", "saree"],
    imageUrl: process.env.MODEL_TEMPLATE_FEMALE_URL || "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=1200&q=85",
  },
  {
    id: "female-dress-01",
    gender: "female",
    category: ["dress"],
    imageUrl: process.env.MODEL_TEMPLATE_FEMALE_DRESS_URL || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=1200&q=85",
  },
];

export function getModelTemplate(category: GarmentCategory): ModelTemplate {
  return templates.find((template) => template.category.includes(category)) ?? templates[0];
}
