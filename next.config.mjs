/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      // This tells Next.js to trust the IP for data submissions
      allowedOrigins: ['192.168.56.1:3000', 'localhost:3000'],
    },
  },
};

export default nextConfig;