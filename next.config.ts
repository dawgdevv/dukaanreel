import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Cloudflare Quick Tunnels proxy the browser through a *.trycloudflare.com origin.
  // Next dev otherwise serves HTML but blocks the client chunks, preventing hydration.
  allowedDevOrigins: ["*.trycloudflare.com"],
};

export default nextConfig;
