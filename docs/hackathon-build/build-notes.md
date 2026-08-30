# DukaanReel Build Notes

## Spec session — 2026-08-30

- User corrected the deployment choice: use the already-configured Cloudflare Pages/Workers stack, D1, R2, Workers AI fallback, OpenAI SDK, provider adapters for background removal and TTS, and FFmpeg.
- Existing repo is a Next.js 16.3.3 App Router starter with mock implementations already present in `/`, `/capture`, `/reel/[id]`, and `/r/[id]`.
- The technical plan treats the existing UI as the starting surface and replaces mock data incrementally.
- Important architecture decision: use FFmpeg.wasm lazily in the browser for hackathon MP4 conversion; avoid bundling server-side FFmpeg into Cloudflare Worker routes.
- Important reliability decision: retain mock providers/demo mode so the stage demo is not dependent on external API availability.
- No-login decision: the app is intentionally anonymous. A generated reel ID is the only share permission; there are no users, sessions, or account-owned records.
- Deepening rounds: 0. User provided the product brief and stack direction; no further interview round was needed after defaults were confirmed.

## Open implementation decisions

- Choose the final TTS provider based on available hackathon credentials and Hindi/Hinglish voice quality.
- Confirm whether the existing R2 setup exposes assets through a custom domain or requires a Worker asset route; configure CORS for canvas rendering.
- Keep the agentic WhatsApp auto-reply as stretch scope only after the full capture-to-share path is rehearsed.
