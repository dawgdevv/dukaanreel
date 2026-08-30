"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Download, Share2 } from "lucide-react";

type PreviewReel = {
  id: string;
  imageUrl: string;
};

export default function ReelPreviewPage() {
  const { id } = useParams<{ id: string }>();
  const [reel, setReel] = useState<PreviewReel | null>(null);

  useEffect(() => {
    let hasCachedReel = false;
    try {
      const cached = JSON.parse(sessionStorage.getItem("dukaanreel-current") ?? "null") as PreviewReel | null;
      if (cached?.id === id) {
        hasCachedReel = true;
        queueMicrotask(() => setReel(cached));
      }
    } catch {
      sessionStorage.removeItem("dukaanreel-current");
    }

    fetch(`/api/reels/${id}`)
      .then((response) => (response.ok ? response.json() : Promise.reject(new Error("Image not found"))))
      .then(({ reel: data }) => setReel(data))
      .catch(() => {
        if (!hasCachedReel) setReel(null);
      });
  }, [id]);

  if (!reel) {
    return <div className="grid min-h-screen place-items-center bg-white p-6 text-center text-sm font-medium text-black/50">Loading your image…</div>;
  }

  const shareUrl = typeof window !== "undefined" ? `${window.location.origin}/r/${id}` : `/r/${id}`;
  const waHref = `https://wa.me/?text=${encodeURIComponent(`Made with 8x.dresses.\nView: ${shareUrl}`)}`;

  return (
    <main className="flex min-h-screen flex-1 flex-col bg-white text-black">
      <header className="flex h-14 items-center justify-between border-b border-black/10 px-3">
        <Link href="/" className="flex h-10 w-10 items-center justify-center rounded-full bg-white ring-1 ring-black/10" aria-label="Back to home">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <span className="text-sm font-semibold">Your look is ready</span>
        <span className="h-10 w-10" aria-hidden="true" />
      </header>

      <section className="flex flex-1 items-center bg-black p-3">
        <div className="relative mx-auto aspect-[9/16] w-full max-w-[360px] overflow-hidden rounded-2xl bg-white ring-1 ring-white/20">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={reel.imageUrl} alt="Generated clothing look" className="h-full w-full object-contain" />
        </div>
      </section>

      <section className="border-t border-black/10 bg-white p-4">
        <p className="mb-4 text-center text-sm text-black/50">Download your image or share it.</p>
        <a href={waHref} target="_blank" rel="noopener noreferrer" className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-black text-sm font-medium text-white transition active:scale-[0.98]">
          <Share2 className="h-4 w-4" /> Share on WhatsApp
        </a>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <a href={reel.imageUrl} download className="flex h-11 items-center justify-center gap-1.5 rounded-full bg-white text-xs font-medium text-black ring-1 ring-black/15">
            <Download className="h-3.5 w-3.5" /> Download
          </a>
          <Link href={`/r/${id}`} className="flex h-11 items-center justify-center rounded-full bg-white text-xs font-medium text-black ring-1 ring-black/15">
            Public link
          </Link>
        </div>
      </section>
    </main>
  );
}
