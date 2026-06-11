#!/usr/bin/env node
/**
 * Archive integrity check — run after editing content/ or lib/inspect/.
 *
 *   node scripts/check-content.mjs
 *
 * Validates the things a broken edit silently breaks: frontmatter
 * completeness, the refs graph, stage/repo fields, dead inspect keys,
 * and leftovers from the old work/lab sections. Exit 1 with readable
 * errors; the PostToolUse hook feeds them straight back to the agent.
 */
import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

const ROOT = path.join(process.cwd(), "content");
const KINDS = ["projects", "writing"];
const errors = [];
const warn = [];

const nodes = new Map(); // "projects/dj-agent" -> { data, file }
for (const kind of KINDS) {
  const dir = path.join(ROOT, kind);
  if (!fs.existsSync(dir)) continue;
  for (const f of fs.readdirSync(dir).filter((f) => f.endsWith(".mdx"))) {
    const file = path.join(dir, f);
    const { data, content } = matter(fs.readFileSync(file, "utf8"));
    nodes.set(`${kind}/${f.replace(/\.mdx$/, "")}`, { data, content, file });
  }
}

const rel = (f) => path.relative(process.cwd(), f);

for (const [key, { data, content, file }] of nodes) {
  const [kind] = key.split("/");
  const where = rel(file);

  // required everywhere
  for (const field of ["title", "summary", "date"]) {
    if (!data[field]) errors.push(`${where}: missing frontmatter \`${field}\``);
  }
  if (data.accent && !/^#[0-9a-f]{6}$/i.test(data.accent)) {
    errors.push(`${where}: accent "${data.accent}" is not a #rrggbb color`);
  }

  if (kind === "projects") {
    if (!data.status) errors.push(`${where}: projects need \`status\``);
    if (!["ship", "bench", undefined].includes(data.stage)) {
      errors.push(`${where}: stage must be "ship" or "bench" (got "${data.stage}")`);
    }
    if (!data.stage) warn.push(`${where}: no \`stage\` — defaults to "ship"`);
    if (!data.repo) {
      warn.push(`${where}: no \`repo\` — the update-project skill can't sync it`);
    } else if (!fs.existsSync(data.repo)) {
      errors.push(`${where}: repo path does not exist: ${data.repo}`);
    }
    if (data.stage === "bench" && !data.updated) {
      errors.push(`${where}: bench entries need \`updated\` (drives ordering)`);
    }
    // a SystemDeepDive with inspect= needs its lib/inspect map
    const m = content.match(/inspect="([^"]+)"/);
    if (m && !fs.existsSync(path.join("lib", "inspect", `${m[1]}.ts`))) {
      errors.push(`${where}: inspect="${m[1]}" but lib/inspect/${m[1]}.ts is missing`);
    }
  }

  // the refs graph — every declared edge must resolve
  const refTargets = [
    ...(data.refs ?? []),
    ...(data.reflection ? [data.reflection] : []),
  ];
  for (const ref of refTargets) {
    const target = String(ref).split("#")[0];
    if (/^(work|lab)\//.test(target)) {
      errors.push(`${where}: ref "${ref}" uses the retired work/lab path — use projects/`);
    } else if (!nodes.has(target) && !target.startsWith("writing/some-")) {
      errors.push(`${where}: ref "${ref}" doesn't resolve to an entry`);
    }
  }
  // inline <Ref to="..."> edges too
  for (const m of content.matchAll(/<Ref\s+to="([^"#]+)/g)) {
    if (/^(work|lab)\//.test(m[1])) {
      errors.push(`${where}: <Ref to="${m[1]}"> uses the retired work/lab path`);
    } else if (!nodes.has(m[1])) {
      errors.push(`${where}: <Ref to="${m[1]}"> doesn't resolve to an entry`);
    }
  }
}

// inspect maps shouldn't outlive their entries
const inspectDir = path.join(process.cwd(), "lib", "inspect");
if (fs.existsSync(inspectDir)) {
  for (const f of fs.readdirSync(inspectDir).filter((f) => f.endsWith(".ts"))) {
    const slug = f.replace(/\.ts$/, "");
    if (["index", "types", "method"].includes(slug)) continue;
    if (!nodes.has(`projects/${slug}`)) {
      warn.push(`lib/inspect/${f}: no matching content/projects/${slug}.mdx`);
    }
  }
}

for (const w of warn) console.warn(`warn  ${w}`);
if (errors.length) {
  for (const e of errors) console.error(`ERROR ${e}`);
  console.error(`\n${errors.length} content error(s).`);
  process.exit(1);
}
console.log(`archive ok — ${nodes.size} entries, refs graph resolves.`);
