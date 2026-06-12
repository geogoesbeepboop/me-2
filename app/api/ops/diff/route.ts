import { liveSourcesPresent, roster } from "@/lib/ops/fleet";
import { commitPatch } from "@/lib/ops/git";

const PATCH_CAP = 200_000; // chars — a patch is a read, not a download

/**
 * GET /api/ops/diff?slug=<agent>&hash=<sha> — one commit, full patch.
 * Live machine only: the deployed site serves the recorded snapshot and
 * has no repos to read. Slug must name a fleet agent, hash must be hex.
 */
export async function GET(request: Request) {
  if (!liveSourcesPresent()) {
    return new Response("diffs are only readable on the operator's machine", { status: 404 });
  }
  const url = new URL(request.url);
  const slug = url.searchParams.get("slug") ?? "";
  const hash = url.searchParams.get("hash") ?? "";
  const entry = roster().find((r) => r.slug === slug);
  if (!entry || !/^[0-9a-f]{7,40}$/i.test(hash)) {
    return new Response("unknown agent or malformed hash", { status: 400 });
  }
  const patch = await commitPatch(entry.repoPath, hash);
  if (!patch) return new Response("no such commit", { status: 404 });
  const body =
    patch.length > PATCH_CAP
      ? `${patch.slice(0, PATCH_CAP)}\n\n… patch truncated at ${PATCH_CAP.toLocaleString()} chars — read the rest in the repo`
      : patch;
  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" },
  });
}
