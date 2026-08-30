This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Model try-on and FFmpeg reels

For real model try-on output, configure `OPENAI_API_KEY` and leave `DEMO_MODE` unset or set it to `false`. The app selects a fixed model template from `lib/model-templates.ts`, sends the garment and template image to the server-side try-on step, and then uses FFmpeg.wasm in the browser to turn the dressed still image into a five-second MP4 with a slow zoom.

Optional template overrides:

```text
MODEL_TEMPLATE_MALE_URL=https://your-public-assets.example/male-shirt.jpg
MODEL_TEMPLATE_FEMALE_URL=https://your-public-assets.example/female-ethnic.jpg
MODEL_TEMPLATE_FEMALE_DRESS_URL=https://your-public-assets.example/female-dress.jpg
```

Use owned or properly licensed model images. The default remote templates are development fallbacks; replace them before production.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
