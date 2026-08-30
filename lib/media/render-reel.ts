export async function renderReelVideo(options: {
  imageUrl: string;
  caption: string;
  price: string;
  shopName: string;
  scene: string;
}): Promise<Blob> {
  const image = new Image();
  image.crossOrigin = "anonymous";
  image.src = options.imageUrl;
  await new Promise<void>((resolve, reject) => {
    image.onload = () => resolve();
    image.onerror = () => reject(new Error("Product image could not be loaded"));
  });

  const canvas = document.createElement("canvas");
  canvas.width = 1080;
  canvas.height = 1920;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas unavailable");
  const stream = canvas.captureStream(30);
  const mimeType = ["video/webm;codecs=vp9,opus", "video/webm;codecs=vp8,opus", "video/webm"]
    .find((type) => MediaRecorder.isTypeSupported(type));
  if (!mimeType) throw new Error("Video recording unavailable");

  const chunks: Blob[] = [];
  const recorder = new MediaRecorder(stream, { mimeType });
  recorder.ondataavailable = (event) => event.data.size && chunks.push(event.data);
  const done = new Promise<Blob>((resolve) => {
    recorder.onstop = () => resolve(new Blob(chunks, { type: mimeType }));
  });
  recorder.start(250);
  const started = performance.now();
  const draw = () => {
    const elapsed = performance.now() - started;
    const progress = Math.min(elapsed / 5000, 1);
    const gradient = context.createLinearGradient(0, 0, 1080, 1920);
    gradient.addColorStop(0, options.scene === "boutique" ? "#fff7ed" : options.scene === "street" ? "#f5f5f4" : "#f4f4f5");
    gradient.addColorStop(1, "#ffffff");
    context.fillStyle = gradient;
    context.fillRect(0, 0, 1080, 1920);
    const scale = 0.96 + Math.sin(progress * Math.PI) * 0.04;
    const width = 1080 * scale;
    const height = 1920 * scale;
    context.drawImage(image, (1080 - width) / 2, (1920 - height) / 2, width, height);
    context.fillStyle = "#18181b";
    context.font = "900 54px Arial";
    context.fillText(options.shopName || "Apni Dukaan", 64, 150);
    context.fillStyle = "#16a34a";
    context.font = "900 44px Arial";
    context.fillText(options.price || "Fresh arrival", 64, 230);
    context.fillStyle = "#18181b";
    context.font = "900 52px Arial";
    const words = options.caption.split(" ");
    let line = "";
    let lineY = 1350;
    for (const word of words) {
      const next = `${line} ${word}`.trim();
      if (context.measureText(next).width > 950) {
        context.fillText(line, 64, lineY);
        line = word;
        lineY += 68;
      } else line = next;
    }
    if (line) context.fillText(line, 64, lineY);
    if (progress < 1) requestAnimationFrame(draw);
    else setTimeout(() => recorder.stop(), 100);
  };
  requestAnimationFrame(draw);
  return done;
}
