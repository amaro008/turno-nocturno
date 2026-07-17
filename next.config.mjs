/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // El pipeline de autoría (Python) nunca se incluye en el bundle de Vercel.
  outputFileTracingExcludes: {
    '*': ['./tools/autoria/**', './content/**'],
  },
  experimental: {
    serverComponentsExternalPackages: ['@anthropic-ai/sdk'],
  },
  images: {
    remotePatterns: [{ protocol: 'https', hostname: '*.supabase.co' }],
  },
};

export default nextConfig;
