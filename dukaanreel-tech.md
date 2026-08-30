# DukaanReel — Tech Stack (Swappable, Fastest Wins)

> No vendor lock. Host = Cloudflare Pages. Each block = fastest provider via `fetch()`, 1-line swap.

## Host
- **Deploy:** Cloudflare Pages + `next-on-pages` (Next.js 14 App Router, PWA)
- **API:** Cloudflare Workers (`/api/process`, `edge` runtime)
- **Store:** R2 bucket `dukaanreel` + D1 `reels` table
- **CDN:** Cloudflare auto

## Pipeline Tech Per Block

| # | Block | Fastest (use) | Swap Fallback | Input → Output |
|---|---|---|---|---|
| 1 | Capture | `navigator.mediaDevices.getUserMedia` + `<input capture>` (PWA) | — | JPEG base64 |
| 2 | BG Cut | `remove.bg API` (reliable, 1 POST) | `Workers AI @cf/unum/u2net` | JPEG → PNG transparent |
| 3 | Caption | `OpenAI GPT-4o vision` (partner credits, Hinglish best) | `Workers AI @cf/llava-hf/llava-1.5-7b-hf` + `@cf/meta/llama-3-8b` | PNG → `Ye red kurti... ₹799 #...` |
| 4 | Voice | `ElevenLabs TTS` (Hinglish voice, partner) | `Sarvam AI` (native Hindi) | caption text → mp3 |
| 5 | Reel | **Client Canvas + MediaRecorder** (no server, 5s 1080x1920) | `FFmpeg.wasm` or `Shotstack API` | PNG + text + mp3 → webm/mp4 |
| 6 | Store/Share | R2 (image/audio/video) + D1 + `next/og` | Cloudinary / Supabase | blob → `/r/[id]` link |

## Adapter Pattern (no lock)

```ts
// lib/providers.ts
export const bg = { remove: (b64) => fetch("https://api.remove.bg/v1.0/removebg", {headers:{"X-Api-Key":process.env.REMOVE_BG}})}
// swap: env.AI.run('@cf/unum/u2net', {image:b64})

export const caption = { gen: (png) => openai.chat.completions.create({model:"gpt-4o", messages:[{role:"user", content:[{type:"text", text: prompt}, {type:"image_url", image_url: png}]}]})}
// swap: env.AI.run('@cf/llava...', {image: png, prompt})

export const tts = { gen: (text) => fetch(`https://api.elevenlabs.io/v1/text-to-speech/${VOICE}`, {method:"POST", headers:{"xi-api-key":process.env.ELEVEN}, body: JSON.stringify({text})})}
```

Env switch in `wrangler.toml`:
```toml
[vars]
BG_PROVIDER = "removebg" # or "workers-ai"
CAPTION_PROVIDER = "openai" # or "llava"
```

## Wrangler

```toml
name = "dukaanreel"
compatibility_date = "2024-08-01"
ai = { binding = "AI" }
r2_buckets = [{ binding = "R2", bucket_name = "dukaanreel" }]
d1_databases = [{ binding = "DB", database_name = "dukaanreel", database_id = "xxx" }]
```

## API Route

```ts
// app/api/process/route.ts (edge)
export const runtime = 'edge'
export async function POST(req, {env}) {
  const {imageBase64, price} = await req.json()
  const png = await bg.remove(imageBase64)
  const [captionRes, voice] = await Promise.all([
    caption.gen(png),
    // voice after caption: sequential if need text
  ])
  const audio = await tts.gen(captionRes.text)
  const id = crypto.randomUUID().slice(0,8)
  await env.R2.put(`${id}.png`, Buffer.from(png,'base64'))
  await env.R2.put(`${id}.mp3`, audio)
  await env.DB.prepare("INSERT INTO reels (id,caption,image_url,audio_url) VALUES (?,?,?,?)").bind(id, captionRes.text, `${id}.png`, `${id}.mp3`).run()
  return Response.json({id, caption: captionRes.text, share:`/r/${id}`})
}
```

## Client Reel (app/capture/page.tsx)

```ts
canvas.width=1080; canvas.height=1920
ctx.drawImage(bgImg,0,0,1080,1920)
ctx.drawImage(productImg,200,400,680,680)
ctx.fillText(caption,50,1700)
const stream = canvas.captureStream(30)
const rec = new MediaRecorder(stream)
rec.start(); audio.play()
setTimeout(()=>rec.stop(),5000)
rec.ondataavailable = e => fetch('/api/upload', {method:'POST', body: e.data})
```

Upload: `POST /api/upload` → `env.R2.put(`${id}.webm`, blob)` → Cloudflare Stream plays webm.

## DB Schema

```sql
CREATE TABLE reels (id TEXT PRIMARY KEY, caption TEXT, image_url TEXT, audio_url TEXT, video_url TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP);
```

## Routes

- `/` — hero + Snap
- `/capture` — camera + price input
- `/api/process` — pipeline
- `/api/upload` — video blob → R2
- `/r/[id]` — public share + `generateMetadata` OG

## Agentic Stretch (45m)

```ts
// Worker agent (optional)
const agent = await env.AI.run('@cf/meta/llama-3-8b', {
  prompt: "You are dukaan sales agent. Tools: sendWhatsApp, replyCustomer",
  tools: [{name:"sendWhatsApp"}, {name:"replyCustomer"}]
})
```

Tool `sendWhatsApp` = `fetch(wa.me/?text=shareLink)`, `replyCustomer` = LLM Hinglish reply.

## 6hr Build Order

1. Tonight: `npm create cloudflare`, create R2/D1, add keys
2. 11-12:30: capture + bg + caption
3. 1-2:30: TTS + canvas reel + R2 + share
4. 2:30-3:30: polish (big buttons, Hinglish)
5. 3:30-4:15: agent mock
6. 4:15-4:30: pitch rehearse

---
*Tech file companion to dukaanreel.md — 2026-08-29*
