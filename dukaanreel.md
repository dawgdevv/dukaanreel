# DukaanReel — 8x Mobile Hackathon (Delhi)

> **Tagline:** Lajpat uncle snaps product → 10-sec Hinglish Reel → WhatsApp sale.

## Core Idea (Sole)
Real dukaan uncle can't make Reels. He has kurti on counter, messy shop bg, no photographer, no English, no Canva skill.
DukaanReel does 1-tap: **Snap photo → auto clean bg → auto Hinglish caption → auto voice + 9:16 Reel → WhatsApp share link.**
No login, no prompt, no edit. Camera → WhatsApp. Same flow uncle already uses to send product videos.

**Target:** Lajpat/Sarojini small shopkeeper (45yo, WhatsApp-only, big buttons needed). Not tech kid.

## Why This Wins 8x
Maps to Ljubljana winners: Allivey #1 (scan→wow) + UGC Girls #3 (UGC auto). Judges already voted camera-wow + UGC. DukaanReel merges both for Bharat market. Dibbs #2 pattern (hyperlocal pain) = same: shopkeeper content pain is Gurugram hyperlocal.

## Moving Parts (6, in order)
1. **Capture** — Phone camera full-screen, 1 button `Photo Kheecho`. Gallery fallback. Output: JPEG.
2. **BG Cut** — Remove cluttered shop bg → clean PNG (400x400 product cut).
3. **Caption** — Vision understands product (red cotton kurti) → generates Hinglish sales line + price + 3 hashtags. Example: `Ye red kurti fresh hai — ₹799 only! DM karo 💛 #lajpatstyle`
4. **Voice** — Caption → Hinglish audio (tap `Suno`). 5-sec mp3.
5. **Reel Compose** — PNG centered on 3 preset scene bgs + caption text overlay + audio → 5-sec 9:16 video (1080x1920). Canvas + MediaRecorder client-side.
6. **Store + Share** — Save to store → generate public link `/r/[id]` with OG image + WhatsApp green button `WhatsApp Pe Bhejo` (sends video + link).

**Optional Agentic Twist (stretch, 45m):** `Agent Chalao` → watches Reel share → auto-replies Hinglish when customer asks `Price?` on WhatsApp link (`₹799, aaj ₹50 off`). 1 agent, 2 tools.

## System Design (High Level, No Vendor Lock)
```
[Phone PWA] → [API: bg-cut → caption → voice] → [Client: canvas reel] → [Store] → [Share Page]
```

- **Phone PWA:** Capture + Reel record + Upload. Big buttons, Hinglish default, no auth.
- **API Pipeline:** Sequential: bg-cut → caption (parallel voice). Returns text + audio URL.
- **Client Reel:** Canvas draws bg + product + text + plays audio → records 5s → blob.
- **Store:** 1 table `reels: id, caption, image_url, audio_url, video_url`. Link = permission, no user table.
- **Share:** `/r/[id]` public, OG for WhatsApp, `wa.me` share, `Open in Maps` not needed.

**Flow:** snap (1s) → processing 4s → Reel preview → Share (1 tap). Total 10 sec.

**Data:** JPEG in → PNG + caption + mp3 + webm out. All via fetch, swappable providers per block (fastest wins).

## Scope for 6hr (10:30-4:30)
- Must: 1 product, 3 preset scenes, 1 caption style, 1 voice, 1 video template, 1 share link. Hardcode shop name.
- Cut: login, payment, editor, multi-product, custom scene gen, schedule.
- Demo: Snap real product on stage → Reel plays with voice → open on 2nd phone via WhatsApp.

## Success For Uncle
- Saves ₹2000/month photographer. 10 sec vs 5 min in ChatGPT (4 apps + prompts). Uncle already shares via WhatsApp → zero new habit.

---
*Created: 2026-08-29 — For 8x Delhi hackathon, sole idea 1.*
