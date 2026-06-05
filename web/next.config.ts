import type { NextConfig } from "next";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://formality.life";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      { source: "/api/auth/:path*", destination: `${API_URL}/api/auth/:path*` },
      { source: "/auth/:path*", destination: `${API_URL}/auth/:path*` },
      { source: "/me", destination: `${API_URL}/me` },
      { source: "/me/:path*", destination: `${API_URL}/me/:path*` },
      { source: "/images/:path*", destination: `${API_URL}/images/:path*` },
      { source: "/i/:path*", destination: `${API_URL}/i/:path*` },
      { source: "/upload", destination: `${API_URL}/upload` },
      { source: "/admin/:path*", destination: `${API_URL}/admin/:path*` },
    ];
  },
};

export default nextConfig;
