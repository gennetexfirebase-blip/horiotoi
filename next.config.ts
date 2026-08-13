import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    unoptimized: true,
    remotePatterns: [
      { protocol: "https", hostname: "web.archive.org" },
      { protocol: "http", hostname: "web.archive.org" },
      { protocol: "https", hostname: "wybojuacuhtgotwmmwbb.supabase.co" },
      { protocol: "https", hostname: "img.clerk.com" },
    ],
  },
};

export default nextConfig;
