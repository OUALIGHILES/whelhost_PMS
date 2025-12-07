/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  productionBrowserSourceMaps: false, // Disable source maps in production to avoid parsing issues
  serverExternalPackages: ["@supabase/supabase-js", "@supabase/ssr"],
  experimental: {
    instrumentationHook: true,
    // Try to resolve source map issues with external packages
    serverComponentsExternalPackages: ["@supabase/ssr"],
  },
  async headers() {
    return [
      {
        // Apply security headers to all routes
        source: "/(.*)",
        headers: [
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
        ],
      },
    ];
  }
}

export default nextConfig
