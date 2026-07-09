"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import MiniSearch from "minisearch";

/**
 * ⌘K — one search over the whole floor: archive, method, about, and the
 * library stacks. Mounted once in the root layout; opens on ⌘K/Ctrl-K or
 * the `me2:search` event (the CityBar affordance and the /library entry
 * both dispatch it). The corpus (public/search-index.json, built at
 * `prebuild`) is fetched lazily on first open and indexed client-side.
 *
 * Doctrine notes: flat opaque panel over an unblurred scrim — no
 * backdrop-filter anywhere; kind tags and stamps in plain ink.
 */

interface SearchDoc {
  id: string;
  url: string;
  kind: string;
  collection?: string;
  no?: string;
  title: string;
  headings: string;
  text: string;
  date: string;
}

type Hit = Pick<SearchDoc, "id" | "url" | "kind" | "collection" | "no" | "title" | "date">;

let indexPromise: Promise<MiniSearch<SearchDoc> | null> | null = null;

function loadIndex(): Promise<MiniSearch<SearchDoc> | null> {
  indexPromise ??= fetch("/search-index.json")
    .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
    .then((docs: SearchDoc[]) => {
      const mini = new MiniSearch<SearchDoc>({
        fields: ["title", "headings", "text"],
        storeFields: ["url", "kind", "collection", "no", "title", "date"],
      });
      mini.addAll(docs);
      return mini;
    })
    .catch(() => null);
  return indexPromise;
}

export default function SearchOverlay() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<Hit[]>([]);
  const [active, setActive] = useState(0);
  const [failed, setFailed] = useState(false);
  const [ready, setReady] = useState(false);
  const indexRef = useRef<MiniSearch<SearchDoc> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const close = useCallback(() => {
    setOpen(false);
    setQuery("");
    setHits([]);
    setActive(0);
  }, []);

  // open on ⌘K / Ctrl-K, the nav affordance's event; close on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      } else if (e.key === "Escape") {
        close();
      }
    };
    const onOpen = () => setOpen(true);
    window.addEventListener("keydown", onKey);
    window.addEventListener("me2:search", onOpen);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("me2:search", onOpen);
    };
  }, [close]);

  // first open: focus the input, fetch + build the index, lock page scroll
  useEffect(() => {
    if (!open) return;
    inputRef.current?.focus();
    document.body.style.overflow = "hidden";
    if (!indexRef.current) {
      loadIndex().then((mini) => {
        indexRef.current = mini;
        setReady(mini !== null);
        setFailed(mini === null);
      });
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    const mini = indexRef.current;
    if (!mini || query.trim().length < 2) {
      setHits([]);
      setActive(0);
      return;
    }
    const found = mini
      .search(query, { boost: { title: 4, headings: 2 }, prefix: true, fuzzy: 0.15 })
      .slice(0, 12) as unknown as Hit[];
    setHits(found);
    setActive(0);
  }, [query]);

  const go = useCallback(
    (hit: Hit | undefined) => {
      if (!hit) return;
      close();
      router.push(hit.url);
    },
    [close, router]
  );

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[120] flex items-start justify-center bg-void/85 px-4 pt-[14vh]"
      onMouseDown={close}
      role="dialog"
      aria-modal="true"
      aria-label="Search the archive and library"
    >
      <div
        className="w-full max-w-2xl border border-line-loud bg-void"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-baseline gap-3 border-b border-line px-5 py-4">
          <span className="font-mono text-label tracking-[0.2em] text-dim uppercase">Search</span>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setActive((a) => Math.min(a + 1, hits.length - 1));
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setActive((a) => Math.max(a - 1, 0));
              } else if (e.key === "Enter") {
                go(hits[active]);
              }
            }}
            placeholder="projects, writing, method, the library…"
            className="w-full bg-transparent font-mono text-mono-sm text-bone outline-none placeholder:text-dim"
            aria-label="Search query"
          />
          <span className="shrink-0 font-mono text-label text-dim uppercase">esc</span>
        </div>

        <ul className="max-h-[55vh] overflow-y-auto">
          {hits.map((h, i) => (
            <li key={h.id}>
              <button
                type="button"
                onClick={() => go(h)}
                onMouseEnter={() => setActive(i)}
                data-active={i === active}
                className="flex w-full flex-wrap items-baseline gap-x-4 gap-y-0.5 border-t border-line/60 px-5 py-3 text-left transition-colors duration-150 data-[active=true]:bg-panel"
              >
                <span className="font-mono text-label tracking-[0.16em] text-dim uppercase">
                  {h.kind}
                  {h.no && ` n°${h.no}`}
                </span>
                <span className="text-bone">{h.title}</span>
                {h.collection && (
                  <span className="font-mono text-label text-dim">{h.collection}</span>
                )}
              </button>
            </li>
          ))}
          {query.trim().length >= 2 && hits.length === 0 && (
            <li className="border-t border-line/60 px-5 py-6 font-mono text-mono-sm text-dim">
              {failed
                ? "no index on this build — run npm run build once"
                : ready
                  ? "nothing in the stacks matches"
                  : "opening the stacks…"}
            </li>
          )}
          {query.trim().length < 2 && (
            <li className="border-t border-line/60 px-5 py-6 font-mono text-mono-sm text-dim">
              type to search everything published here — the archive, the method, the library
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}
