/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone', // Enable standalone mode for PM2 cluster

  // Allow development access from private network
  // Allows both hostname and IP address access (with and without port)
  allowedDevOrigins: [
    'omr-frontend-dev.gt:3000',
    'omr-frontend-dev.gt',
    '10.10.24.193:3000',
    '10.10.24.193',
  ],

  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
      },
      {
        protocol: 'http',
        hostname: 'gt-omr-api-1',
      },
      {
        protocol: 'http',
        hostname: 'gt-omr-api-1.gt',
      },
    ],
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL || 'http://gt-omr-api-1.gt:8000'}/:path*`,
      },
    ];
  },
};

export default nextConfig;
