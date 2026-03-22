import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    // Allow quality prop used by next/image (e.g. ProductImage default 85)
    qualities: [75, 85, 90],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: '**',
      },
    ],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  // Enable static optimization
  output: 'standalone',
  // Compress HTML, CSS, and JavaScript
  compress: true,
  // Generate source maps for better debugging (disable in production if needed)
  productionBrowserSourceMaps: false,
};

export default nextConfig;
