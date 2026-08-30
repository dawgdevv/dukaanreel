export type MockReel = {
  id: string;
  imageUrl: string;
  videoUrl: string;
  audioUrl: string;
  caption: string;
  price: string;
  shopName?: string;
};

export const MOCK_CAPTION = "Ye red kurti fresh hai — ₹799 only! DM karo";
export const MOCK_AUDIO = "#";
export const MOCK_VIDEO = "#";

export const MOCK_IMAGE =
  "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=600&auto=format&fit=crop&q=60";

export const MOCK_REELS: MockReel[] = Array.from({ length: 9 }).map((_, i) => ({
  id: `demo-${i + 1}`,
  imageUrl: `https://images.unsplash.com/photo-${[
    "1610030469983-98e550d6193c",
    "1581044777550-4cfa60707c03",
    "1594633312681-425c7b97ccd1",
    "1485968579580-b6d04b9e8478",
    "1525507119028-edfd473eda6a",
    "1573496359142-b8d87734a5a2",
  ][i % 6]}?w=400&auto=format&fit=crop&q=60`,
  videoUrl: "#",
  audioUrl: "#",
  caption: MOCK_CAPTION,
  price: "₹799",
  shopName: "Apni Dukaan",
}));

export const SCENES = [
  { id: "white", label: "White Studio", bg: "bg-zinc-100" },
  { id: "boutique", label: "Boutique", bg: "bg-orange-50" },
  { id: "street", label: "Street", bg: "bg-stone-100" },
] as const;
