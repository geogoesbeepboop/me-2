#!/usr/bin/env node
/**
 * Scaffold a new archive entry from a template.
 *
 *   npm run new work "Project Name"
 *   npm run new lab "BENCH NAME"
 *   npm run new writing "Post Title"
 *
 * Copies the matching template into content/<kind>/<slug>.mdx with
 * title/dates pre-filled. The site picks it up on next build.
 */
import fs from "node:fs";
import path from "node:path";

const TEMPLATE = {
  work: "case-study.mdx",
  lab: "lab-bench.mdx",
  writing: "post.mdx",
};

const [kind, ...titleParts] = process.argv.slice(2);
const title = titleParts.join(" ");

if (!TEMPLATE[kind] || !title) {
  console.error('usage: npm run new <work|lab|writing> "Title"');
  process.exit(1);
}

const slug = title
  .toLowerCase()
  .normalize("NFD")
  .replace(/[̀-ͯ]/g, "")
  .replace(/[^a-z0-9]+/g, "-")
  .replace(/(^-|-$)/g, "");

const root = path.join(process.cwd(), "content");
const src = path.join(root, "_templates", TEMPLATE[kind]);
const dest = path.join(root, kind, `${slug}.mdx`);

if (fs.existsSync(dest)) {
  console.error(`refusing to overwrite ${path.relative(process.cwd(), dest)}`);
  process.exit(1);
}

const today = new Date().toISOString().slice(0, 10);
let body = fs.readFileSync(src, "utf8");

// strip template-banner comment lines, fill in the obvious fields
body = body
  .split("\n")
  .filter((line) => !/^# /.test(line) || !line.includes("copy into content/"))
  .join("\n")
  .replace(/^title: ".*"$/m, `title: "${title}"`)
  .replace(/YYYY-MM-DD/g, today);

fs.writeFileSync(dest, body);
console.log(`created ${path.relative(process.cwd(), dest)}`);
console.log("fill in: summary, thesis/question, accent, refs — then npm run dev");
