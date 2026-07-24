import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

/**
 * THE SYSTEMS ARCHIVE — content graph.
 * Every MDX file is a NODE (projects | writing). Nodes declare `refs:`
 * (paths like "projects/grocery-buddy#what-broke") in frontmatter; this
 * module resolves them and computes the reverse map, so every cross-link
 * on the site is real and bidirectional. The archive grows by adding files.
 *
 * Projects carry a STAGE — "ship" (polished, done for now) or "bench"
 * (raw, still moving) — one index, tagged, instead of two sections.
 */

export type Kind = "projects" | "writing";

export type Stage = "ship" | "bench";

export interface SectionDef {
  id: string;
  title: string;
}

export interface NodeMeta {
  kind: Kind;
  slug: string;
  /** stable node path, e.g. "projects/grocery-buddy" */
  path: string;
  title: string;
  summary: string;
  /** primary date (lab nodes sort by `updated`) */
  date: string;
  sortDate: string;
  status: string;
  year?: string;
  thesis?: string;
  question?: string;
  role?: string;
  stack?: string[];
  timeline?: string;
  metrics?: { k: string; v: string }[];
  sections?: SectionDef[];
  refs: string[];
  reflection?: string;
  started?: string;
  updated?: string;
  readingTime?: number;
  /** per-project accent color (css color); tracks have defaults */
  accent?: string;
  /** short field label, e.g. "FINTECH · PAYMENTS" */
  domain?: string;
  /** projects only: "ship" = polished dossier, "bench" = raw and moving */
  stage?: Stage;
  /** projects only: absolute path of the source repo this entry distills —
   *  the registry the update-project skill reads */
  repo?: string;
  /** projects only: where a reader can verify the source — a public repo URL,
   *  or plain text when it isn't public (e.g. "private — walkthrough on request") */
  source?: string;
  /** chronological archive number, oldest = 001 */
  no: string;
}

export interface Node extends NodeMeta {
  body: string;
}

export interface ResolvedRef {
  href: string;
  kind: Kind;
  /** display tag — SHIP / BENCH / POST */
  tag: string;
  title: string;
}

const ROOT = path.join(process.cwd(), "content");
const KINDS: Kind[] = ["projects", "writing"];

function readKind(kind: Kind): Node[] {
  const dir = path.join(ROOT, kind);
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".mdx"))
    .map((file) => {
      const slug = file.replace(/\.mdx$/, "");
      const raw = fs.readFileSync(path.join(dir, file), "utf8");
      const { data, content } = matter(raw);
      const meta = data as Partial<NodeMeta>;
      const sortDate =
        (kind === "projects" && meta.updated) || meta.date || "1970-01-01";
      return {
        kind,
        slug,
        path: `${kind}/${slug}`,
        title: meta.title ?? slug,
        summary: meta.summary ?? "",
        date: meta.date ?? sortDate,
        sortDate,
        status: meta.status ?? "",
        year: meta.year,
        thesis: meta.thesis,
        question: meta.question,
        role: meta.role,
        stack: meta.stack,
        timeline: meta.timeline,
        metrics: meta.metrics,
        sections: meta.sections,
        refs: meta.refs ?? [],
        reflection: meta.reflection,
        started: meta.started,
        updated: meta.updated,
        accent: meta.accent,
        domain: meta.domain,
        stage: kind === "projects" ? (meta.stage ?? "ship") : undefined,
        repo: meta.repo,
        source: meta.source,
        readingTime:
          kind === "writing"
            ? Math.max(2, Math.round(content.split(/\s+/).length / 200))
            : undefined,
        no: "000", // assigned below, chronologically
        body: content,
      } satisfies Node;
    });
}

let cache: Node[] | null = null;

export function allNodes(): Node[] {
  // cache only in production — in dev the archive re-reads on every
  // request, so editing an entry is save → refresh, no restart
  if (cache && process.env.NODE_ENV === "production") return cache;
  const nodes = KINDS.flatMap(readKind);
  // archive numbers: oldest node = 001
  [...nodes]
    .sort((a, b) => a.sortDate.localeCompare(b.sortDate))
    .forEach((n, i) => {
      n.no = String(i + 1).padStart(3, "0");
    });
  nodes.sort((a, b) => b.sortDate.localeCompare(a.sortDate));
  cache = nodes;
  return nodes;
}

export function nodesOf(kind: Kind): Node[] {
  return allNodes().filter((n) => n.kind === kind);
}

export function getNode(kind: Kind, slug: string): Node | undefined {
  return allNodes().find((n) => n.kind === kind && n.slug === slug);
}

function findByPath(nodePath: string): Node | undefined {
  return allNodes().find((n) => n.path === nodePath);
}

/**
 * "projects/grocery-buddy#what-broke" → href + display data.
 * Anchors in frontmatter still shape the graph, but links land at the
 * top of the piece — a reference is an invitation to read the thing,
 * not a teleport into its middle.
 */
export function resolveRef(ref: string): ResolvedRef | undefined {
  const [nodePath] = ref.split("#");
  const node = findByPath(nodePath);
  if (!node) return undefined;
  return {
    href: `/${node.path}`,
    kind: node.kind,
    tag: tagOf(node),
    title: node.title,
  };
}

/** all nodes whose refs point at this node (any anchor) */
export function backlinks(nodePath: string): Node[] {
  return allNodes().filter(
    (n) =>
      n.path !== nodePath &&
      n.refs.some((r) => r === nodePath || r.startsWith(`${nodePath}#`))
  );
}

export interface MethodDoc {
  title: string;
  summary: string;
  thesis: string;
  status: string;
  metrics: { k: string; v: string }[];
  sections: SectionDef[];
  body: string;
}

/** /method — the meta-dossier; lives outside the archive graph on purpose */
export function getMethod(): MethodDoc {
  const raw = fs.readFileSync(path.join(ROOT, "method.mdx"), "utf8");
  const { data, content } = matter(raw);
  return {
    title: (data.title as string) ?? "The Method",
    summary: (data.summary as string) ?? "",
    thesis: (data.thesis as string) ?? "",
    status: (data.status as string) ?? "ALWAYS ON",
    metrics: (data.metrics as { k: string; v: string }[]) ?? [],
    sections: (data.sections as SectionDef[]) ?? [],
    body: content,
  };
}

export interface AboutDoc {
  title: string;
  headline: string;
  location: string;
  /** optional portrait under /public, e.g. "/me.jpg" — blank renders the placeholder */
  photo?: string;
  work: { org: string; role: string; span?: string }[];
  education: { school: string; degrees: string[] }[];
  interests: string[];
  body: string;
}

/** /about — the person behind the archive; lives outside the graph like /method */
export function getAbout(): AboutDoc {
  const raw = fs.readFileSync(path.join(ROOT, "about.mdx"), "utf8");
  const { data, content } = matter(raw);
  return {
    title: (data.title as string) ?? "About",
    headline: (data.headline as string) ?? "",
    location: (data.location as string) ?? "",
    photo: (data.photo as string) || undefined,
    work: (data.work as AboutDoc["work"]) ?? [],
    education: (data.education as AboutDoc["education"]) ?? [],
    interests: (data.interests as string[]) ?? [],
    body: content,
  };
}

const MONTHS = [
  "JAN", "FEB", "MAR", "APR", "MAY", "JUN",
  "JUL", "AUG", "SEP", "OCT", "NOV", "DEC",
];

/** "2026-02-10" → "FEB 2026" */
export function stamp(iso: string): string {
  const [y, m] = iso.split("-");
  return `${MONTHS[Number(m) - 1]} ${y}`;
}

/** "2026-02-10" → "2026.02.10" */
export function fullStamp(iso: string): string {
  return iso.replaceAll("-", ".");
}

/** index/cross-link tag — projects are tagged by stage, not by section */
export function tagOf(node: Pick<NodeMeta, "kind" | "stage">): string {
  if (node.kind === "writing") return "POST";
  return node.stage === "bench" ? "BENCH" : "SHIP";
}

/** track-level fallback accents; projects override via frontmatter `accent` */
export const KIND_ACCENT: Record<Kind, string> = {
  projects: "var(--color-ember)",
  writing: "var(--color-post)",
};

export function accentOf(node: NodeMeta): string {
  return node.accent ?? KIND_ACCENT[node.kind];
}
