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
        // DESTINATION: Proxy to Nginx Unified Gateway (Dev Mode)
        // This ensures identical routing logic (Real-time lanes, rewrites) as Prod
        destination: `${process.env.API_PROXY_URL || 'http://localhost:80'}/api/:path*`,
      },
    ];
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '500mb',
    },
    // Override default 10MB limit for dev server proxy/middleware
    middlewareClientMaxBodySize: '500mb',
    proxyTimeout: 300000,
  },
};

export default nextConfig;
