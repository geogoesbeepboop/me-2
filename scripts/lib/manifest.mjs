/**
 * Shared manifest semantics — one implementation of "which sources exist,
 * where do they mirror, and what may hide them", used by sync-library.ts
 * (the writer), check-library.mjs (the gate), and lib/library-admin.ts
 * (the visibility flip). Drift between those three is a publishing bug,
 * so the logic lives here once.
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import matter from "gray-matter";
import { globToRegExp } from "./deny-scan.mjs";

export const HOME = os.homedir();
export const expand = (p) => (p.startsWith("~") ? path.join(HOME, p.slice(1)) : p);
export const tildify = (p) => (p.startsWith(HOME) ? `~${p.slice(HOME.length)}` : p);

export function loadManifest(root = process.cwd()) {
  const m = JSON.parse(
    fs.readFileSync(path.join(root, "config", "library.manifest.json"), "utf8")
  );
  m.private ??= [];
  m.scanAllow ??= [];
  m.deny ??= [];
  return m;
}

/** decisions/<repo-basename> collections derive from the projects registry —
 *  `repo:` frontmatter is the registry; never hardcode repo paths (AGENTS.md) */
export function adrCollections(root = process.cwd()) {
  const dir = path.join(root, "content", "projects");
  if (!fs.existsSync(dir)) return [];
  const out = [];
  for (const f of fs.readdirSync(dir).filter((f) => f.endsWith(".mdx")).sort()) {
    const { data } = matter(fs.readFileSync(path.join(dir, f), "utf8"));
    if (!data.repo) continue;
    const adrDir = path.join(data.repo, "docs", "adr");
    if (!fs.existsSync(adrDir)) continue;
    const base = path.basename(data.repo);
    out.push({
      id: `decisions/${base}`,
      label: `Decisions — ${base}`,
      root: tildify(adrDir),
      include: ["*.md"],
    });
  }
  return out;
}

export function allCollections(root, manifest) {
  return manifest.adrCollections === "auto"
    ? [...manifest.collections, ...adrCollections(root)]
    : [...manifest.collections];
}

/** expand one include pattern (path segments; `*` within a segment) */
export function expandInclude(rootAbs, pattern) {
  const segs = pattern.split("/");
  let dirs = [rootAbs];
  for (const seg of segs.slice(0, -1)) {
    const next = [];
    if (!seg.includes("*")) {
      for (const d of dirs) {
        const p = path.join(d, seg);
        if (fs.existsSync(p) && fs.statSync(p).isDirectory()) next.push(p);
      }
    } else {
      const re = globToRegExp(seg);
      for (const d of dirs) {
        for (const e of fs.readdirSync(d, { withFileTypes: true })) {
          if (e.isDirectory() && re.test(e.name)) next.push(path.join(d, e.name));
        }
      }
    }
    dirs = next;
  }
  const fileRe = globToRegExp(segs[segs.length - 1]);
  const out = [];
  for (const d of dirs) {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      if (e.isFile() && fileRe.test(e.name)) out.push(path.join(d, e.name));
    }
  }
  return out.sort();
}

export const kebab = (name) =>
  name
    .replace(/\.mdx?$/, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

/** slug from the path relative to the collection root — nested includes
 *  (portfolio/README.md vs README.md) can't collide */
export const slugFor = (rootAbs, abs) => kebab(path.relative(rootAbs, abs));

/** the in-doc privacy marker: frontmatter `site: private` or an HTML
 *  comment in the first 10 lines. Beats manifest-public; deny beats all. */
export function inDocPrivate(raw, fm) {
  if (fm.site === "private") return true;
  return raw.split("\n").slice(0, 10).some((l) => l.includes("<!-- me2: private -->"));
}
