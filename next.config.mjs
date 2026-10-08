/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true, // ✅ Global Fix: Next.js local server image download nahi karega, browser direct CDN se load karega!
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.ufs.sh",
      },
      {
        protocol: "https",
        hostname: "utfs.io",
      },
      {
        protocol: "https",
        hostname: "img.clerk.com",
      },
      {
        protocol: "https",
        hostname: "images.pexels.com",
      },
    ],
  },
};

export default nextConfig;