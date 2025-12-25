import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'i.gr-assets.com',
      },
      {
        protocol: 'https',
        hostname: 'images.gr-assets.com',
      },
      {
        protocol: 'https',
        hostname: '**.goodreads.com',
      },
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
};

export default nextConfig;
