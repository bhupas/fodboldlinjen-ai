/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  // Suppress webpack cache serialization warnings for large dependencies
  webpack: (config, { dev }) => {
    if (dev) {
      config.infrastructureLogging = {
        level: 'error', // Only show errors in development, not warnings
      };
    }
    return config;
  },
};

export default nextConfig;
