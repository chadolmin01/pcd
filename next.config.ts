import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  reactStrictMode: true,

  // Optimize barrel imports for better performance (lucide-react: -800ms cold start)
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
}

export default nextConfig
