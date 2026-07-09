#!/usr/bin/env node
/**
 * Search corpus builder — runs as npm `prebuild`/`predev`, writes
 * public/search-index.json (gitignored; Vercel regenerates it every build
 * from committed content). The client builds the MiniSearch index from
 * this raw corpus on first ⌘K — shipping the corpus, not a serialized
 * index, keeps the payload smaller and avoids version coupling.
 *
 * Corpus: projects + writing + method + about (MDX stripped to prose) and
 * every library mirror. One record per document:
 *   { id, url, kind, collection?, no?, title, headings, text, date }
 */
import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

const ROOT = process.cwd();
const CONTENT = path.join(ROOT, "content");
const OUT = path.join(ROOT, "public", "search-index.json");
const TEXT_CAP = 20_000;

/** MDX/JSX → searchable prose: drop tags, expressions, imports, fences kept */
function stripMdx(body) {
  return body
    .replace(/^import .*$/gm, "")
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\{[^{}]*\}/g, " ")
    .replace(/[ \t]+/g, " ")
    .trim();
}

function headingsOf(body) {
  const out = [];
  let fence = false;
  for (const line of body.split("\n")) {
    if (line.startsWith("```")) {
      fence = !fence;
      continue;
    }
    if (fence) continue;
    const m = line.match(/^#{1,4}\s+(.+)/);
    if (m) out.push(m[1].replace(/[*_`#]/g, "").trim());
  }
  return out;
}

const docs = [];
const push = (d) => docs.push({ ...d, text: d.text.slice(0, TEXT_CAP) });

// ── the archive graph: replicate lib/content.ts numbering (oldest = 001) ──
const graph = [];
for (const kind of ["projects", "writing"]) {
  const dir = path.join(CONTENT, kind);
  if (!fs.existsSync(dir)) continue;
  for (const f of fs.readdirSync(dir).filter((f) => f.endsWith(".mdx"))) {
    const { data, content } = matter(fs.readFileSync(path.join(dir, f), "utf8"));
    const slug = f.replace(/\.mdx$/, "");
    const sortDate = (kind === "projects" && data.updated) || data.date || "1970-01-01";
    graph.push({ kind, slug, data, content, sortDate });
  }
}
graph.sort((a, b) => a.sortDate.localeCompare(b.sortDate));
graph.forEach((n, i) => {
  n.no = String(i + 1).padStart(3, "0");
});
for (const n of graph) {
  push({
    id: `${n.kind}/${n.slug}`,
    url: `/${n.kind}/${n.slug}`,
    kind: n.kind === "writing" ? "POST" : n.data.stage === "bench" ? "BENCH" : "SHIP",
    no: n.no,
    title: n.data.title ?? n.slug,
    headings: headingsOf(n.content).join(" · "),
    text: `${n.data.summary ?? ""} ${n.data.thesis ?? ""} ${n.data.question ?? ""} ${stripMdx(n.content)}`,
    date: n.data.date ?? n.sortDate,
  });
}

// ── the standalone pages ──
for (const [file, url, kind] of [
  ["method.mdx", "/method", "METHOD"],
  ["about.mdx", "/about", "ABOUT"],
]) {
  const p = path.join(CONTENT, file);
  if (!fs.existsSync(p)) continue;
  const { data, content } = matter(fs.readFileSync(p, "utf8"));
  push({
    id: url,
    url,
    kind,
    title: data.title ?? kind,
    headings: headingsOf(content).join(" · "),
    text: `${data.summary ?? ""} ${data.thesis ?? ""} ${stripMdx(content)}`,
    date: data.date ?? "",
  });
}

// ── the library mirrors (already plain markdown — no MDX stripping) ──
const LIB = path.join(CONTENT, "library");
const walk = (dir) =>
  fs.existsSync(dir)
    ? fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
        e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)]
      )
    : [];
for (const f of walk(LIB).filter((f) => f.endsWith(".md"))) {
  const { data, content } = matter(fs.readFileSync(f, "utf8"));
  const rel = path.relative(LIB, f).replace(/\.md$/, "");
  push({
    id: `library/${rel}`,
    url: `/library/${rel}`,
    kind: String(data.collection ?? "").startsWith("decisions/") ? "ADR" : "DOC",
    collection: data.collection,
    title: data.title ?? rel,
    headings: headingsOf(content).join(" · "),
    text: `${data.summary ?? ""} ${content.replace(/[ \t]+/g, " ")}`,
    date: data.syncedAt ?? "",
  });
}

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify(docs));
const kb = Math.round(fs.statSync(OUT).size / 1024);
console.log(`search index — ${docs.length} documents, ${kb} KB → public/search-index.json`);
