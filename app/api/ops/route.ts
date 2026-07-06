import { loadFleet } from "@/lib/ops/fleet";

/**
 * GET /api/ops?window=24 — the fleet, measured now (George's machine)
 * or the committed record (anywhere else). The client polls this to
 * keep the board breathing; never cached.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const windowHours = Math.min(24 * 14, Math.max(1, Number(url.searchParams.get("window")) || 24));
  const snap = await loadFleet(windowHours);
  return Response.json(snap, {
    headers: { "Cache-Control": "no-store" },
  });
}
