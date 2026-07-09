import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
// shared with the sync/gate scripts — one glob dialect everywhere
import { globToRegExp } from "../scripts/lib/deny-scan.mjs";

/**
 * THE LIBRARY — read side of the mirrored-document stacks.
 * content/library/ holds committed mirrors written by scripts/sync-library.ts
 * (provenance frontmatter + verbatim body). This module only reads: the
 * archive graph (lib/content.ts) stays the curated seven-entry collection;
 * the library is the raw shelf behind it. Library docs carry NO archive
 * numbers and are invisible to allNodes()/backlinks — links may point INTO
 * the library, never out of it into curated refs.
 *
 * Presentation (2026-07-09): the manifest is also the shelf plan —
 * `display: "unlisted"` keeps a collection mirrored + searchable but off
 * the index page; `series` folds versioned lenses into one entry with a
 * history trail; `featured` is the START HERE strip.
 */

export interface LibraryDoc {
  /** file slug, e.g. "ideas-3-0" or "0009-eval-harness-…" */
  slug: string;
  /** manifest collection id, e.g. "hackathons" or "decisions/jim-agent" */
  collection: string;
  /** route segments under /library, e.g. "hackathons/ideas-3-0" */
  urlPath: string;
  title: string;
  summary: string;
  /** ~-relative source path — where the doc actually lives */
  source: string;
  sourceMtime: string;
  sourceCommit?: string;
  /** date the mirror last changed (not last sync run) */
  syncedAt: string;
  /** folded source metadata — ADRs carry `status` here */
  status?: string;
  body: string;
}

export interface ShelfEntry {
  doc: LibraryDoc;
  /** present when this entry fronts a versioned series — doc is the
   *  current lens, history the earlier ones, oldest first */
  series?: { label: string; history: LibraryDoc[] };
}

export interface Shelf {
  id: string;
  label: string;
  entries: ShelfEntry[];
}

export interface DecisionShelf {
  /** repo basename, e.g. "jim-agent" */
  repo: string;
  docs: LibraryDoc[];
}

interface ManifestCollection {
  id: string;
  label: string;
  display?: "listed" | "unlisted";
  series?: { label: string; members: string[] }[];
}
interface ManifestView {
  featured: string[];
  collections: ManifestCollection[];
}

const LIB_DIR = path.join(process.cwd(), "content", "library");
const MANIFEST = path.join(process.cwd(), "config", "library.manifest.json");

let cache: LibraryDoc[] | null = null;

export function allLibraryDocs(): LibraryDoc[] {
  if (cache && process.env.NODE_ENV === "production") return cache;
  if (!fs.existsSync(LIB_DIR)) return [];
  const docs: LibraryDoc[] = [];
  const walk = (dir: string) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) {
        walk(p);
        continue;
      }
      if (!e.name.endsWith(".md")) continue;
      const { data, content } = matter(fs.readFileSync(p, "utf8"));
      const rel = path.relative(LIB_DIR, p).replace(/\.md$/, "");
      const meta = (data.sourceMeta ?? {}) as Record<string, unknown>;
      docs.push({
        slug: path.basename(rel),
        collection: String(data.collection ?? path.dirname(rel)),
        urlPath: rel,
        title: String(data.title ?? path.basename(rel)),
        summary: String(data.summary ?? ""),
        source: String(data.source ?? ""),
        sourceMtime: String(data.sourceMtime ?? ""),
        sourceCommit: data.sourceCommit ? String(data.sourceCommit) : undefined,
        syncedAt: String(data.syncedAt ?? ""),
        status: meta.status ? String(meta.status) : undefined,
        body: content,
      });
    }
  };
  walk(LIB_DIR);
  cache = docs;
  return docs;
}

export function getLibraryDoc(segments: string[]): LibraryDoc | undefined {
  const urlPath = segments.join("/");
  return allLibraryDocs().find((d) => d.urlPath === urlPath);
}

function readManifest(): ManifestView {
  try {
    const m = JSON.parse(fs.readFileSync(MANIFEST, "utf8")) as Partial<ManifestView>;
    return { featured: m.featured ?? [], collections: m.collections ?? [] };
  } catch {
    /* deployed without the manifest → no shelves, docs still resolvable */
    return { featured: [], collections: [] };
  }
}

/** the START HERE strip — manifest order, mirrored docs only */
export function featuredDocs(): LibraryDoc[] {
  const docs = allLibraryDocs();
  return readManifest()
    .featured.map((src) => docs.find((d) => d.source === src))
    .filter((d): d is LibraryDoc => d !== undefined);
}

/** listed collections in manifest order, series folded, freshest first */
export function libraryShelves(): Shelf[] {
  const docs = allLibraryDocs();
  const shelves: Shelf[] = [];
  for (const col of readManifest().collections) {
    if (col.display === "unlisted") continue;
    let pool = docs.filter((d) => d.collection === col.id);
    if (pool.length === 0) continue;
    const entries: ShelfEntry[] = [];
    for (const s of col.series ?? []) {
      const res = s.members.map((m) => globToRegExp(m) as RegExp);
      const members = pool.filter((d) =>
        res.some((re) => re.test(path.basename(d.source)))
      );
      if (members.length === 0) continue;
      pool = pool.filter((d) => !members.includes(d));
      const ordered = [...members].sort((a, b) => a.sourceMtime.localeCompare(b.sourceMtime));
      const current = ordered[ordered.length - 1];
      entries.push({ doc: current, series: { label: s.label, history: ordered.slice(0, -1) } });
    }
    entries.push(...pool.map((doc) => ({ doc })));
    entries.sort((a, b) => b.doc.sourceMtime.localeCompare(a.doc.sourceMtime));
    shelves.push({ id: col.id, label: col.label, entries });
  }
  return shelves;
}

/** every decisions/<repo> group, repo-alphabetical, docs in ADR order —
 *  the /library page renders these as ONE collapsed shelf */
export function decisionShelves(): DecisionShelf[] {
  const byRepo = new Map<string, LibraryDoc[]>();
  for (const d of allLibraryDocs()) {
    if (!d.collection.startsWith("decisions/")) continue;
    const repo = d.collection.slice("decisions/".length);
    (byRepo.get(repo) ?? byRepo.set(repo, []).get(repo)!).push(d);
  }
  return [...byRepo.keys()].sort().map((repo) => ({
    repo,
    docs: byRepo.get(repo)!.sort((a, b) => a.slug.localeCompare(b.slug)),
  }));
}

/** docs mirrored but deliberately off the shelf — the deep stacks count */
export function unlistedCount(): number {
  const unlistedIds = new Set(
    readManifest()
      .collections.filter((c) => c.display === "unlisted")
      .map((c) => c.id)
  );
  return allLibraryDocs().filter((d) => unlistedIds.has(d.collection)).length;
}

/** library churn grouped by sync day, newest first — the shift log's ⇄
 *  rows (structurally a MirrorDay[]; the app layer owns that type) */
export function libraryMirrorDays(limit = 14) {
  const byDay = new Map<string, { title: string; urlPath: string; source: string }[]>();
  for (const d of allLibraryDocs()) {
    if (!d.syncedAt) continue;
    (byDay.get(d.syncedAt) ?? byDay.set(d.syncedAt, []).get(d.syncedAt)!).push({
      title: d.title,
      urlPath: d.urlPath,
      source: d.source,
    });
  }
  return [...byDay.keys()]
    .sort()
    .reverse()
    .slice(0, limit)
    .map((day) => ({
      day,
      docs: byDay.get(day)!.sort((a, b) => a.title.localeCompare(b.title)),
    }));
}

/** this repo's mirrored ADRs — the dossier's decision-notes strip */
export function decisionsFor(repoPath: string): LibraryDoc[] {
  const id = `decisions/${path.basename(repoPath)}`;
  return allLibraryDocs()
    .filter((d) => d.collection === id)
    .sort((a, b) => a.slug.localeCompare(b.slug));
}
