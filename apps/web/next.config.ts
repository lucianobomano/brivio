import { withVisualEdit as withBefreeVisualEdit } from 'befree-visual-edit/next';

import type { NextConfig } from "next";

const securityHeaders = [
  // Prevent clickjacking by disallowing iframes from other origins
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  // Prevent MIME-type sniffing
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  // Control referrer information
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  // Disable browser features not needed
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  // Enable HSTS (only active in production with HTTPS)
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  // Basic XSS protection for older browsers
  { key: 'X-XSS-Protection', value: '1; mode=block' },
]

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        // Apply security headers to all routes
        source: '/(.*)',
        headers: securityHeaders,
      },
    ]
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'rswfzywrpzscnkcisniu.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'i.pravatar.cc',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'avatar.iran.liara.run',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'api.dicebear.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
  experimental: {
    serverActions: {
      // SECURITY: Reduced from 200mb to prevent DoS via large payloads
      bodySizeLimit: '10mb',
    },
    optimizePackageImports: ['lucide-react', 'react-icons'],
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  turbopack: {},
};

export default withBefreeVisualEdit(nextConfig);
