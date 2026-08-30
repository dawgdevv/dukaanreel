import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "DukaanReel Photo Kheecho Reel Banao",
  description:
    "Lajpat uncle snaps product 10 sec Hinglish Reel WhatsApp sale. Photo kheecho, reel banao, WhatsApp pe bhejo!",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    title: "DukaanReel",
    statusBarStyle: "default",
  },
  formatDetection: { telephone: false },
  openGraph: {
    title: "DukaanReel Photo Kheecho Reel Banao",
    description: "Photo kheecho, reel banao, WhatsApp pe bhejo!",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#16a34a",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="hi" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-white antialiased">
        {/* mobile shell centered */}
        <div className="mx-auto flex min-h-screen w-full max-w-md flex-col bg-white shadow-none sm:shadow-lg sm:ring-1 sm:ring-zinc-200">
          {children}
        </div>
      </body>
    </html>
  );
}
