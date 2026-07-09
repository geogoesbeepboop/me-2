"use client";

/** the /library page's visible way into the same ⌘K search core —
 *  a button shaped like an input, for pointers and phones */
export default function SearchEntry() {
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new Event("me2:search"))}
      className="mt-8 flex w-full max-w-xl items-baseline gap-3 border border-line bg-panel px-4 py-3 text-left transition-colors duration-300 hover:border-line-loud"
    >
      <span className="font-mono text-mono-sm text-dim">search the stacks…</span>
      <span className="ml-auto shrink-0 font-mono text-label tracking-[0.14em] text-dim uppercase">
        ⌘K
      </span>
    </button>
  );
}
