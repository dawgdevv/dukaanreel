"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Image as ImageIcon, Zap, FlipHorizontal } from "lucide-react";
import { requestCameraStream } from "@/lib/media/camera";

export default function CapturePage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const cameraFileRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const [stream, setStream] = useState<MediaStream | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [error, setError] = useState<string>("");
  const [facing, setFacing] = useState<"environment" | "user">("environment");
  const [price, setPrice] = useState("799");
  const [shopName, setShopName] = useState("");
  const [garmentCategory, setGarmentCategory] = useState<"shirt" | "kurti" | "dress" | "saree">("shirt");
  const [captured, setCaptured] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [starting, setStarting] = useState(false);

  const startCamera = async (mode: "environment" | "user") => {
    if (starting) return;
    try {
      setError("");
      setStarting(true);
      streamRef.current?.getTracks().forEach((track) => track.stop());
      const s = await requestCameraStream(navigator.mediaDevices, mode);
      streamRef.current = s;
      setStream(s);
      if (videoRef.current) {
        videoRef.current.srcObject = s;
        await videoRef.current.play().catch(() => {});
      }
    } catch {
      setError("Camera nahi khula. Browser settings se camera allow karo, ya Gallery se photo pick karo.");
    } finally {
      setStarting(false);
    }
  };

  useEffect(() => {
    return () => streamRef.current?.getTracks().forEach((track) => track.stop());
  }, []);

  const doCapture = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    // Always output 1080x1920 9:16 — crop center from video to match what user sees (object-cover)
    const outW = 1080;
    const outH = 1920;
    canvas.width = outW;
    canvas.height = outH;
    const ctx = canvas.getContext("2d")!;
    const vw = video.videoWidth || outW;
    const vh = video.videoHeight || outH;
    const videoAspect = vw / vh;
    const outAspect = outW / outH;
    let sx = 0, sy = 0, sw = vw, sh = vh;
    if (videoAspect > outAspect) {
      // video wider than 9:16 — crop sides
      sw = vh * outAspect;
      sx = (vw - sw) / 2;
    } else if (videoAspect < outAspect) {
      // video taller — crop top/bottom
      sh = vw / outAspect;
      sy = (vh - sh) / 2;
    }
    if (facing === "user") {
      ctx.translate(outW, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, sx, sy, sw, sh, 0, 0, outW, outH);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
    setCaptured(dataUrl);
    sessionStorage.setItem("dukaanreel-capture", dataUrl);
    sessionStorage.setItem("dukaanreel-price", price);
    sessionStorage.setItem("dukaanreel-shop", shopName);
  };

  const onFilePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const c = canvasRef.current!;
      // Crop gallery image to 9:16 center like camera preview
      const outW = 1080, outH = 1920;
      c.width = outW; c.height = outH;
      const ctx = c.getContext("2d")!;
      const iw = img.width, ih = img.height;
      const outAspect = outW / outH;
      const imgAspect = iw / ih;
      let sx = 0, sy = 0, sw = iw, sh = ih;
      if (imgAspect > outAspect) { sw = ih * outAspect; sx = (iw - sw) / 2; }
      else if (imgAspect < outAspect) { sh = iw / outAspect; sy = (ih - sh) / 2; }
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, outW, outH);
      const dataUrl = c.toDataURL("image/jpeg", 0.9);
      setCaptured(dataUrl);
      sessionStorage.setItem("dukaanreel-capture", dataUrl);
      sessionStorage.setItem("dukaanreel-price", price);
      sessionStorage.setItem("dukaanreel-shop", shopName);
      URL.revokeObjectURL(url);
    };
    img.src = url;
  };

  const goNext = async () => {
    if (!captured || processing) return;
    setProcessing(true);
    setError("");
    try {
      const image = await fetch(captured).then((response) => response.blob());
      const form = new FormData();
      form.append("image", image, "product.jpg");
      form.append("price", price);
      form.append("shopName", shopName || "Apni Dukaan");
      form.append("sceneId", "white");
      form.append("garmentCategory", garmentCategory);
      const response = await fetch("/api/process", { method: "POST", body: form });
      const payload = await response.json() as { reel?: { id: string; imageUrl: string }; error?: string };
      if (!response.ok || !payload.reel) throw new Error(payload.error || "Processing failed");
      sessionStorage.removeItem("dukaanreel-capture");
      try {
        sessionStorage.setItem("dukaanreel-current", JSON.stringify(payload.reel));
      } catch {
        // D1/R2 remain the source of truth when the generated image exceeds browser storage.
      }
      sessionStorage.setItem("dukaanreel-upload-token", btoa(payload.reel.id));
      sessionStorage.setItem("dukaanreel-last-id", payload.reel.id);
      router.push(`/reel/${payload.reel.id}`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Reel nahi ban paayi. Dobara try karo.");
      setProcessing(false);
    }
  };

  return (
    <div className="relative flex flex-1 flex-col overflow-hidden bg-black">
      {/* Header overlay — keeps camera full bleed like native phone app */}
      <header className="absolute top-0 inset-x-0 z-20 flex h-14 items-center justify-between px-3 text-white bg-gradient-to-b from-black/70 to-transparent pt-[env(safe-area-inset-top)]">
        <Link href="/" className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 backdrop-blur">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <span className="text-[14px] font-semibold tracking-tight drop-shadow">DukaanReel</span>
        <button
          onClick={() => {
            const next = facing === "environment" ? "user" : "environment";
            setFacing(next);
            if (stream) void startCamera(next);
          }}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 backdrop-blur"
          aria-label="Flip camera"
        >
          <FlipHorizontal className="h-5 w-5" />
        </button>
      </header>

      {/* Inputs overlay — floating near top, below header like Snapchat */}
      <div className="absolute top-14 inset-x-0 z-20 px-3 pt-2">
        <div className="mx-auto flex max-w-md gap-2">
          <div className="flex flex-1 items-center gap-1.5 rounded-full bg-black/30 px-3 py-2 backdrop-blur ring-1 ring-white/20">
            <span className="text-xs font-bold text-white">₹</span>
            <input
              inputMode="numeric"
              value={price}
              onChange={(e) => setPrice(e.target.value.replace(/\D/g, ""))}
              placeholder="799"
              className="w-full bg-transparent text-[13px] font-semibold text-white outline-none placeholder:text-white/50"
            />
          </div>
          <input
            value={shopName}
            onChange={(e) => setShopName(e.target.value)}
            placeholder="Dukaan naam"
            className="flex-1 rounded-full bg-black/30 px-3 py-2 text-[12px] font-medium text-white outline-none ring-1 ring-white/20 placeholder:text-white/60 backdrop-blur"
          />
        </div>
        <select
          value={garmentCategory}
          onChange={(e) => setGarmentCategory(e.target.value as typeof garmentCategory)}
          className="mt-2 w-full rounded-full bg-black/30 px-3 py-2 text-[12px] font-semibold text-white outline-none ring-1 ring-white/20 backdrop-blur"
          aria-label="Garment type"
        >
          <option value="shirt" className="text-zinc-900">Men&apos;s shirt / T-shirt</option>
          <option value="kurti" className="text-zinc-900">Women&apos;s kurti</option>
          <option value="dress" className="text-zinc-900">Women&apos;s dress</option>
          <option value="saree" className="text-zinc-900">Saree</option>
        </select>
      </div>

      {/* Full phone view — 9:16 camera fills screen like native camera app */}
      <div className="absolute inset-0 bg-black">
        {/* Centered 9:16 viewport — full bleed on phone, letterboxed centered on desktop */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative h-full w-full max-w-md mx-auto aspect-[9/16] max-h-[100dvh] overflow-hidden bg-zinc-900">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`absolute inset-0 h-full w-full object-cover ${facing === "user" ? "-scale-x-100" : ""} ${captured ? "hidden" : "block"}`}
            />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {captured && <img src={captured} alt="captured" className="absolute inset-0 h-full w-full object-cover" />}
            {/* 9:16 guides — subtle */}
            {!captured && <div className="pointer-events-none absolute inset-0 ring-1 ring-white/10" />}
          </div>
        </div>
      </div>

        {!captured && !stream && !error && (
          <div className="absolute inset-0 z-10 grid place-items-center p-8 text-center">
            <div>
              <p className="text-white/70 font-semibold">Photo lene ke liye camera access chahiye</p>
              <button onClick={() => void startCamera(facing)} disabled={starting} className="mt-4 rounded-full bg-[#16a34a] px-6 py-3 text-sm font-black text-white shadow-lg disabled:opacity-60">
                {starting ? "Camera khul raha hai…" : "Camera kholo"}
              </button>
              <button onClick={() => cameraFileRef.current?.click()} className="mt-2 block w-full text-xs font-bold text-white/70 underline underline-offset-4">
                Phone camera se photo lo
              </button>
            </div>
          </div>
        )}

        {error && !captured && (
          <div className="absolute inset-0 z-10 grid place-items-center p-6">
            <div className="rounded-2xl bg-white p-5 text-center">
              <p className="text-sm font-bold text-zinc-900">{error}</p>
              <div className="mt-3 flex justify-center gap-2">
                <button onClick={() => void startCamera(facing)} disabled={starting} className="rounded-xl bg-[#16a34a] px-5 py-3 text-sm font-black text-white disabled:opacity-60">
                  {starting ? "Camera khul raha hai…" : "Dobara try karo"}
                </button>
                <button onClick={() => fileRef.current?.click()} className="rounded-xl bg-zinc-100 px-5 py-3 text-sm font-black text-zinc-900">
                  Gallery
                </button>
                <button onClick={() => cameraFileRef.current?.click()} className="rounded-xl bg-zinc-900 px-5 py-3 text-sm font-black text-white">
                  Phone camera
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Snapchat bottom overlay — large rounded shutter true bottom-center */}
        <div className="absolute inset-x-0 bottom-0 z-20 flex flex-col items-center pb-[calc(20px+env(safe-area-inset-bottom))] pt-4">
          <div className="relative flex h-[84px] w-full max-w-md items-center justify-between px-6">
            <button onClick={() => fileRef.current?.click()} className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15 backdrop-blur text-white ring-1 ring-white/10" aria-label="Gallery">
              <ImageIcon className="h-5 w-5" />
            </button>

            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
              {!captured ? (
                <button onClick={doCapture} className="flex h-[72px] w-[72px] items-center justify-center rounded-full border-[3px] border-white bg-white/10 p-[5px] shadow-[0_2px_12px_rgba(0,0,0,0.5)] backdrop-blur-sm active:scale-95 transition" aria-label="Take photo">
                  <span className="block h-full w-full rounded-full bg-white" />
                </button>
              ) : (
                <button onClick={goNext} disabled={processing} className="inline-flex h-11 items-center gap-1.5 rounded-full bg-[#16a34a] px-6 text-[14px] font-semibold text-white shadow-lg active:scale-95 transition disabled:opacity-60">
                  <Zap className="h-4 w-4" /> {processing ? "Ban raha hai…" : "Reel Banao"}
                </button>
              )}
            </div>

            <button onClick={() => (captured ? setCaptured(null) : startCamera(facing))} className="flex h-11 w-11 items-center justify-center rounded-full bg-white/15 backdrop-blur text-white ring-1 ring-white/10 text-[11px] font-medium">
              {captured ? "Retake" : <FlipHorizontal className="h-5 w-5" />}
            </button>
          </div>

          {captured && (
            <button onClick={goNext} disabled={processing} className="mt-2 flex h-9 w-full max-w-md items-center justify-center rounded-full bg-white mx-6 text-[13px] font-semibold text-zinc-900 disabled:opacity-60">
              {processing ? "Reel ban rahi hai…" : "Preview dekho"}
            </button>
          )}
        </div>

      <canvas ref={canvasRef} className="hidden" />
      <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={onFilePick} />
      <input ref={cameraFileRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={onFilePick} />
    </div>
  );
}
