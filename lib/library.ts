import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

/**
 * THE LIBRARY — read side of the mirrored-document stacks.
 * content/library/ holds committed mirrors written by scripts/sync-library.ts
 * (provenance frontmatter + verbatim body). This module only reads: the
 * archive graph (lib/content.ts) stays the curated seven-entry collection;
 * the library is the raw shelf behind it. Library docs carry NO archive
 * numbers and are invisible to allNodes()/backlinks — links may point INTO
 * the library, never out of it into curated refs.
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

export interface LibraryGroup {
  id: string;
  label: string;
  docs: LibraryDoc[];
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

/** collections in manifest order, decisions/* after, each internally sorted —
 *  decision records read in ADR order, everything else freshest-first */
export function libraryGroups(): LibraryGroup[] {
  const docs = allLibraryDocs();
  let manifestOrder: { id: string; label: string }[] = [];
  try {
    const m = JSON.parse(fs.readFileSync(MANIFEST, "utf8")) as {
      collections: { id: string; label: string }[];
    };
    manifestOrder = m.collections;
  } catch {
    /* deployed without the manifest → derive groups from the docs alone */
  }

  const byId = new Map<string, LibraryDoc[]>();
  for (const d of docs) {
    (byId.get(d.collection) ?? byId.set(d.collection, []).get(d.collection)!).push(d);
  }

  const groups: LibraryGroup[] = [];
  for (const { id, label } of manifestOrder) {
    const g = byId.get(id);
    if (g) {
      groups.push({ id, label, docs: sortDocs(id, g) });
      byId.delete(id);
    }
  }
  for (const id of [...byId.keys()].sort()) {
    const label = id.startsWith("decisions/")
      ? `Decisions — ${id.slice("decisions/".length)}`
      : id;
    groups.push({ id, label, docs: sortDocs(id, byId.get(id)!) });
  }
  return groups;
}

function sortDocs(id: string, docs: LibraryDoc[]): LibraryDoc[] {
  return id.startsWith("decisions/")
    ? [...docs].sort((a, b) => a.slug.localeCompare(b.slug))
    : [...docs].sort((a, b) => b.sourceMtime.localeCompare(a.sourceMtime));
}

/** this repo's mirrored ADRs — the dossier's decision-notes strip */
export function decisionsFor(repoPath: string): LibraryDoc[] {
  const id = `decisions/${path.basename(repoPath)}`;
  return sortDocs(id, allLibraryDocs().filter((d) => d.collection === id));
}
