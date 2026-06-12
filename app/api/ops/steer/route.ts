import { liveSourcesPresent, roster } from "@/lib/ops/fleet";
import { writeSteering } from "@/lib/ops/steer";

const NOTE_CAP = 4000;

/**
 * POST /api/ops/steer { slug, note } — drop a steering note in the
 * agent's inbox (~/.claude/fleet/steering/<repo>/). Nothing reads it
 * automatically; the next session's opt-in SessionStart hook does.
 * Live machine only.
 */
export async function POST(request: Request) {
  if (!liveSourcesPresent()) {
    return new Response("steering only works on the operator's machine", { status: 404 });
  }
  let body: { slug?: string; note?: string };
  try {
    body = await request.json();
  } catch {
    return new Response("expected json", { status: 400 });
  }
  const entry = roster().find((r) => r.slug === body.slug);
  const note = (body.note ?? "").trim();
  if (!entry || !note) return new Response("unknown agent or empty note", { status: 400 });
  if (note.length > NOTE_CAP) {
    return new Response(`a steering note is a nudge — keep it under ${NOTE_CAP} chars`, { status: 413 });
  }
  const written = writeSteering(entry.repoPath, note);
  return Response.json(written, { status: 201 });
}
