import Link from "next/link";
import { notFound } from "next/navigation";
import { Share2, ExternalLink, MapPin, Star, Heart } from "lucide-react";
import { getReel } from "@/lib/cloudflare";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const reel = await getReel(id);
  if (!reel) notFound();
  return {
    title: `${reel.caption} DukaanReel`,
    description: `${reel.caption} • WhatsApp pe bhejo`,
    openGraph: {
      title: reel.caption,
      description: `Dekho ye reel ${reel.price ? `₹${reel.price}` : "abhi"} only!`,
      images: [{ url: reel.imageUrl, width: 1080, height: 1920 }],
      type: "video.other" as const,
    },
  };
}

export default async function PublicSharePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const reel = await getReel(id);
  if (!reel) notFound();
  const caption = reel.caption;
  const shopName = reel.shopName;
  const price = reel.price === null ? "" : `₹${reel.price.toLocaleString("en-IN")}`;
  const waText = encodeURIComponent(`${caption}\nDekho: ${process.env.NEXT_PUBLIC_APP_URL ?? ""}/r/${id}`);
  const waHref = `https://wa.me/?text=${waText}`;

  return (
    <div className="flex flex-1 flex-col bg-white">
      <header className="flex h-12 items-center justify-between bg-[#16a34a] px-4 text-white">
        <span className="text-[15px] font-black">DukaanReel</span>
        <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-bold">Public Share</span>
      </header>

      <div className="bg-black p-3">
        <div className="relative mx-auto aspect-[9/16] w-full max-w-[360px] overflow-hidden rounded-2xl bg-zinc-900">
          <div className="absolute inset-0 bg-zinc-100" />
          <div className="absolute inset-0">
            {reel.videoUrl && <video src={reel.videoUrl} className="absolute inset-0 z-10 h-full w-full object-cover" controls loop playsInline />}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={reel.imageUrl} alt="Studio product" className="h-full w-full object-contain" />
          </div>
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/50 to-transparent p-4 pt-10">
            <p className="text-[18px] font-black leading-6 text-white">{caption}</p>
            <p className="mt-1 flex items-center gap-2 text-sm font-bold text-white/90">
              <span className="rounded-full bg-[#16a34a] px-2.5 py-0.5 text-white">{price}</span>
              <span className="inline-flex items-center gap-1">DM karo <Heart className="h-3.5 w-3.5 fill-white text-white" /></span>
            </p>
          </div>
          <div className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1.5 text-xs font-black text-zinc-900 shadow">
            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" /> Apni Dukaan
          </div>
        </div>
      </div>

      <div className="flex-1 bg-white px-4 py-5">
        <h1 className="text-[16px] font-semibold leading-6 text-zinc-900">{caption}</h1>
          <p className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-zinc-500">
          <MapPin className="h-3.5 w-3.5 text-zinc-400" /> {shopName}
        </p>

        <div className="mt-3 flex items-center gap-2 rounded-2xl bg-green-50 p-3 ring-1 ring-green-200">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#16a34a] text-white text-sm font-bold">₹</div>
          <div>
            <p className="text-sm font-semibold text-zinc-900">{price} only</p>
          </div>
        </div>

        <p className="mt-4 text-xs font-medium text-zinc-500">Cash on delivery • Apni gali, apni dukaan</p>
      </div>

      <div className="sticky bottom-0 border-t border-zinc-100 bg-white p-4">
        <a href={waHref} target="_blank" rel="noopener noreferrer" className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-[#16a34a] text-[14px] font-semibold text-white active:scale-[0.98] transition">
          <Share2 className="h-4 w-4" /> WhatsApp Pe Bhejo
        </a>
        <Link href="/" className="mt-2 flex h-10 w-full items-center justify-center gap-1.5 rounded-full bg-zinc-900 text-xs font-semibold text-white">
          <ExternalLink className="h-3.5 w-3.5" /> DukaanReel banao
        </Link>
      </div>
    </div>
  );
}
