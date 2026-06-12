import type { Metadata } from "next";
import Hero2 from "@/components/landing2/Hero2";
import MethodBand from "@/components/landing2/MethodBand";
import MegaIndex, { type MegaRowData } from "@/components/landing2/MegaIndex";
import SignalTicker from "@/components/site/SignalTicker";
import {
  accentOf,
  allNodes,
  getAbout,
  getMethod,
  stamp,
  tagOf,
} from "@/lib/content";

/**
 * LANDING — PROPOSAL Nº2 ("the archive, alive").
 * A draft route for comparison against "/", not linked from the nav
 * and not indexed. The thesis: don't decorate the landing — render
 * the content model itself. The refs graph is the hero, the index is
 * set at poster scale, and every edge on the page is a real
 * frontmatter line.
 */

export const metadata: Metadata = {
  title: "Landing — proposal Nº2",
  robots: { index: false },
};

export default function Landing2() {
  const nodes = allNodes();
  const about = getAbout();
  const method = getMethod();

  // the graph — undirected, deduped, computed from real refs only
  const indexByPath = new Map(nodes.map((n, i) => [n.path, i] as const));
  const seen = new Set<string>();
  const edges: [number, number][] = [];
  nodes.forEach((n, i) => {
    n.refs.forEach((ref) => {
      const j = indexByPath.get(ref.split("#")[0]);
      if (j === undefined || j === i) return;
      const key = `${Math.min(i, j)}-${Math.max(i, j)}`;
      if (!seen.has(key)) {
        seen.add(key);
        edges.push([Math.min(i, j), Math.max(i, j)]);
      }
    });
  });

  const graphNodes = nodes.map((n) => ({
    no: `N°${n.no}`,
    title: n.title,
    path: n.path,
    accent: accentOf(n),
    status: n.status,
    live: n.status === "LIVE",
    tag: tagOf(n),
    blurb: n.thesis ?? n.question ?? n.summary,
  }));

  const rows: MegaRowData[] = nodes.map((n) => ({
    no: `N°${n.no}`,
    tag: tagOf(n),
    title: n.title,
    path: n.path,
    accent: accentOf(n),
    status: n.status,
    live: n.status === "LIVE",
    primaryMeta:
      n.kind === "projects"
        ? n.updated
          ? `upd ${stamp(n.updated)}`
          : (n.year ?? stamp(n.date))
        : stamp(n.date),
    thesis: n.thesis ?? n.question ?? n.summary,
    refs: [...new Set(n.refs.map((r) => r.split("#")[0]))]
      .map((p) => {
        const j = indexByPath.get(p);
        if (j === undefined) return null;
        const m = nodes[j];
        return {
          no: `N°${m.no}`,
          title: m.title,
          accent: accentOf(m),
          path: m.path,
        };
      })
      .filter((r): r is NonNullable<typeof r> => r !== null),
  }));

  const signal = [
    {
      no: "N°000",
      tag: "META",
      title: method.title,
      status: method.status,
      live: false,
    },
    ...nodes.map((n) => ({
      no: `N°${n.no}`,
      tag: tagOf(n),
      title: n.title,
      status: n.status,
      live: n.status === "LIVE",
    })),
  ];

  return (
    <>
      <Hero2
        nodes={graphNodes}
        edges={edges}
        aboutLine={`Engineer, ${about.location.replace(", CA", "")}`}
      />
      <MethodBand
        title={method.title}
        thesis={method.thesis}
        status={method.status}
      />
      <MegaIndex rows={rows} />
      <SignalTicker items={signal} />
    </>
  );
}
