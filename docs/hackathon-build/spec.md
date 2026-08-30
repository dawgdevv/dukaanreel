# 8x.dresses Technical Specification

Status: proposed implementation plan  
Source brief: [`dukaanreel.md`](../../dukaanreel.md)  
Existing technical notes: [`dukaanreel-tech.md`](../../dukaanreel-tech.md)

Deployment correction: use the already-configured Cloudflare account and bindings. Supabase is not part of this plan. There is no login, account table, session, or user ownership model.

## 1. Objective and success criteria

DukaanReel turns one product photo into a shareable Hinglish vertical reel for a small shopkeeper:

`camera/gallery -> product cleanup -> caption -> voice -> 9:16 reel -> public link -> WhatsApp`

The demo must be understandable without explanation and complete in roughly 10 seconds after capture. The primary user is a WhatsApp-first shopkeeper using a phone, so every primary action must be large, labelled, and usable without typing a prompt or creating an account.

### Must demonstrate

- Capture a product photo or select one from the gallery.
- Accept a price and optional shop name.
- Generate a transparent product cutout, Hinglish sales caption, and voice audio.
- Render a 5-second 9:16 reel using one of three preset scenes.
- Persist the reel and expose a public `/r/[id]` page.
- Open a WhatsApp share action from the preview and public page.
- Work with mock provider responses when API keys are missing, so the stage demo cannot be blocked by a third-party outage.

### Explicitly out of scope

Authentication, payments, multi-product catalogues, a general-purpose editor, custom backgrounds, customer identity, WhatsApp Business API integration, automatic inbound-message handling, analytics dashboards, and production-grade moderation.

## 2. Chosen stack

| Layer | Choice | Reason |
|---|---|---|
| Web app | Next.js 16 App Router, React 19, TypeScript | Matches the existing repo and gives server-rendered share pages plus route handlers. |
| Styling | Existing Tailwind CSS v4 setup and `lucide-react` | Preserve the existing mobile-first UI and icon language. |
| AI SDK | `openai` server-side SDK using the Responses API | Product image understanding and structured caption output without exposing the API key. |
| Background removal | `remove.bg` adapter initially; deterministic mock adapter for local/demo fallback | Reliable cutouts in a hackathon timeframe, isolated behind one interface. |
| Voice | ElevenLabs or Sarvam adapter, selected by environment variable; browser speech fallback | Native-sounding Hinglish where available and a no-key path for demos. |
| Video | Canvas renderer + `MediaRecorder`; `@ffmpeg/ffmpeg`/FFmpeg.wasm for optional WebM-to-MP4 conversion | Keeps rendering client-side and avoids Cloudflare Worker bundle/runtime limits while still using FFmpeg. |
| Database | Cloudflare D1 (SQLite) | Matches the configured Cloudflare deployment and is sufficient for one anonymous `reels` table. |
| Files | Cloudflare R2 | Stores cutout PNG, audio, and final video objects with Worker-controlled public URLs. |
| Hosting | Cloudflare Pages + Workers / `@opennextjs/cloudflare` | Supports the repo’s Next 16 version while keeping API routes close to R2, D1, and Workers AI. |
| Validation | Zod | Runtime validation of browser/server boundaries and AI output. |
| Testing | Vitest for pure functions; Playwright for the core browser flow | Focus verification on the demo-critical path. |

Useful documentation: [Next.js App Router](https://nextjs.org/docs/app), [Next.js Route Handlers](https://nextjs.org/docs/app/building-your-application/routing/route-handlers), [Cloudflare Pages](https://developers.cloudflare.com/pages/), [Cloudflare Workers](https://developers.cloudflare.com/workers/), [D1](https://developers.cloudflare.com/d1/), [R2](https://developers.cloudflare.com/r2/), [Workers AI](https://developers.cloudflare.com/workers-ai/), [OpenAI Responses API](https://platform.openai.com/docs/api-reference/responses), [OpenAI vision](https://platform.openai.com/docs/guides/images-vision), [OpenAI structured outputs](https://platform.openai.com/docs/guides/structured-outputs), [FFmpeg.wasm](https://ffmpegwasm.netlify.app/), [MediaRecorder](https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder), and [WhatsApp click-to-chat](https://faq.whatsapp.com/5913398998672934/).

## 3. Architecture

### 3.1 Browser application

The existing pages remain the product surfaces:

- `/`: landing page and recent reels.
- `/capture`: camera/gallery capture and price/shop metadata.
- `/reel/[id]`: generated reel preview, caption edit, scene selection, audio preview, and sharing.
- `/r/[id]`: public, server-rendered customer page with Open Graph metadata.

Client-only capabilities stay in client components: camera access, canvas drawing, audio playback, MediaRecorder, FFmpeg.wasm, progress state, and session recovery.

### 3.2 Server boundary

All provider secrets and database writes stay server-side in Next.js route handlers running on the Cloudflare Worker runtime. The browser sends a compressed image and small metadata to `/api/process`; it never receives OpenAI, remove.bg, or ElevenLabs credentials. D1 and R2 bindings are accessed only from server code.

The process route performs:

1. Validate request and enforce a size/type limit.
2. Upload the original image to a private or short-lived storage location if needed.
3. Remove the background.
4. Ask OpenAI to identify the product and return a constrained caption payload.
5. Generate TTS from the final caption.
6. Upload PNG and audio to R2.
7. Insert a `reels` row with `status = 'ready'` and return the public reel data.

For this 6-hour build, this remains one synchronous request with a generous but bounded timeout and a visible progress UI. If provider latency becomes unreliable, split into `/api/process` and `/api/upload` later; do not introduce a queue before the core demo works.

### 3.3 Storage and public access

Use the configured R2 bucket for the hackathon. Object names are generated from a UUID and never contain user-provided text:

```text
{reelId}/original.jpg
{reelId}/product.png
{reelId}/voice.mp3
{reelId}/reel.webm
{reelId}/reel.mp4   # optional FFmpeg output
```

The public page reads a reel by opaque ID. It must render a friendly not-found state instead of falling back to mock data.

## 4. PRD epic mapping

| PRD epic | Technical implementation | Acceptance signal |
|---|---|---|
| Capture | `/capture`, `getUserMedia`, file input with `capture`, client-side crop/compression | JPEG is produced from camera or gallery and survives navigation. |
| BG Cut | `BackgroundRemovalProvider` adapter and `remove.bg` implementation | Transparent PNG is returned or a clearly marked demo fallback is used. |
| Caption | OpenAI vision request with Zod validation and price injection | Caption contains product description, price, CTA, and up to three hashtags. |
| Voice | `TtsProvider` adapter plus browser speech fallback | Audio can be played from preview without blocking reel creation. |
| Reel Compose | Canvas scene renderer and MediaRecorder; FFmpeg.wasm optional transcode | Five-second portrait video contains product, shop, caption, and scene. |
| Store + Share | R2/D1, `/r/[id]`, metadata, WhatsApp URL | Opening the returned link on another device displays the reel and share CTA. |
| Agentic stretch | Deferred; use a static “Agent Chalao” concept only if core flow is complete | Never jeopardize the capture-to-share demo. |

## 5. Data model

Create `migrations/0001_create_reels.sql` and apply it with Wrangler:

```sql
create table if not exists reels (
  id text primary key,
  caption text not null,
  product_name text,
  price integer,
  shop_name text not null default 'Apni Dukaan',
  scene_id text not null default 'white',
  image_url text not null,
  audio_url text,
  video_url text,
  status text not null default 'processing'
    check (status in ('processing', 'ready', 'failed')),
  error_code text,
  created_at text not null default (datetime('now'))
);

create index if not exists reels_created_at_idx on reels (created_at desc);
```

There are no user policies because there are no accounts. D1 and R2 bindings are unavailable to browser code. Public assets are served through a controlled Worker route or R2 custom domain; generated IDs prevent guessable user-facing filenames. Keep the bucket private if the existing Cloudflare configuration supports signed URLs without slowing the demo.

### TypeScript domain type

```ts
export type Reel = {
  id: string;
  caption: string;
  productName: string | null;
  price: number | null;
  shopName: string;
  sceneId: SceneId;
  imageUrl: string;
  audioUrl: string | null;
  videoUrl: string | null;
  status: 'processing' | 'ready' | 'failed';
  createdAt: string;
};
```

## 6. API contracts

### `POST /api/process`

Request: `multipart/form-data`

- `image`: JPEG/PNG, max 8 MB after client compression.
- `price`: optional numeric string, 0–10,000,000.
- `shopName`: optional string, max 60 characters.
- `sceneId`: `white | boutique | street`.

Response `200`:

```json
{
  "reel": {
    "id": "uuid",
    "caption": "Ye red cotton kurti fresh hai — ₹799 only! DM karo 💛 #lajpatstyle #kurti #newarrival",
    "productName": "red cotton kurti",
    "price": 799,
    "shopName": "Apni Dukaan",
    "imageUrl": "https://.../product.png",
    "audioUrl": "https://.../voice.mp3",
    "videoUrl": null,
    "sceneId": "white",
    "status": "ready"
  },
  "capabilities": { "canRecordVideo": true, "canUseTts": true }
}
```

Errors:

- `400`: invalid file or metadata.
- `413`: file too large.
- `429`: provider rate limit; client offers “Demo mode” retry.
- `502`: provider failure; server may return a fallback caption if enabled.
- `500`: unexpected failure; do not leak provider details.

### `POST /api/upload`

Request: raw `video/webm` or `video/mp4` body, max 25 MB, with `Content-Type`, `x-reel-id`, and an `x-upload-token` returned from process. The token is a short-lived HMAC or a server-generated one-time token; do not accept arbitrary IDs for anonymous uploads.

Response:

```json
{ "id": "uuid", "videoUrl": "https://.../reel.webm", "status": "ready" }
```

The client should navigate to `/reel/[id]` immediately after process and upload the video in the background. If upload fails, preview and WhatsApp sharing still work using the image/audio fallback.

### `GET /api/reels/[id]`

Internal helper used by server components and client recovery. Returns the normalized `Reel`; `404` for unknown IDs and `410` for expired demo assets if expiry is later added.

## 7. AI/provider design

Create provider interfaces so the demo can switch providers without changing UI code:

```ts
export interface BackgroundRemovalProvider {
  remove(input: Buffer, mimeType: string): Promise<Buffer>;
}

export interface CaptionProvider {
  describeProduct(input: Buffer, price: number | null): Promise<CaptionResult>;
}

export interface TtsProvider {
  synthesize(text: string): Promise<{ bytes: Buffer; mimeType: string }>;
}
```

Environment selection:

```text
BG_PROVIDER=removebg|mock
CAPTION_PROVIDER=openai|mock
TTS_PROVIDER=elevenlabs|sarvam|browser|mock
```

OpenAI prompt rules:

- Tell the model the audience is a Delhi clothing shopkeeper’s WhatsApp customers.
- Instruct it to describe only visible product attributes; never invent brand, fabric, discount, or stock.
- Treat the supplied price as authoritative.
- Return JSON matching `{ productName, caption, hashtags }`.
- Limit caption to one short Hinglish line and hashtags to three.
- Sanitize/validate output and fall back to a deterministic caption if parsing fails.

Do not send the original image or caption to the browser beyond what the user needs. Log provider latency and error category, never API keys or raw customer content.

## 8. Client reel renderer

`components/reel/reel-canvas.tsx` owns rendering and exposes:

```ts
renderReel(options: {
  productImageUrl: string;
  caption: string;
  shopName: string;
  price: number | null;
  sceneId: SceneId;
  audioUrl?: string | null;
}): Promise<Blob>;
```

Rendering rules:

- Canvas: 1080 × 1920, 30 fps, exactly 5 seconds.
- Draw a preset background, subtle texture, product cutout centered in a 760 × 760 safe box, shop badge, caption, and price pill.
- Use `devicePixelRatio` only for preview; always export at 1080 × 1920.
- Load all images with `crossOrigin = 'anonymous'`; the R2 public asset route/custom domain must allow CORS.
- Use an `AudioContext` destination connected to the canvas capture stream when audio is available.
- Prefer `video/webm;codecs=vp9,opus`, then `video/webm;codecs=vp8,opus`; detect support before recording.
- Load FFmpeg.wasm only after the user asks to download/share MP4, never during initial processing.
- If FFmpeg conversion is too slow on the demo phone, retain WebM and share the public link rather than blocking.

The preview should display the same composition using regular DOM/CSS before recording so the user sees something immediately.

## 9. File structure

```text
app/
  api/
    process/route.ts                 # validates upload and runs AI pipeline
    reels/[id]/route.ts               # normalized reel fetch, if needed by client
    upload/route.ts                   # token-bound video upload to R2
  capture/page.tsx                    # existing capture UI; replace session-only handoff
  reel/[id]/page.tsx                  # existing preview; load real reel and render/upload
  r/[id]/page.tsx                     # server-rendered public share page
  r/[id]/opengraph-image.tsx          # optional dynamic OG image from reel data
components/
  capture/camera-capture.tsx          # camera/gallery and image compression
  reel/reel-preview.tsx               # visual preview and actions
  reel/reel-canvas.tsx                # canvas + MediaRecorder implementation
  reel/scene-picker.tsx               # three preset scene buttons
  share/whatsapp-button.tsx           # wa.me URL builder
  ui/progress-step.tsx                # capture/process/render status
lib/
  env.ts                              # validated server/client environment variables
  types.ts                            # Reel, SceneId, API response types
  validation.ts                       # Zod schemas and normalization helpers
  cloudflare/env.ts                   # typed D1/R2/AI bindings and secrets
  cloudflare/repository.ts            # D1 get/create/update reel operations
  cloudflare/assets.ts                # R2 put/get and public asset URL helpers
  providers/background-removal.ts     # adapter and remove.bg/mock implementations
  providers/caption.ts                # OpenAI/mock implementations
  providers/tts.ts                    # ElevenLabs/Sarvam/browser/mock implementations
  media/scenes.ts                     # scene definitions and asset paths
  media/whatsapp.ts                   # encoded share text and URL
  media/image.ts                      # resize/compress/data URL helpers
migrations/
  0001_create_reels.sql
public/
  scenes/white.png
  scenes/boutique.png
  scenes/street.png
  demo/product.png                    # deterministic fallback asset
docs/hackathon-build/
  spec.md
  build-notes.md
```

## 10. End-to-end data lifecycle

1. `CameraCapture` produces a JPEG Blob, compressing the longest edge to 1600 px.
2. The browser posts image + price + shop + scene to `/api/process`.
3. The route validates the body, creates a reel ID, runs background removal, OpenAI caption generation, and TTS through adapters.
4. The server uploads `product.png` and `voice.mp3` to R2, then inserts the reel row in D1.
5. The response returns the reel. The preview page renders the product and caption immediately.
6. The client records the five-second canvas composition, optionally transcodes with FFmpeg.wasm, and uploads it to `/api/upload`.
7. The upload route updates `video_url`. The preview’s share URL remains stable throughout.
8. `/r/[id]` reads the row server-side, renders the final video when available, and falls back to the product image/audio when video is still uploading.
9. `WhatsApp Pe Bhejo` opens `https://wa.me/?text=...` with caption, price, and the public URL. The app does not claim to send media through the WhatsApp API.

## 11. State and error strategy

### Browser state

- Keep capture metadata and the last image in a short-lived `sessionStorage` key only until processing completes.
- Keep the canonical reel ID in the URL; reloads on `/reel/[id]` fetch from the database.
- Use a reducer for `idle -> capturing -> processing -> previewing -> rendering -> uploading -> ready | error`.
- Disable duplicate capture/process submissions and provide a retry action that preserves the captured image.

### Demo-critical failures

1. Camera permission denied: show gallery input immediately.
2. AI/provider timeout: use mock caption/cutout/TTS when `DEMO_MODE=true`, with a small “Demo mode” label only if necessary.
3. Video recording unsupported or too slow: keep the DOM preview, store image/audio, and share the public link with a clear “video still processing” fallback.
4. Cloudflare unavailable: show a local demo reel ID only in `DEMO_MODE`; never silently present a fake persisted link in production mode.

## 12. Security and privacy baseline

- Keep all secret keys in Cloudflare Pages/Workers secrets; commit only `.env.example` names.
- Validate MIME type, byte size, numeric price, and text lengths server-side.
- Strip EXIF metadata during client compression where practical.
- Use generated UUIDs for asset paths; never use shop names or captions in filenames.
- Add basic request rate limiting at the edge if time permits.
- Do not log image bytes, API keys, full provider requests, or user-supplied text unnecessarily.
- Add a short retention note in the UI or README; hackathon storage is not a permanent catalogue.

## 13. Implementation sequence and checkpoints

### Phase 0 — foundation (20–30 min)

- Install `openai`, `zod`, `@cloudflare/next-on-pages`, `@ffmpeg/ffmpeg`, and test tooling.
- Add `.env.example`, `lib/env.ts`, shared types, and scene assets.
- Verify the existing Cloudflare Pages project, R2 bucket, D1 database, AI binding, and Worker secrets.

Checkpoint: `npm run lint` and `npm run build` pass with the existing UI.

### Phase 1 — real persistence (30–45 min)

- Implement typed Cloudflare bindings and the D1 repository.
- Replace mock lookup in `/r/[id]` with database lookup and proper not-found handling.
- Add `GET /api/reels/[id]` if client fetching needs it.

Checkpoint: insert one row with `wrangler d1 execute` and open its public link in an incognito tab.

### Phase 2 — processing pipeline (60–90 min)

- Implement multipart parsing and validation.
- Add mock providers first, then OpenAI, background-removal, and TTS adapters.
- Upload image/audio and insert the reel.
- Connect `/capture` to `/api/process` with progress and retry states.

Checkpoint: one real photo reaches `/reel/[id]`; missing keys still produce a demo result.

### Phase 3 — recording and upload (60–90 min)

- Extract composition logic into `reel-canvas.tsx`.
- Record a five-second WebM and upload it.
- Add lazy FFmpeg.wasm MP4 conversion only after WebM works.
- Update preview/public page to use video when present.

Checkpoint: on a phone and desktop, a generated reel plays and the database row receives `video_url`.

### Phase 4 — polish and demo hardening (45–60 min)

- Large Hinglish labels, loading progress, error copy, safe-area spacing, and accessible button labels.
- Add deterministic demo asset/provider mode.
- Confirm WhatsApp link, OG metadata, and second-device public URL.

Checkpoint: rehearse the exact stage flow three times; target capture-to-share under 30 seconds in demo mode and under 90 seconds with live providers.

## 14. Verification plan

### Unit tests

- Caption schema rejects long/unsafe/malformed provider output and preserves the supplied price.
- Image compression returns an accepted MIME type and stays below the upload limit.
- Scene lookup rejects unknown IDs.
- WhatsApp URL encodes Hindi, rupee symbols, emoji, and the public URL correctly.
- Reel repository maps snake_case database rows to camelCase domain types.

### Browser tests

- Landing page opens capture.
- Gallery fallback can select a fixture image.
- Processing success routes to `/reel/[id]`.
- Preview shows caption, price, scene picker, audio action, and WhatsApp link.
- Public `/r/[id]` page renders from persisted data and has a usable share CTA.
- Provider failure shows retry/fallback state without losing the captured photo.

### Manual device matrix

- iPhone Safari: camera permission, gallery fallback, audio gesture, WebM recording.
- Android Chrome: camera, Hindi text, WhatsApp deep link.
- Desktop Chrome: stage demo, second-device public URL, devtools network errors.
- Slow network: processing spinner and retry; no duplicate rows from double taps.

## 15. Risks and decisions

| Risk | Decision/mitigation |
|---|---|
| Cloudflare Worker cannot reliably bundle a large FFmpeg binary | Use FFmpeg.wasm in a lazy client worker; keep server FFmpeg as a post-hackathon media worker option. |
| Third-party AI latency exceeds the demo window | Provider interfaces, deterministic demo mode, and visible staged progress. |
| Browser audio cannot be captured automatically | Start audio after a user gesture and fall back to a silent video plus separate audio playback. |
| WhatsApp does not accept arbitrary video upload from a web `wa.me` URL | Share the public link and caption; do not promise direct media attachment. |
| Public storage exposes demo assets | Use generated IDs and document short retention; tighten bucket policies before production. |
| User edits caption after TTS generation | Mark audio stale and regenerate on explicit “Suno”/render, or keep editing out of the first vertical slice. |

## 16. `$build-checklist` handoff

The checklist should turn this spec into small tasks in this order: verify existing Cloudflare bindings/secrets, D1 schema and R2 asset access, provider adapters, process API, capture integration, real preview data, canvas recording, video upload, public page/OG, WhatsApp share, fallback mode, tests, and device rehearsal. Each task should have a verification command or manual checkpoint and should preserve the rule that a working demo path is always available even when live providers fail.
