import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import matter from "gray-matter";
// plain-JS modules shared with the sync script and the check gate
import { scanDoc, globToRegExp } from "../scripts/lib/deny-scan.mjs";
import { loadManifest, allCollections, expandInclude, expand, tildify, slugFor, inDocPrivate } from "../scripts/lib/manifest.mjs";

/**
 * THE VISIBILITY FLIP — one logic core, three entry points (the ops API
 * route, `npm run library`, and whatever else needs it). Live machine
 * only by construction: everything here reads sources under ~/dev, which
 * don't exist on a deploy. The flip edits `private[]` in
 * config/library.manifest.json and re-runs the deterministic sync so the
 * mirror appears/disappears in the same motion; committing + pushing is
 * scripts/publish-visibility.sh's job (bounded scope, check-gated).
 */

export type SourceStatus =
  | "public" // mirrored, on the site
  | "private" // hidden via manifest private[] — flippable
  | "marker" // hidden via in-doc marker — edit the source to change
  | "denied" // manifest deny wall — edit the manifest deliberately
  | "scan"; // deny-scan skip — clean the doc or scanAllow it

export interface SourceState {
  source: string;
  collection: string;
  status: SourceStatus;
  detail?: string;
  /** the /library route when mirrored */
  urlPath?: string;
}

interface Manifest {
  collections: { id: string; label: string; root: string; include: string[] }[];
  adrCollections?: "auto";
  deny: string[];
  private: string[];
  scanAllow: string[];
}

const MANIFEST_PATH = (root: string) => path.join(root, "config", "library.manifest.json");

/** every source the manifest can see, with why it is or isn't published */
export function libraryInventory(root = process.cwd()): SourceState[] {
  const manifest = loadManifest(root) as Manifest;
  const denyRes = manifest.deny.map(globToRegExp);
  const out: SourceState[] = [];
  for (const col of allCollections(root, manifest)) {
    const rootAbs = expand(col.root);
    if (!fs.existsSync(rootAbs)) continue;
    for (const pat of col.include) {
      for (const abs of expandInclude(rootAbs, pat)) {
        const source = tildify(abs);
        const urlPath = `${col.id}/${slugFor(rootAbs, abs)}`;
        const entry = (status: SourceStatus, detail?: string) =>
          out.push({ source, collection: col.id, status, detail, urlPath });
        if (denyRes.some((re: RegExp) => re.test(source))) {
          entry("denied");
          continue;
        }
        const raw = fs.readFileSync(abs, "utf8");
        if (inDocPrivate(raw, matter(raw).data)) {
          entry("marker");
          continue;
        }
        if (manifest.private.includes(source)) {
          entry("private");
          continue;
        }
        const scan = scanDoc(raw);
        if (scan.hard.length > 0) {
          entry("scan", scan.hard.join(", "));
          continue;
        }
        if (scan.soft.length > 0 && !manifest.scanAllow.includes(source)) {
          entry("scan", scan.soft.join(", "));
          continue;
        }
        entry("public");
      }
    }
  }
  return out;
}

export interface FlipResult {
  source: string;
  visibility: "public" | "private";
  synced: string;
}

/** flip one source and re-run the sync so the mirror follows immediately */
export function setVisibility(
  source: string,
  visibility: "public" | "private",
  root = process.cwd()
): FlipResult {
  if (!source.startsWith("~/")) throw new Error(`source must be ~-relative, got "${source}"`);
  const state = libraryInventory(root).find((s) => s.source === source);
  if (!state) throw new Error(`"${source}" is not in any library collection`);
  if (state.status === "denied") {
    throw new Error(`"${source}" is on the deny wall — editing config/library.manifest.json deny[] is a deliberate act, not a flip`);
  }
  if (state.status === "marker" && visibility === "public") {
    throw new Error(`"${source}" carries an in-doc private marker — remove it from the source file; the marker beats the manifest on purpose`);
  }
  if (state.status === "scan" && visibility === "public") {
    throw new Error(`"${source}" is skipped by the deny-scan (${state.detail}) — clean the doc or add it to scanAllow in the manifest`);
  }

  const manifest = loadManifest(root) as Manifest;
  const had = manifest.private.includes(source);
  if (visibility === "private" && !had) manifest.private.push(source);
  if (visibility === "public" && had) {
    manifest.private = manifest.private.filter((s) => s !== source);
  }
  manifest.private.sort();
  fs.writeFileSync(MANIFEST_PATH(root), `${JSON.stringify(manifest, null, 2)}\n`);

  const synced = execFileSync(path.join(root, "node_modules", ".bin", "tsx"), ["scripts/sync-library.ts"], {
    cwd: root,
    stdio: "pipe",
  })
    .toString()
    .trim()
    .split("\n")
    .pop() as string;
  return { source, visibility, synced };
}
