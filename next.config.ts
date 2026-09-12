import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "blog.playstation.com",
      },
      {
        protocol: "https",
        hostname: "news.xbox.com",
      },
      {
        protocol: "https",
        hostname: "www.nintendolife.com",
      },
      {
        protocol: "https",
        hostname: "assetsio.reedpopcdn.com",
      },
      {
        protocol: "https",
        hostname: "cdn.vox-cdn.com",
      },
      {
        protocol: "https",
        hostname: "cdn.mos.cms.futurecdn.net",
      },
    ],
  },
};

export default nextConfig;
