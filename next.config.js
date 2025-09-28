/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['supabase.co'],
  },
  experimental: {
    serverComponentsExternalPackages: ['tesseract.js'],
  },
};

module.exports = nextConfig;
