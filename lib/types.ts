import type { SceneId } from "./validation";

export type ReelStatus = "processing" | "ready" | "failed";

export type Reel = {
  id: string;
  caption: string;
  productName: string | null;
  price: number | null;
  shopName: string;
  sceneId: SceneId;
  imageUrl: string;
  audioUrl: string | null;
  videoUrl: string | null;
  status: ReelStatus;
  createdAt: string;
  garmentCategory?: "shirt" | "kurti" | "dress" | "saree";
  modelTemplateId?: string | null;
};

export type CreateReelInput = Omit<Reel, "createdAt" | "videoUrl" | "status"> & {
  videoUrl?: string | null;
  status?: ReelStatus;
};
