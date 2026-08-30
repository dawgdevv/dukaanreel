import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "8x.dresses — AI Clothing Maker",
  description: "Turn a photo of a T-shirt, shirt, saree, or top into a finished product image.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    title: "8x.dresses",
    statusBarStyle: "default",
  },
  formatDetection: { telephone: false },
  openGraph: {
    title: "8x.dresses — AI Clothing Maker",
    description: "Turn a clothing photo into a finished product image.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-white antialiased">
        {/* mobile shell centered */}
        <div className="mx-auto flex min-h-screen w-full max-w-md flex-col bg-white shadow-none sm:ring-1 sm:ring-black/10">
          {children}
        </div>
      </body>
    </html>
  );
}
