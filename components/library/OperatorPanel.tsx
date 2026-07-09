"use client";

import { useEffect, useState } from "react";
import { flipVisibility, loadInventory, type SourceState } from "./ops-client";

/**
 * The hidden shelf — operator's machine only (the API 404s anywhere
 * else, so visitors never receive this list). Shows every source the
 * manifest knows but the site doesn't publish, with the reason, and a
 * publish button where a flip can lawfully change it: `private` flips
 * here; `marker` means edit the source file; `denied` means edit the
 * manifest deny wall deliberately; `scan` names what tripped.
 */
export default function OperatorPanel() {
  const [hidden, setHidden] = useState<SourceState[] | null>(null);
  const [note, setNote] = useState<string | null>(null);

  const refresh = (force = false) =>
    loadInventory(force).then((inv) => {
      if (inv) setHidden(inv.filter((s) => s.status !== "public"));
    });
  useEffect(() => {
    refresh();
  }, []);

  if (hidden === null) return null;

  return (
    <section className="mt-14 border-t border-line px-5 pt-8 md:px-10">
      <p className="font-mono text-label tracking-[0.2em] text-dim uppercase">
        Operator — {hidden.length} hidden sources (this panel exists only on this machine)
      </p>
      <ul className="mt-4 max-w-3xl">
        {hidden.map((s) => (
          <li
            key={s.source}
            className="flex flex-wrap items-baseline gap-x-4 gap-y-1 border-t border-line/60 py-3"
          >
            <span className="font-mono text-label tracking-[0.16em] text-dim uppercase">
              {s.status}
            </span>
            <span className="font-mono text-mono-sm text-ash">{s.source}</span>
            {s.detail && <span className="font-mono text-label text-dim">{s.detail}</span>}
            {s.status === "private" && (
              <button
                type="button"
                onClick={async () => {
                  setNote(null);
                  const r = await flipVisibility(s.source, "public");
                  if (r.error) setNote(r.error.slice(0, 160));
                  else {
                    setNote(`${s.source} → public${r.published ? " · pushed" : " · local only"}`);
                    refresh(true);
                  }
                }}
                className="cursor-pointer border border-line px-2 py-0.5 font-mono text-label tracking-[0.14em] text-bone uppercase transition-colors duration-300 hover:border-line-loud"
              >
                publish
              </button>
            )}
          </li>
        ))}
        {hidden.length === 0 && (
          <li className="border-t border-line/60 py-3 font-mono text-mono-sm text-dim">
            nothing hidden — every source the manifest sees is on the site
          </li>
        )}
      </ul>
      {note && <p className="mt-3 font-mono text-mono-sm text-dim">{note}</p>}
    </section>
  );
}
