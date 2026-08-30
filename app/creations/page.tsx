import Link from "next/link";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import { listReels } from "@/lib/cloudflare";

export const dynamic = "force-dynamic";

export default async function CreationsPage() {
  const reels = await listReels().catch((error) => {
    console.error("generation gallery fallback", error instanceof Error ? error.message : "unknown error");
    return [];
  });

  return (
    <main className="min-h-screen flex-1 bg-[#f8e834] px-3 pb-12 text-[#171711]">
      <header className="flex h-16 items-center justify-between px-2">
        <Link
          href="/"
          aria-label="Back to home"
          className="grid h-10 w-10 place-items-center rounded-full border border-black bg-white"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <span className="text-sm font-black tracking-[-0.05em]">8x.dresses</span>
        <span className="h-10 w-10" aria-hidden="true" />
      </header>

      <section className="px-2 pb-7 pt-6">
        <p className="text-[10px] font-black uppercase tracking-[0.14em] text-black/45">Live from Cloudflare</p>
        <h1 className="mt-2 text-[46px] font-black leading-[0.88] tracking-[-0.065em]">Made by you.</h1>
        <p className="mt-4 max-w-xs text-sm font-medium leading-5 text-black/55">
          Every strange little idea created with 8x.dresses.
        </p>
      </section>

      {reels.length > 0 ? (
        <section aria-label="Community generations" className="grid grid-cols-2 gap-3 pb-6">
          {reels.map((reel, index) => (
            <Link
              key={reel.id}
              href={`/r/${reel.id}`}
              className={`group block ${index % 2 === 1 ? "translate-y-5" : ""}`}
            >
              <span className="relative block aspect-[9/16] overflow-hidden rounded-[22px] border border-black bg-white shadow-[3px_4px_0_#171711]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={reel.imageUrl}
                  alt={reel.productName ? `${reel.productName} generated with 8x.dresses` : "Generated look"}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                />
                <span className="absolute bottom-3 right-3 grid h-9 w-9 place-items-center rounded-full border border-black bg-white">
                  <ArrowUpRight className="h-4 w-4" strokeWidth={2.5} />
                </span>
              </span>
            </Link>
          ))}
        </section>
      ) : (
        <p className="rounded-[24px] border border-black bg-white p-6 text-center text-sm font-bold shadow-[3px_4px_0_#171711]">
          No creations yet. Make the first one.
        </p>
      )}
    </main>
  );
}
