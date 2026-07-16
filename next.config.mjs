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
};

export default nextConfig;
