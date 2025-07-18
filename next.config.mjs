/** @type {import('next').NextConfig} */
const nextConfig = {
  // Remove ignoreDuringBuilds to enforce code quality
  eslint: {
    // ESLint will now run during builds
  },
  typescript: {
    // TypeScript errors will now fail the build
  },
};

export default nextConfig;