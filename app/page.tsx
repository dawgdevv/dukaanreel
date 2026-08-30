import Link from "next/link";
import { ArrowUpRight, Camera } from "lucide-react";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-1 flex-col bg-white px-5 pb-5 pt-6 text-black">
      <header className="flex items-center justify-between">
        <span className="text-sm font-semibold">8x.dresses</span>
        <span className="h-2.5 w-2.5 rounded-full bg-black" aria-hidden="true" />
      </header>

      <section className="flex flex-1 flex-col justify-center py-16">
        <p className="mb-5 text-xs font-medium uppercase text-black/50">AI clothing maker</p>
        <h1 className="max-w-sm text-[48px] font-semibold leading-[0.94]">
          Turn a photo into a finished look.
        </h1>
        <p className="mt-6 max-w-xs text-base leading-6 text-black/60">
          Photograph a T-shirt, shirt, saree, or top. We will create the product image for you.
        </p>
      </section>

      <Link
        href="/capture"
        className="flex h-16 w-full items-center justify-between rounded-full bg-black px-6 text-base font-medium text-white transition active:scale-[0.98]"
      >
        <span className="inline-flex items-center gap-3">
          <Camera className="h-5 w-5" />
          Open camera
        </span>
        <ArrowUpRight className="h-5 w-5" />
      </Link>
    </main>
  );
}
