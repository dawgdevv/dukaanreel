import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink, Share2 } from "lucide-react";
import { getReel } from "@/lib/cloudflare";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const reel = await getReel(id);
  if (!reel) notFound();
  return {
    title: "Clothing look — 8x.dresses",
    description: "A clothing look created with 8x.dresses.",
    openGraph: {
      title: "Clothing look — 8x.dresses",
      description: "A clothing look created with 8x.dresses.",
      images: [{ url: reel.imageUrl, width: 1080, height: 1920 }],
      type: "website" as const,
    },
  };
}

export default async function PublicSharePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const reel = await getReel(id);
  if (!reel) notFound();
  const publicUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/r/${id}`;
  const waHref = `https://wa.me/?text=${encodeURIComponent(`Made with 8x.dresses.\nView: ${publicUrl}`)}`;

  return (
    <main className="flex min-h-screen flex-1 flex-col bg-white text-black">
      <header className="flex h-14 items-center justify-between bg-black px-4 text-white">
        <span className="text-sm font-semibold">8x.dresses</span>
        <span className="rounded-full border border-white/30 px-3 py-1 text-xs font-medium">Shared look</span>
      </header>

      <section className="flex flex-1 items-center bg-black p-3 pt-0">
        <div className="relative mx-auto aspect-[9/16] w-full max-w-[360px] overflow-hidden rounded-2xl bg-white ring-1 ring-white/20">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={reel.imageUrl} alt="Generated clothing look" className="h-full w-full object-contain" />
        </div>
      </section>

      <section className="border-t border-black/10 bg-white p-4">
        <p className="mb-4 text-center text-sm text-black/50">A clothing look created with 8x.dresses.</p>
        <a href={waHref} target="_blank" rel="noopener noreferrer" className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-black text-sm font-medium text-white transition active:scale-[0.98]">
          <Share2 className="h-4 w-4" /> Share on WhatsApp
        </a>
        <Link href="/" className="mt-2 flex h-11 w-full items-center justify-center gap-1.5 rounded-full bg-white text-xs font-medium text-black ring-1 ring-black/15">
          <ExternalLink className="h-3.5 w-3.5" /> Create your own
        </Link>
      </section>
    </main>
  );
}
