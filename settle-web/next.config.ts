import type { NextConfig } from "next";
import path from "path";

// Static export for Cloudflare Pages (legacy, kept for reference).
// OpenNext for Cloudflare Workers is the primary deploy target and uses
// the normal standalone build — no output: "export" needed.
const isStaticExport =
  process.env.CF_PAGES === "1" || process.env.OUTPUT_EXPORT === "1";

const nextConfig: NextConfig = {
  outputFileTracingRoot: path.join(__dirname, '..'),
  turbopack: {
    root: path.join(__dirname, '..'),
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  },
  // OpenNext for Cloudflare Workers uses the default standalone build.
  // Only switch to static export if explicitly requested (legacy Pages path).
  ...(isStaticExport
    ? {
        output: "export" as const,
        images: { unoptimized: true },
        trailingSlash: true,
      }
    : {
        async redirects() {
          return [
            {
              source: '/portal/leads',
              destination: '/portal',
              permanent: true,
            },
          ];
        },
        async headers() {
          return [{
            source: '/(.*)',
            headers: [
              { key: 'X-Content-Type-Options', value: 'nosniff' },
              { key: 'X-Frame-Options', value: 'DENY' },
              { key: 'X-XSS-Protection', value: '1; mode=block' },
              { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
              { key: 'Permissions-Policy', value: 'geolocation=(), microphone=(), camera=()' },
            ],
          }];
        },
      }),
};

export default nextConfig;
