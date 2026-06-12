import {
  accentOf,
  allNodes,
  getAbout,
  getMethod,
  tagOf,
  type Node,
} from "@/lib/content";

/**
 * Slim, serializable view of the archive for the (x) landings.
 * Everything here is real frontmatter — the experiments restyle the
 * data, they never invent it.
 */
export interface SlimNode {
  no: string;
  kind: "projects" | "writing";
  slug: string;
  href: string;
  title: string;
  summary: string;
  /** thesis ?? question ?? summary — the one-liner of record */
  line: string;
  tag: string; // SHIP | BENCH | POST
  status: string;
  live: boolean;
  accent: string;
  domain?: string;
  date: string;
  updated?: string;
  started?: string;
  year?: string;
  role?: string;
  stack?: string[];
  timeline?: string;
  metrics: { k: string; v: string }[];
  readingTime?: number;
  /** ref targets as node paths (anchors stripped) — the real graph */
  refs: string[];
}

function slim(n: Node): SlimNode {
  return {
    no: n.no,
    kind: n.kind,
    slug: n.slug,
    href: `/${n.path}`,
    title: n.title,
    summary: n.summary,
    line: n.thesis ?? n.question ?? n.summary,
    tag: tagOf(n),
    status: n.status,
    live: n.status === "LIVE",
    accent: accentOf(n),
    domain: n.domain,
    date: n.date,
    updated: n.updated,
    started: n.started,
    year: n.year,
    role: n.role,
    stack: n.stack,
    timeline: n.timeline,
    metrics: n.metrics ?? [],
    readingTime: n.readingTime,
    refs: [...new Set(n.refs.map((r) => r.split("#")[0]))],
  };
}

/** undirected, deduped edge list over `nodes` (indices), from real refs */
export function refEdges(nodes: SlimNode[]): [number, number][] {
  const byPath = new Map<string, number>(
    nodes.map((n, i) => [`${n.kind}/${n.slug}`, i])
  );
  const seen = new Set<string>();
  const edges: [number, number][] = [];
  nodes.forEach((n, i) => {
    n.refs.forEach((p) => {
      const j = byPath.get(p);
      if (j === undefined || j === i) return;
      const key = `${Math.min(i, j)}-${Math.max(i, j)}`;
      if (!seen.has(key)) {
        seen.add(key);
        edges.push([Math.min(i, j), Math.max(i, j)]);
      }
    });
  });
  return edges;
}

export function archive() {
  const nodes = allNodes().map(slim);
  return {
    nodes,
    projects: nodes.filter((n) => n.kind === "projects"),
    writing: nodes.filter((n) => n.kind === "writing"),
    about: getAbout(),
    method: getMethod(),
  };
}
