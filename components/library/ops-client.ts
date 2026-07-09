"use client";

/**
 * Client cache for the library's operator API. One GET per page load,
 * shared by every chip; a 404 (any machine that isn't the operator's)
 * resolves to null and the operator UI simply never renders — the
 * deployed page's HTML carries none of the hidden inventory.
 */

export interface SourceState {
  source: string;
  collection: string;
  status: "public" | "private" | "marker" | "denied" | "scan";
  detail?: string;
  urlPath?: string;
}

let invPromise: Promise<SourceState[] | null> | null = null;

export function loadInventory(force = false): Promise<SourceState[] | null> {
  if (force) invPromise = null;
  invPromise ??= fetch("/api/ops/library")
    .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
    .then((j: { sources: SourceState[] }) => j.sources)
    .catch(() => null);
  return invPromise;
}

export async function flipVisibility(
  source: string,
  visibility: "public" | "private"
): Promise<{ published?: boolean; log?: string; error?: string }> {
  const r = await fetch("/api/ops/library", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ source, visibility }),
  });
  if (r.status === 422 || r.status === 400) return { error: await r.text() };
  if (!r.ok && r.status !== 207) return { error: `flip failed (${r.status})` };
  loadInventory(true); // refresh the cache for every listener
  return r.json();
}
