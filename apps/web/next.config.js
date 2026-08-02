/** @type {import('next').NextConfig} */
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  transpilePackages: ['@gravsystem/core'],
  async rewrites() {
    return [
      {
        source: '/api/health',
        destination: `${process.env.API_URL || 'http://localhost:8000'}/health`,
      },
      {
        source: '/api/schema/:path*',
        destination: `${process.env.API_URL || 'http://localhost:8000'}/api/schema/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
