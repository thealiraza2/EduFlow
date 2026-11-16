/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  compress: true,
  async headers() {
    const staticCacheHeaders = [
      {
        key: "Cache-Control",
        value: "public, max-age=3600, s-maxage=86400, stale-while-revalidate=86400",
      },
    ];

    return [
      { source: "/", headers: staticCacheHeaders },
      { source: "/about", headers: staticCacheHeaders },
      { source: "/features", headers: staticCacheHeaders },
      { source: "/pricing", headers: staticCacheHeaders },
      { source: "/contact", headers: staticCacheHeaders },
      { source: "/privacy", headers: staticCacheHeaders },
      { source: "/terms", headers: staticCacheHeaders },
    ];
  },
};

export default nextConfig;
