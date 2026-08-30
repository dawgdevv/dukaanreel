import Image from "next/image";
import Link from "next/link";
import { Asterisk, ArrowUpRight, Camera } from "lucide-react";

const experiments = [
  {
    label: "Can → tee",
    note: "Why should cans have all the fun?",
    src: "/experiments/can-tee.webp",
    alt: "Model wearing a silver T-shirt inspired by a soft drink can",
  },
  {
    label: "Label → saree",
    note: "Packaging, but make it six yards.",
    src: "/experiments/label-saree.webp",
    alt: "Model wearing a yellow saree covered in bold packaging-inspired graphics",
  },
  {
    label: "Midnight mode",
    note: "One idea. All black.",
    src: "/experiments/midnight-shirt.webp",
    alt: "Model wearing a minimal black button-down shirt",
  },
  {
    label: "Logo remix",
    note: "Put your mark anywhere.",
    src: "/experiments/logo-shirt.webp",
    alt: "Model wearing a pale shirt with a custom blue logo",
  },
  {
    label: "Soft chaos",
    note: "A random thought, now wearable.",
    src: "/experiments/lavender-kurti.webp",
    alt: "Model wearing a lavender embroidered kurti with playful sunglasses",
  },
] as const;

export default function Home() {
  return (
    <main className="min-h-screen flex-1 overflow-hidden bg-[#fff7e8] text-[#171711]">
      <header className="flex items-center justify-between px-5 pt-6">
        <span className="text-sm font-black tracking-[-0.05em]">8x.dresses</span>
        <span className="inline-flex -rotate-2 items-center gap-1 rounded-full bg-[#f8e834] px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.08em] ring-1 ring-black">
          <Asterisk className="h-3 w-3" strokeWidth={3} />
          Made from whatever
        </span>
      </header>

      <section className="relative px-5 pb-10 pt-14">
        <span className="absolute right-1 top-16 grid h-[74px] w-[74px] rotate-12 place-items-center rounded-full bg-[#ff5838] text-center text-[10px] font-black uppercase leading-3 tracking-[0.08em] text-white ring-1 ring-black">
          No rules
          <br />
          allowed
        </span>
        <p className="mb-4 text-[11px] font-black uppercase tracking-[0.15em] text-black/45">
          Camera-to-chaos generator
        </p>
        <h1 aria-label="Put anything on anything." className="max-w-[360px] text-[55px] font-black leading-[0.84] tracking-[-0.075em]">
          Put anything
          <br />
          on anything.
        </h1>
        <p className="mt-7 max-w-[335px] text-[16px] font-medium leading-6 text-black/60">
          A can. A logo. A random idea. Snap it and turn it into something unexpectedly wearable.
        </p>
      </section>

      <div className="rotate-[-1deg] overflow-hidden border-y border-black bg-[#171711] py-3 text-[#f8e834]">
        <p className="whitespace-nowrap text-[11px] font-black uppercase tracking-[0.13em]">
          Can → tee&nbsp;&nbsp;✦&nbsp;&nbsp; logo → shirt&nbsp;&nbsp;✦&nbsp;&nbsp; label → saree&nbsp;&nbsp;✦&nbsp;&nbsp; anything → outfit
        </p>
      </div>

      <section aria-label="Weird transformation gallery" className="px-3 pb-8 pt-8">
        <article className="group relative aspect-[2/3] overflow-hidden rounded-[30px] border border-black bg-[#eee4d5] shadow-[5px_6px_0_#171711]">
          <Image
            src={experiments[0].src}
            alt={experiments[0].alt}
            fill
            priority
            sizes="(max-width: 448px) 100vw, 448px"
            className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.025]"
          />
          <div className="absolute inset-x-0 bottom-0 flex items-end justify-between bg-gradient-to-t from-black/75 via-black/10 to-transparent p-5 pt-24 text-white">
            <div>
              <p className="text-[25px] font-black tracking-[-0.045em]">{experiments[0].label}</p>
              <p className="mt-1 text-xs text-white/70">{experiments[0].note}</p>
            </div>
            <span className="grid h-10 w-10 -rotate-6 place-items-center rounded-full bg-[#f8e834] text-black ring-1 ring-black">
              <ArrowUpRight className="h-5 w-5" strokeWidth={2.5} />
            </span>
          </div>
        </article>

        <article className="group relative mt-8 aspect-[2/3] overflow-hidden rounded-[30px] border border-black bg-[#f4d348] shadow-[-5px_6px_0_#ff5838]">
          <Image
            src={experiments[1].src}
            alt={experiments[1].alt}
            fill
            sizes="(max-width: 448px) 100vw, 448px"
            className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.025]"
          />
          <div className="absolute left-4 top-4 -rotate-3 rounded-full bg-[#f8e834] px-4 py-2 text-xs font-black ring-1 ring-black">
            {experiments[1].label}
          </div>
          <p className="absolute bottom-4 right-4 max-w-[170px] rotate-2 rounded-2xl bg-white px-4 py-3 text-right text-xs font-bold leading-4 ring-1 ring-black">
            {experiments[1].note}
          </p>
        </article>

        <div className="mt-8 grid grid-cols-2 gap-3">
          {experiments.slice(2, 4).map((experiment, index) => (
            <article key={experiment.label} className={index === 1 ? "pt-10" : ""}>
              <div className="relative aspect-[2/3] overflow-hidden rounded-[24px] border border-black bg-[#eee4d5]">
                <Image
                  src={experiment.src}
                  alt={experiment.alt}
                  fill
                  sizes="(max-width: 448px) 50vw, 218px"
                  className="object-cover transition-transform duration-500 ease-out hover:scale-[1.035]"
                />
              </div>
              <div className="px-1 pb-3 pt-3">
                <p className="text-sm font-black tracking-[-0.025em]">{experiment.label}</p>
                <p className="mt-1 text-[11px] leading-4 text-black/45">{experiment.note}</p>
              </div>
            </article>
          ))}
        </div>

        <article className="group relative mt-5 aspect-[4/5] overflow-hidden rounded-[30px] border border-black bg-[#eadcf0] shadow-[5px_6px_0_#8357ff]">
          <Image
            src={experiments[4].src}
            alt={experiments[4].alt}
            fill
            sizes="(max-width: 448px) 100vw, 448px"
            className="object-cover object-[center_28%] transition-transform duration-500 ease-out group-hover:scale-[1.025]"
          />
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-5 pt-20 text-white">
            <p className="text-[25px] font-black tracking-[-0.045em]">{experiments[4].label}</p>
            <p className="mt-1 text-xs text-white/70">{experiments[4].note}</p>
          </div>
        </article>
        <Link
          href="/creations"
          className="mx-auto mt-10 flex h-12 w-fit items-center gap-2 rounded-full border border-black bg-[#f8e834] px-6 text-sm font-black shadow-[3px_4px_0_#171711] transition active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
        >
          Show more
          <ArrowUpRight className="h-4 w-4" strokeWidth={2.5} />
        </Link>
      </section>

      <section className="px-5 pb-6 pt-8 text-center">
        <span className="inline-block rotate-2 rounded-full border border-black bg-white px-4 py-2 text-[10px] font-black uppercase tracking-[0.12em]">
          Normal is optional
        </span>
        <h2 className="mx-auto mt-5 max-w-[340px] text-[38px] font-black leading-[0.9] tracking-[-0.06em]">
          Your weird idea deserves to exist.
        </h2>
      </section>

      <div className="sticky bottom-0 z-20 bg-gradient-to-t from-[#fff7e8] via-[#fff7e8] to-transparent px-5 pb-[calc(20px+env(safe-area-inset-bottom))] pt-9">
        <Link
          href="/capture"
          className="flex h-16 w-full items-center justify-between rounded-full border border-black bg-[#ff5838] px-6 text-base font-black text-white shadow-[4px_5px_0_#171711] transition active:translate-x-1 active:translate-y-1 active:shadow-none"
        >
          <span className="inline-flex items-center gap-3">
            <Camera className="h-5 w-5" strokeWidth={2.5} />
            Make something weird
          </span>
          <ArrowUpRight className="h-5 w-5" strokeWidth={2.5} />
        </Link>
      </div>
    </main>
  );
}
