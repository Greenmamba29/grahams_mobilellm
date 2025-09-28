/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['supabase.co'],
  },
  experimental: {
    serverComponentsExternalPackages: ['tesseract.js', 'pdf-parse', 'mammoth'],
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals.push('tesseract.js');
    }
    return config;
  },
};

module.exports = nextConfig;
