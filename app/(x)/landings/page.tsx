import type { Metadata } from "next";
import Link from "next/link";
import { LANDINGS } from "../registry";

export const metadata: Metadata = {
  title: "Landings — exploration index",
  robots: { index: false },
};

/**
 * THE CONTACT SHEET — every landing proposal, one per row.
 * Neutral on purpose: this page is scaffolding for review, not a
 * proposal itself.
 */
export default function LandingsIndex() {
  return (
    <div className="min-h-svh bg-[#0a0a0b] px-5 py-16 text-[#e9e7e0] md:px-10 md:py-24">
      <p className="font-mono text-[11px] tracking-[0.22em] text-[#82807a] uppercase">
        Exploration · not linked · not indexed
      </p>
      <h1 className="mt-3 text-[clamp(2.2rem,6vw,4.5rem)] leading-[0.95] font-black tracking-tight uppercase">
        Landing
        <br />
        proposals
      </h1>
      <p className="mt-5 max-w-md font-mono text-[13px] leading-relaxed text-[#a4a29a]">
        Same archive, same numbers — ten arguments about how to open it.
        Wide first, then we consolidate.
      </p>

      <ul className="mt-14 max-w-3xl">
        {LANDINGS.map((l) => (
          <li key={l.href} className="border-t border-[#232327] last:border-b">
            <Link
              href={l.href}
              className="group flex flex-wrap items-baseline gap-x-5 gap-y-1 py-5 transition-colors hover:bg-[#131315]"
            >
              <span className="font-mono text-[11px] text-[#82807a]">
                Nº{l.no}
              </span>
              <span className="text-xl font-bold tracking-tight uppercase group-hover:underline group-hover:underline-offset-4">
                {l.name}
              </span>
              <span
                className={`font-mono text-[10px] tracking-[0.18em] uppercase ${
                  l.mode === "aligned" ? "text-[#62d9e8]" : "text-[#ff5a1f]"
                }`}
              >
                {l.mode === "aligned" ? "near the system" : "breaks the system"}
              </span>
              <span className="w-full font-mono text-[12px] text-[#82807a] md:ml-auto md:w-auto md:max-w-sm md:text-right">
                {l.line}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
