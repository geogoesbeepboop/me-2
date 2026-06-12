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
  };
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
