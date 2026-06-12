import Link from "next/link";
import Reveal from "@/components/motion/Reveal";

/**
 * N°000, AS A BAND — the method sits between the graph and the index:
 * before you open the files, here's how every one of them got made.
 * The six phase tags mirror the trace on "/" (same phases, same
 * order) but stay monochrome here: this page's visible legends give
 * cyan and green other meanings, and a hue never carries two.
 */

const PHASES = [
  "[ideate]",
  "[plan]",
  "[build]",
  "[challenge]",
  "[ship]",
  "[resume]",
] as const;

export default function MethodBand({
  title,
  thesis,
  status,
}: {
  title: string;
  thesis: string;
  status: string;
}) {
  return (
    <Reveal>
      <Link
        href="/method"
        style={{ "--accent": "var(--color-ember)" } as React.CSSProperties}
        className="group block border-y border-line bg-panel/40 transition-colors duration-500 hover:bg-panel"
      >
        <div className="grid items-baseline gap-x-6 gap-y-3 px-5 py-6 md:grid-cols-[110px_minmax(0,1fr)_auto] md:px-10 md:py-7">
          <span className="font-mono text-mono-sm text-(--accent)">N°000</span>
          <div>
            <p className="text-title font-bold uppercase stretch-110 transition-[font-stretch] duration-700 ease-(--ease-cine) group-hover:stretch-125">
              {title} — how every file below gets made
            </p>
            <p className="mt-2 max-w-2xl font-mono text-mono-sm text-ash">
              {thesis}
            </p>
            <p className="mt-3 flex flex-wrap gap-x-3 gap-y-1 font-mono text-label tracking-[0.14em] text-ash">
              {PHASES.map((tag) => (
                <span key={tag}>{tag}</span>
              ))}
            </p>
          </div>
          <span className="font-mono text-label tracking-[0.16em] text-dim uppercase md:justify-self-end">
            {status.toLowerCase()} ·{" "}
            <span className="inline-block text-ash transition-transform duration-500 ease-(--ease-cine) group-hover:translate-x-1.5">
              read me first →
            </span>
          </span>
        </div>
      </Link>
    </Reveal>
  );
}
