import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    // work + lab collapsed into /projects (2026-06) — old URLs stay good
    return [
      { source: "/work", destination: "/projects", permanent: true },
      { source: "/work/:slug", destination: "/projects/:slug", permanent: true },
      { source: "/lab", destination: "/projects", permanent: true },
      { source: "/lab/:slug", destination: "/projects/:slug", permanent: true },
    ];
  },
};

export default nextConfig;
