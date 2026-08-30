import Link from "next/link";
import { Camera, Play } from "lucide-react";
import { MOCK_REELS } from "@/lib/mock";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col bg-white">
      <header className="sticky top-0 z-10 flex h-14 items-center justify-between border-b border-zinc-100 bg-white px-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#16a34a] text-white font-black text-[14px]">
            D
          </div>
          <span className="text-[18px] font-extrabold tracking-tight text-zinc-900">
            DukaanReel
          </span>
        </div>
        <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-bold text-zinc-600">
          PWA
        </span>
      </header>

      <section className="px-4 pt-6 pb-4">
        <h1 className="text-[28px] font-black leading-[1.1] tracking-tight text-zinc-900">
          DukaanReel<br />
          <span className="text-[#16a34a]">Photo Kheecho,</span>
          <br />
          Reel Banao
        </h1>
        <p className="mt-3 text-[16px] font-medium leading-6 text-zinc-500">
          1 photo saf background Hinglish caption 9:16 reel WhatsApp pe bhejo.
          Bas 10 second!
        </p>
      </section>

      <section className="flex-1 bg-zinc-50 px-4 py-5 pb-24">
        <div className="flex items-center justify-between">
          <h2 className="text-[16px] font-bold text-zinc-900">Recent</h2>
          <span className="text-xs font-semibold text-zinc-400">{MOCK_REELS.length}</span>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-3">
          {MOCK_REELS.map((r) => (
            <Link
              key={r.id}
              href={`/reel/${r.id}`}
              className="group relative overflow-hidden rounded-2xl bg-white ring-1 ring-zinc-200"
            >
              <div className="aspect-[9/16] relative bg-zinc-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={r.imageUrl} alt="kurti" className="h-full w-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-transparent" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/90 shadow">
                    <Play className="h-4 w-4 fill-zinc-900 text-zinc-900 ml-0.5" />
                  </div>
                </div>
                <div className="absolute bottom-1.5 left-1.5 rounded-full bg-[#16a34a] px-2 py-0.5 text-[11px] font-black text-white">
                  {r.price}
                </div>
              </div>
              <div className="px-2 py-1.5">
                <p className="line-clamp-1 text-[11px] font-bold leading-tight text-zinc-700">
                  {r.caption.slice(0, 22)}…
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Snapchat-like overlay: large rounded icon bottom-center opens camera */}
      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-20 flex justify-center pb-[calc(16px+env(safe-area-inset-bottom))]">
        <Link
          href="/capture"
          className="pointer-events-auto flex h-[68px] w-[68px] items-center justify-center rounded-full bg-white shadow-[0_8px_24px_rgba(0,0,0,0.18)] ring-1 ring-zinc-200 active:scale-95 transition"
          aria-label="Open camera"
        >
          <span className="flex h-[60px] w-[60px] items-center justify-center rounded-full bg-[#16a34a] text-white">
            <Camera className="h-7 w-7" />
          </span>
        </Link>
      </div>
    </div>
  );
}
