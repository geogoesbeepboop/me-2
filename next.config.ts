import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // the fleet's recorded snapshot must ship with the deployed functions —
  // the homepage and the ops room read it when ~/.claude isn't there
  outputFileTracingIncludes: {
    "/": ["./data/**"],
    "/v2/ops": ["./data/**"],
    "/api/ops": ["./data/**"],
    // dossiers read the filed report for their agent strip (revalidates 15m)
    "/projects/[slug]": ["./data/**"],
  },
  async redirects() {
    return [
      // work + lab collapsed into /projects (2026-06) — old URLs stay good
      { source: "/work", destination: "/projects", permanent: true },
      { source: "/work/:slug", destination: "/projects/:slug", permanent: true },
      { source: "/lab", destination: "/projects", permanent: true },
      { source: "/lab/:slug", destination: "/projects/:slug", permanent: true },
      // the city graduated to the front door (2026-06): /v2 → / (ops stays)
      { source: "/v2", destination: "/", permanent: true },
      { source: "/landing5", destination: "/", permanent: false },
    ];
  },
};

export default nextConfig;
