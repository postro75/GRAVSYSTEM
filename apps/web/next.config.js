/** @type {import('next').NextConfig} */
const isElectron = process.env.ELECTRON_BUILD === '1';

const nextConfig = {
  output: isElectron ? 'export' : 'standalone',
  distDir: isElectron ? 'dist' : '.next',
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
