import { execFile } from "node:child_process";
import path from "node:path";
import { promisify } from "node:util";
import { liveSourcesPresent } from "@/lib/ops/fleet";
import { libraryInventory, setVisibility } from "@/lib/library-admin";

const run = promisify(execFile);

export const dynamic = "force-dynamic";

/**
 * The library's operator surface — the "admin mode" that needs no sign-in
 * because it exists only where the sources exist. Both handlers hard-404
 * off the operator's machine (the steer-route pattern); the deployed site
 * never carries the hidden inventory, so nothing here can leak.
 *
 * GET  → every source with its visibility state (incl. denied/private).
 * POST { source, visibility } → flip + re-sync, then publish through
 * scripts/publish-visibility.sh: stages ONLY the manifest + mirrors, runs
 * the content check, commits, pushes main. No build gate on purpose —
 * a private-flip is a takedown, and minutes matter (George, 2026-07-09).
 */
export async function GET() {
  if (!liveSourcesPresent()) {
    return new Response("the library speaks only on the operator's machine", { status: 404 });
  }
  return Response.json({ sources: libraryInventory() });
}

export async function POST(request: Request) {
  if (!liveSourcesPresent()) {
    return new Response("the library speaks only on the operator's machine", { status: 404 });
  }
  let body: { source?: string; visibility?: string };
  try {
    body = await request.json();
  } catch {
    return new Response("expected json", { status: 400 });
  }
  const { source, visibility } = body;
  if (!source || (visibility !== "public" && visibility !== "private")) {
    return new Response("expected { source, visibility: public|private }", { status: 400 });
  }

  let flip;
  try {
    flip = setVisibility(source, visibility);
  } catch (e) {
    return new Response((e as Error).message, { status: 422 });
  }

  // publish — bounded-scope commit + push; failure leaves the flip local
  // (still hidden/shown on this machine) and reports why
  try {
    const { stdout } = await run(
      "bash",
      [path.join(process.cwd(), "scripts", "publish-visibility.sh"), `${source} → ${visibility}`],
      { cwd: process.cwd(), timeout: 60_000 }
    );
    return Response.json({ ...flip, published: true, log: stdout.trim().split("\n").pop() });
  } catch (e) {
    const err = e as { stdout?: string; stderr?: string; message: string };
    return Response.json(
      { ...flip, published: false, log: (err.stderr || err.stdout || err.message).trim().slice(-500) },
      { status: 207 }
    );
  }
}
