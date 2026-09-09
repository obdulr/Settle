import type { NextConfig } from "next";
import path from "path";

// Cloudflare Pages static export is enabled when CF_PAGES=1 or OUTPUT_EXPORT=1.
// Otherwise, keep the existing standalone config for Render.
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
  ...(isStaticExport
    ? {
        // Static export for Cloudflare Pages.
        // redirects() and headers() are unsupported with output: "export",
        // so those are handled via public/_redirects and public/_headers instead.
        output: "export" as const,
        images: { unoptimized: true },
        trailingSlash: true,
      }
    : {
        // Standalone mode for Render (existing behavior).
        output: "standalone" as const,
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
