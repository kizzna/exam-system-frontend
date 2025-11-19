/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone', // Enable standalone mode for PM2 cluster
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
        destination: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/:path*`,
      },
    ];
  },
};

export default nextConfig;
