/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  eslint: {
    // ESLint runs as a separate CI step; don't block the build with it
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
