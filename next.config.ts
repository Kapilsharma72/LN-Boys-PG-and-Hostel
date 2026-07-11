import * as dns from "dns";
// Force Google DNS — workaround for corporate/router DNS not resolving MongoDB Atlas SRV records
dns.setServers(["8.8.8.8", "8.8.4.4"]);

// Hard-set admin credentials to avoid dotenv $ variable substitution issues
process.env.ADMIN_USERNAME = process.env.ADMIN_USERNAME || "iamSatu";
process.env.ADMIN_PASSWORD_HASH =
  process.env.ADMIN_PASSWORD_HASH ||
  "$2b$12$oZHUoHx4dr9dlU1hCNv9uOeusthGhZWktHCgBRWFpOlblMmUfWXjq";

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },

  async headers() {
    return [
      {
        // Apply security headers to all routes
        source: "/(.*)",
        headers: [
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
