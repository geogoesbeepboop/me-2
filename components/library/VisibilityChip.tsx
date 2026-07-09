"use client";

import { useEffect, useState } from "react";
import { flipVisibility, loadInventory } from "./ops-client";

/**
 * PUBLIC/PRIVATE — the operator's one-click takedown, rendered only where
 * the operator API answers (everywhere else this component is invisible).
 * Click flips the manifest, re-syncs the mirror, commits and pushes —
 * scope-bounded and check-gated by scripts/publish-visibility.sh.
 */
export default function VisibilityChip({ source }: { source: string }) {
  const [state, setState] = useState<"public" | "private" | null>(null);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    loadInventory().then((inv) => {
      if (!alive || !inv) return;
      const s = inv.find((x) => x.source === source);
      if (s && (s.status === "public" || s.status === "private")) setState(s.status);
    });
    return () => {
      alive = false;
    };
  }, [source]);

  if (state === null) return null;

  const next = state === "public" ? "private" : "public";
  return (
    <span className="inline-flex items-baseline gap-2">
      <button
        type="button"
        disabled={busy}
        onClick={async (e) => {
          e.preventDefault();
          e.stopPropagation();
          setBusy(true);
          setNote(null);
          const r = await flipVisibility(source, next);
          if (r.error) setNote(r.error.slice(0, 120));
          else {
            setState(next);
            setNote(r.published ? "pushed" : "local only — push failed");
          }
          setBusy(false);
        }}
        title={`operator only — flip to ${next} (commits + pushes)`}
        className="cursor-pointer border border-line px-2 py-0.5 font-mono text-label tracking-[0.14em] text-bone uppercase transition-colors duration-300 hover:border-line-loud disabled:opacity-50"
      >
        {busy ? "…" : state}
      </button>
      {note && <span className="font-mono text-label text-dim">{note}</span>}
    </span>
  );
}
