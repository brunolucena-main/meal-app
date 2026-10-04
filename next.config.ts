import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep the dev badge away from the sidebar's theme switcher.
  devIndicators: { position: "bottom-right" },
  experimental: {
    // Backups are restored through a server action; years of logs can pass the 1 MB default.
    serverActions: { bodySizeLimit: "25mb" },
  },
};

export default nextConfig;
