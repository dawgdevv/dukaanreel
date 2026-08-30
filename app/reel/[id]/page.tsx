"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Volume2, VolumeX, Pencil, Download, Share2, Play, Check, Heart } from "lucide-react";
import { MOCK_REELS, MOCK_CAPTION, SCENES } from "@/lib/mock";

export default function ReelPreviewPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const reel = MOCK_REELS.find((r) => r.id === id) ?? MOCK_REELS[0];

  const [scene, setScene] = useState<(typeof SCENES)[number]["id"]>("white");
  const [muted, setMuted] = useState(false);
  const [caption, setCaption] = useState(MOCK_CAPTION);
  const [editing, setEditing] = useState(false);
  const [price, setPrice] = useState(reel.price);
  const [shop, setShop] = useState("Apni Dukaan");
  const [isPlaying, setIsPlaying] = useState(true);

  useEffect(() => {
    const p = sessionStorage.getItem("dukaanreel-price");
    const s = sessionStorage.getItem("dukaanreel-shop");
    if (p) setPrice(`₹${p}`);
    if (s) setShop(s);
  }, []);

  const activeScene = SCENES.find((s) => s.id === scene)!;
  const shareUrl = typeof window !== "undefined" ? `${window.location.origin}/r/${id}` : `/r/${id}`;
  const waText = encodeURIComponent(`${caption} ${price}\nDekho: ${shareUrl}`);
  const waHref = `https://wa.me/?text=${waText}`;

  return (
    <div className="flex flex-1 flex-col bg-white">
      <header className="flex h-14 items-center justify-between border-b border-zinc-100 bg-white px-3">
        <Link href="/" className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-100">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <span className="text-[15px] font-bold text-zinc-900">Preview</span>
        <span className="h-10 w-10" />
      </header>

      <div className="bg-zinc-900 p-3">
        <div className="relative mx-auto aspect-[9/16] w-full max-w-[360px] overflow-hidden rounded-2xl bg-black ring-1 ring-white/10">
          <div className={`absolute inset-0 ${activeScene.bg} transition-colors`} />
          <div className="absolute inset-0 opacity-[0.06]" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, black 1px, transparent 0)", backgroundSize: "20px 20px" }} />
          <div className="absolute inset-0 flex items-center justify-center p-8">
            <div className="relative w-full max-w-[260px] aspect-square overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-black/5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={reel.imageUrl} alt="product" className="h-full w-full object-cover" />
              <div className="absolute bottom-2 right-2 rounded-full bg-black/70 px-2.5 py-1 text-[10px] font-black text-white backdrop-blur">
                {shop || "Apni Dukaan"}
              </div>
            </div>
          </div>
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/60 to-transparent p-4 pt-12">
            <p className="text-[18px] font-black leading-6 text-white drop-shadow">{caption}</p>
            <p className="mt-1 inline-flex items-center gap-1.5 text-[13px] font-bold text-white/80">{price} • DM karo <Heart className="h-3.5 w-3.5 fill-white text-white" /></p>
          </div>
          <button onClick={() => setIsPlaying((v) => !v)} className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex h-11 w-11 items-center justify-center rounded-full bg-white/90 shadow-xl">
            <Play className={`h-5 w-5 fill-zinc-900 text-zinc-900 ml-0.5 ${isPlaying ? "opacity-40" : ""}`} />
          </button>
        </div>
      </div>

      <div className="flex-1 bg-white px-4 py-4">
        <div className="rounded-2xl bg-zinc-50 p-4 ring-1 ring-zinc-200">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              {editing ? (
                <textarea
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  className="w-full rounded-xl border border-zinc-300 bg-white p-3 text-[15px] font-semibold text-zinc-900 outline-none focus:border-[#16a34a] focus:ring-2 focus:ring-[#16a34a]/20"
                  rows={2}
                />
              ) : (
                <p className="text-[15px] font-semibold leading-6 text-zinc-900">{caption}</p>
              )}
            </div>
            <button onClick={() => setEditing((v) => !v)} className="flex h-8 shrink-0 items-center gap-1 rounded-full border border-zinc-200 bg-white px-3 text-xs font-semibold text-zinc-700">
              <Pencil className="h-3.5 w-3.5" /> {editing ? "Done" : "Edit"}
            </button>
          </div>

          <div className="mt-3 flex gap-2">
            <button onClick={() => setMuted((m) => !m)} className={`flex flex-1 items-center justify-center gap-1.5 rounded-full px-4 py-2.5 text-sm font-semibold ${muted ? "bg-zinc-900 text-white" : "bg-white text-zinc-900 ring-1 ring-zinc-200"}`}>
              {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4 text-[#16a34a]" />}
              {muted ? "Muted" : "Suno"}
            </button>
            <button
              onClick={() => {
                const u = new SpeechSynthesisUtterance(caption);
                u.lang = "hi-IN";
                u.rate = 0.95;
                if (muted) return;
                speechSynthesis.cancel();
                speechSynthesis.speak(u);
              }}
              className="flex items-center justify-center rounded-full bg-[#16a34a] px-5 py-2.5 text-sm font-semibold text-white"
            >
              Sunao
            </button>
          </div>
        </div>

        <div className="mt-5">
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
            {SCENES.map((s) => (
              <button
                key={s.id}
                onClick={() => setScene(s.id)}
                className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold ring-1 transition ${scene === s.id ? "bg-[#16a34a] text-white ring-[#16a34a]" : "bg-white text-zinc-700 ring-zinc-200"}`}
              >
                <span className="inline-flex items-center gap-1.5">{s.label} {scene === s.id && <Check className="h-3.5 w-3.5" strokeWidth={3} />}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="sticky bottom-0 border-t border-zinc-100 bg-white p-4">
        <a href={waHref} target="_blank" rel="noopener noreferrer" className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-[#16a34a] text-[14px] font-semibold text-white active:scale-[0.98] transition">
          <Share2 className="h-4 w-4" /> WhatsApp Pe Bhejo
        </a>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <a href={reel.imageUrl} download className="flex h-10 items-center justify-center gap-1.5 rounded-full bg-zinc-900 text-xs font-semibold text-white">
            <Download className="h-3.5 w-3.5" /> Download
          </a>
          <Link href={`/r/${id}`} className="flex h-10 items-center justify-center rounded-full bg-white text-xs font-semibold text-zinc-900 ring-1 ring-zinc-200">
            Public link
          </Link>
        </div>
      </div>
    </div>
  );
}
