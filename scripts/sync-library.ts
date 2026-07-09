#!/usr/bin/env tsx
/**
 * THE LIBRARY SYNC — deterministic mirror of the document sprawl.
 *
 *   npx tsx scripts/sync-library.ts            # mirror everything the manifest allows
 *   npx tsx scripts/sync-library.ts --check    # exit 1 if a run would change anything
 *   npx tsx scripts/sync-library.ts --only hackathons
 *
 * Sources stay where they live (~/dev/hackathons, per-repo docs/adr, the
 * harness docs); this script mirrors them into content/library/ with
 * generated provenance frontmatter. No LLM anywhere: mirroring is a copy,
 * not a judgment. Visibility is decided by config/library.manifest.json
 * (deny > in-doc marker > private[] > public) plus the deny-scan — an
 * excluded doc never enters content/library, so it can never enter git or
 * a deploy bundle. Idempotent: a second run with unchanged sources is a
 * zero-diff (mirrors rewrite only when body hash, provenance commit, or
 * derived title/summary actually moved; `syncedAt` records the last CHANGE).
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import crypto from "node:crypto";
import { execFileSync } from "node:child_process";
import matter from "gray-matter";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore — plain-JS module shared with check-library.mjs
import { scanDoc, globToRegExp } from "./lib/deny-scan.mjs";

interface Collection {
  id: string;
  label: string;
  root: string;
  include: string[];
}
interface Manifest {
  collections: Collection[];
  adrCollections?: "auto";
  deny: string[];
  private: string[];
  scanAllow: string[];
}

const HOME = os.homedir();
const ROOT = process.cwd();
const LIB_DIR = process.env.LIBRARY_DIR ?? path.join(ROOT, "content", "library");
const MANIFEST_PATH = path.join(ROOT, "config", "library.manifest.json");

const CHECK = process.argv.includes("--check");
const onlyIx = process.argv.indexOf("--only");
const ONLY = onlyIx > -1 ? process.argv[onlyIx + 1] : undefined;

const expand = (p: string) => (p.startsWith("~") ? path.join(HOME, p.slice(1)) : p);
const tildify = (p: string) => (p.startsWith(HOME) ? `~${p.slice(HOME.length)}` : p);

function loadManifest(): Manifest {
  const m = JSON.parse(fs.readFileSync(MANIFEST_PATH, "utf8")) as Manifest;
  m.private ??= [];
  m.scanAllow ??= [];
  m.deny ??= [];
  return m;
}

/** decisions/<repo-basename> collections derive from the projects registry —
 *  `repo:` frontmatter is the registry; never hardcode repo paths (AGENTS.md) */
function adrCollections(): Collection[] {
  const dir = path.join(ROOT, "content", "projects");
  if (!fs.existsSync(dir)) return [];
  const out: Collection[] = [];
  for (const f of fs.readdirSync(dir).filter((f) => f.endsWith(".mdx")).sort()) {
    const { data } = matter(fs.readFileSync(path.join(dir, f), "utf8"));
    const repo = data.repo as string | undefined;
    if (!repo) continue;
    const adrDir = path.join(repo, "docs", "adr");
    if (!fs.existsSync(adrDir)) continue;
    const base = path.basename(repo);
    out.push({
      id: `decisions/${base}`,
      label: `Decisions — ${base}`,
      root: tildify(adrDir),
      include: ["*.md"],
    });
  }
  return out;
}

/** expand one include pattern (segments; `*` within a segment) under root */
function expandInclude(rootAbs: string, pattern: string): string[] {
  const segs = pattern.split("/");
  let dirs = [rootAbs];
  for (const seg of segs.slice(0, -1)) {
    const next: string[] = [];
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
  const out: string[] = [];
  for (const d of dirs) {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      if (e.isFile() && fileRe.test(e.name)) out.push(path.join(d, e.name));
    }
  }
  return out.sort();
}

const kebab = (name: string) =>
  name
    .replace(/\.mdx?$/, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

/** first heading outside a code fence — the doc's own title */
function firstHeading(body: string): string | undefined {
  let fence = false;
  for (const line of body.split("\n")) {
    if (line.startsWith("```")) {
      fence = !fence;
      continue;
    }
    if (fence) continue;
    const m = line.match(/^#\s+(.+)/);
    if (m) return m[1].trim();
  }
  return undefined;
}

const stripMd = (s: string) =>
  s
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/[*_`]/g, "")
    .trim();

/** first blockquote or prose paragraph (whole paragraph, not the first
 *  hard-wrapped line), clipped — the index row's line. Bold-label metadata
 *  lines (**Status:** …, **Bucket/Effort:** …) are provenance, not prose. */
function summaryOf(body: string): string {
  let fence = false;
  const para: string[] = [];
  const structural = /^(\* |- |\||---|\d+\. |<)/;
  for (const line of body.split("\n")) {
    if (line.startsWith("```")) {
      fence = !fence;
      continue;
    }
    if (fence) continue;
    const t = line.trim();
    if (!t) {
      if (para.length > 0) break;
      continue;
    }
    if (para.length === 0) {
      if (t.startsWith("#") || structural.test(t)) continue;
      if (/^\*\*[^*]+:?\*\*:?\s/.test(t.replace(/^>+\s*/, ""))) continue;
      para.push(t.replace(/^>+\s*/, ""));
    } else {
      if (t.startsWith("#") || structural.test(t)) break;
      para.push(t.replace(/^>+\s*/, ""));
    }
  }
  const text = stripMd(para.join(" "));
  return text.length > 200 ? `${text.slice(0, 197)}…` : text;
}

/** short commit hash when the source is actually tracked — absent otherwise
 *  (most of ~/dev sits in an untracked home repo; per-repo ADRs are tracked) */
function gitCommitOf(abs: string): string | undefined {
  const dir = path.dirname(abs);
  try {
    execFileSync("git", ["-C", dir, "ls-files", "--error-unmatch", abs], { stdio: "pipe" });
    const out = execFileSync("git", ["-C", dir, "log", "-1", "--format=%h", "--", abs], {
      stdio: "pipe",
    })
      .toString()
      .trim();
    return out || undefined;
  } catch {
    return undefined;
  }
}

function inDocPrivate(raw: string, fm: Record<string, unknown>): boolean {
  if (fm.site === "private") return true;
  return raw.split("\n").slice(0, 10).some((l) => l.includes("<!-- me2: private -->"));
}

interface MirrorData {
  title: string;
  collection: string;
  source: string;
  sourceMtime: string;
  sourceCommit?: string;
  syncedAt: string;
  summary: string;
  sourceMeta?: Record<string, unknown>;
  contentHash: string;
}

const sha256 = (s: string) => `sha256:${crypto.createHash("sha256").update(s).digest("hex")}`;

function main() {
  const manifest = loadManifest();
  const denyRes = manifest.deny.map(globToRegExp);
  const denied = (tildeSrc: string) => denyRes.some((re) => re.test(tildeSrc));

  let collections = [...manifest.collections];
  if (manifest.adrCollections === "auto") collections.push(...adrCollections());
  if (ONLY) {
    collections = collections.filter((c) => c.id === ONLY);
    if (collections.length === 0) {
      console.error(`no collection "${ONLY}" — manifest ids: ${manifest.collections.map((c) => c.id).join(", ")} + decisions/*`);
      process.exit(1);
    }
  }

  const counts = { added: 0, updated: 0, removed: 0, unchanged: 0, denied: 0, private: 0, scan: 0 };
  const expected = new Set<string>(); // rel paths under content/library that should exist
  const today = new Date().toISOString().slice(0, 10);

  for (const col of collections) {
    const rootAbs = expand(col.root);
    if (!fs.existsSync(rootAbs)) {
      console.warn(`warn  collection ${col.id}: root missing (${col.root}) — skipped`);
      continue;
    }
    const slugs = new Map<string, string>(); // slug -> source (collision guard)
    for (const pat of col.include) {
      for (const abs of expandInclude(rootAbs, pat)) {
        const tildeSrc = tildify(abs);
        if (denied(tildeSrc)) {
          counts.denied++;
          continue;
        }
        const raw = fs.readFileSync(abs, "utf8");
        const parsed = matter(raw);
        if (inDocPrivate(raw, parsed.data) || manifest.private.includes(tildeSrc)) {
          counts.private++;
          continue;
        }
        const scan = scanDoc(raw);
        if (scan.hard.length > 0) {
          console.error(`SKIP  ${tildeSrc} — deny-scan: ${scan.hard.join(", ")} (hard; will never mirror)`);
          counts.scan++;
          continue;
        }
        if (scan.soft.length > 0 && !manifest.scanAllow.includes(tildeSrc)) {
          console.error(`SKIP  ${tildeSrc} — deny-scan: ${scan.soft.join(", ")} (add to scanAllow to publish anyway)`);
          counts.scan++;
          continue;
        }

        // slug from the path relative to the collection root, so nested
        // includes (portfolio/README.md vs README.md) can't collide
        const slug = kebab(path.relative(rootAbs, abs));
        if (slugs.has(slug)) {
          console.error(`SKIP  ${tildeSrc} — slug "${slug}" collides with ${slugs.get(slug)} in ${col.id}`);
          counts.scan++;
          continue;
        }
        slugs.set(slug, tildeSrc);

        let body = parsed.content.replace(/^\n+/, "");
        if (!body.endsWith("\n")) body += "\n";
        const hash = sha256(body);
        const sourceCommit = gitCommitOf(abs);
        const sourceMeta: Record<string, unknown> = {};
        for (const [k, v] of Object.entries(parsed.data)) if (k !== "site") sourceMeta[k] = v;
        const status = body.match(/^\*\*Status:?\*\*:?\s*(.+)$/m);
        if (status && !sourceMeta.status) sourceMeta.status = status[1].trim();

        const relOut = path.join(col.id, `${slug}.md`);
        const outAbs = path.join(LIB_DIR, relOut);
        expected.add(relOut);

        const prev = fs.existsSync(outAbs) ? matter(fs.readFileSync(outAbs, "utf8")) : null;
        const data: MirrorData = {
          title: firstHeading(body) ?? path.basename(abs).replace(/\.mdx?$/, ""),
          collection: col.id,
          source: tildeSrc,
          sourceMtime: fs.statSync(abs).mtime.toISOString(),
          ...(sourceCommit ? { sourceCommit } : {}),
          syncedAt: today,
          summary: summaryOf(body),
          ...(Object.keys(sourceMeta).length > 0 ? { sourceMeta } : {}),
          contentHash: hash,
        };

        // "unchanged" also re-verifies the mirror's own body (same
        // normalization as the write path), so a re-run self-heals a
        // hand-edited mirror instead of trusting its frontmatter
        let prevBody = prev ? prev.content.replace(/^\n+/, "") : null;
        if (prevBody !== null && !prevBody.endsWith("\n")) prevBody += "\n";
        const unchanged =
          prev !== null &&
          prevBody !== null &&
          sha256(prevBody) === hash &&
          prev.data.contentHash === hash &&
          (prev.data.sourceCommit ?? undefined) === sourceCommit &&
          prev.data.title === data.title &&
          prev.data.summary === data.summary &&
          prev.data.collection === col.id;
        if (unchanged) {
          counts.unchanged++;
          continue;
        }
        if (!CHECK) {
          fs.mkdirSync(path.dirname(outAbs), { recursive: true });
          fs.writeFileSync(outAbs, matter.stringify(body, data as unknown as Record<string, unknown>));
        }
        counts[prev ? "updated" : "added"]++;
      }
    }
  }

  // orphan sweep — a mirror whose source vanished or became excluded goes away
  const sweepRoot = ONLY ? path.join(LIB_DIR, ONLY) : LIB_DIR;
  const walk = (dir: string): string[] =>
    fs.existsSync(dir)
      ? fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
          e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)]
        )
      : [];
  for (const f of walk(sweepRoot)) {
    const rel = path.relative(LIB_DIR, f);
    if (!expected.has(rel)) {
      if (!CHECK) fs.rmSync(f);
      counts.removed++;
    }
  }
  if (!CHECK) {
    // prune now-empty collection dirs
    const pruneEmpty = (dir: string) => {
      if (!fs.existsSync(dir)) return;
      for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
        if (e.isDirectory()) pruneEmpty(path.join(dir, e.name));
      }
      if (dir !== LIB_DIR && fs.readdirSync(dir).length === 0) fs.rmdirSync(dir);
    };
    pruneEmpty(LIB_DIR);
  }

  const changes = counts.added + counts.updated + counts.removed;
  const mirrored = counts.unchanged + counts.added + counts.updated;
  console.log(
    `library ${CHECK ? "check" : "sync"} — ${mirrored} mirrored: ${counts.added} added · ${counts.updated} updated · ` +
      `${counts.removed} removed · ${counts.unchanged} unchanged · ${counts.denied} denied · ` +
      `${counts.private} private · ${counts.scan} skipped (scan/collision)`
  );
  if (CHECK && changes > 0) {
    console.error(`--check: ${changes} pending change(s)`);
    process.exit(1);
  }
}

main();
