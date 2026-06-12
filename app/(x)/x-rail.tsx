"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LANDINGS } from "./registry";

/**
 * REVIEW RAIL — a small fixed chip on every experimental landing so
 * variants can be flipped through like contact sheets. Deliberately
 * style-agnostic: one dark pill that sits on top of any art direction.
 */
export default function XRail() {
  const pathname = usePathname();
  const i = LANDINGS.findIndex((l) => l.href === pathname);
  if (i === -1) return null;

  const prev = LANDINGS[(i - 1 + LANDINGS.length) % LANDINGS.length];
  const next = LANDINGS[(i + 1) % LANDINGS.length];
  const here = LANDINGS[i];

  return (
    <nav
      aria-label="Landing proposals"
      className="fixed right-3 bottom-3 z-[300] flex items-center gap-2 rounded-full border border-white/15 bg-black/80 px-3 py-1.5 font-mono text-[10px] tracking-[0.14em] text-white/80 uppercase backdrop-blur-sm"
    >
      <Link
        href={prev.href}
        aria-label={`Previous proposal: ${prev.name}`}
        className="px-1 text-white/50 transition-colors hover:text-white"
      >
        ←
      </Link>
      <span className="text-white/90">Nº{here.no}</span>
      <Link
        href="/landings"
        className="px-1 text-white/50 transition-colors hover:text-white"
      >
        index
      </Link>
      <Link
        href={next.href}
        aria-label={`Next proposal: ${next.name}`}
        className="px-1 text-white/50 transition-colors hover:text-white"
      >
        →
      </Link>
    </nav>
  );
}
