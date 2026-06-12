import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // the fleet's recorded snapshot must ship with the deployed functions —
  // /v2 reads it at request time when ~/.claude isn't there to measure
  outputFileTracingIncludes: {
    "/v2": ["./data/**"],
    "/v2/ops": ["./data/**"],
    "/api/ops": ["./data/**"],
  },
  async redirects() {
    return [
      // work + lab collapsed into /projects (2026-06) — old URLs stay good
      { source: "/work", destination: "/projects", permanent: true },
      { source: "/work/:slug", destination: "/projects/:slug", permanent: true },
      { source: "/lab", destination: "/projects", permanent: true },
      { source: "/lab/:slug", destination: "/projects/:slug", permanent: true },
      // landing Nº5 graduated into v2 — the city (2026-06)
      { source: "/landing5", destination: "/v2", permanent: false },
    ];
  },
};

export default nextConfig;
