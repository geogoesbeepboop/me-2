import Link from "next/link";
import HueLegend from "@/components/site/HueLegend";
import MaskReveal from "@/components/motion/MaskReveal";
import Reveal from "@/components/motion/Reveal";

/**
 * THE MEGA INDEX — the archive set at poster scale. Each row is one
 * file; hover (or keyboard focus) floods the title with the project's
 * own domain hue, widens it along the wdth axis, and opens a crack
 * carrying the thesis and the row's REAL outbound links — the same
 * refs: edges drawn in the constellation above, now walkable. The row
 * title is the link; the chips inside the crack are links too, so
 * "open anything, it links onward" is literally the interaction.
 */

export interface MegaRef {
  no: string;
  title: string;
  accent: string;
  path: string;
}

export interface MegaRowData {
  no: string;
  tag: string;
  title: string;
  path: string;
  accent: string;
  status: string;
  live: boolean;
  primaryMeta: string;
  thesis: string;
  refs: MegaRef[];
}

function MegaRow({ row }: { row: MegaRowData }) {
  return (
    <div
      style={{ "--accent": row.accent } as React.CSSProperties}
      className="group relative border-t border-line"
    >
      {/* accent bar — the file's hue drops in on touch */}
      <span
        aria-hidden
        className="absolute top-0 bottom-0 left-0 w-[3px] origin-top scale-y-0 bg-(--accent) transition-transform duration-500 ease-(--ease-cine) group-hover:scale-y-100 group-focus-within:scale-y-100"
      />

      <div className="grid grid-cols-1 items-baseline gap-x-6 px-5 py-7 md:grid-cols-[110px_minmax(0,1fr)_auto] md:px-10 md:py-9">
        <span className="hidden font-mono text-mono-sm text-dim md:block">
          {row.no}
        </span>
        <h3 className="min-w-0">
          <span className="mb-1 flex items-center gap-2 font-mono text-label tracking-[0.18em] uppercase md:hidden">
            <span className="text-dim">{row.no} · </span>
            <span className="text-(--accent)">{row.tag}</span>
            {row.live && <span className="live-dot" aria-hidden />}
            <span className="text-dim">
              {[row.status, row.primaryMeta].filter(Boolean).join(" · ")}
            </span>
          </span>
          <Link
            href={`/${row.path}`}
            className="block text-[clamp(1.8rem,5.4vw,4.6rem)] leading-[0.98] font-black tracking-[-0.02em] uppercase stretch-110 transition-[font-stretch,color] duration-700 ease-(--ease-cine) group-hover:text-(--accent) group-hover:stretch-125 focus-visible:text-(--accent) focus-visible:outline-none"
          >
            {row.title}
          </Link>
        </h3>
        <span className="hidden text-right font-mono text-label tracking-[0.16em] uppercase md:block">
          <span className="flex items-center justify-end gap-2 text-(--accent)">
            {row.live && <span className="live-dot" aria-hidden />}
            {row.tag}
          </span>
          <span className="mt-1 block text-dim">
            {[row.status, row.primaryMeta].filter(Boolean).join(" · ")}
          </span>
        </span>
      </div>

      {/* the crack — thesis, then the row's real outbound links. Touch
          can't hover, so coarse pointers get it open from the start */}
      <div className="grid grid-rows-[0fr] transition-[grid-template-rows] duration-600 ease-(--ease-cine) group-hover:grid-rows-[1fr] group-focus-within:grid-rows-[1fr] pointer-coarse:grid-rows-[1fr]">
        <div className="overflow-hidden">
          <div className="px-5 pb-0 transition-[padding] duration-600 ease-(--ease-cine) group-hover:pb-8 group-focus-within:pb-8 pointer-coarse:pb-8 md:pr-10 md:pl-[calc(110px+1.5rem+2.5rem)]">
            <p className="max-w-3xl text-[1.05rem] leading-snug font-medium text-bone md:text-[1.3rem]">
              {row.thesis}
            </p>
            {row.refs.length > 0 && (
              <p className="mt-3.5 font-mono text-label tracking-[0.14em] uppercase">
                <span className="text-dim">links onward → </span>
                {row.refs.map((ref, i) => (
                  <span key={ref.path}>
                    {i > 0 && <span className="text-dim"> · </span>}
                    <Link
                      href={`/${ref.path}`}
                      className="underline-offset-4 hover:underline"
                      style={{ color: ref.accent }}
                    >
                      {ref.no} {ref.title}
                    </Link>
                  </span>
                ))}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function MegaIndex({ rows }: { rows: MegaRowData[] }) {
  return (
    <section aria-label="The archive — index" className="pt-20 pb-24 md:pt-28">
      <div className="mb-10 flex flex-col gap-4 px-5 md:mb-12 md:flex-row md:items-end md:justify-between md:px-10">
        <h2 className="text-display font-black uppercase stretch-125">
          <MaskReveal lines={["The archive"]} inView />
        </h2>
        <div className="max-w-xs font-mono text-label tracking-[0.18em] text-dim uppercase md:text-right">
          <p>
            Open anything. It links onward —
            <br />
            touch a row and its links surface.
          </p>
          <p className="mt-3">
            <HueLegend />
          </p>
        </div>
      </div>

      <div>
        {rows.map((row, i) => (
          <Reveal key={row.path} delay={Math.min(i * 0.05, 0.3)}>
            <MegaRow row={row} />
          </Reveal>
        ))}
      </div>
      <div className="border-t border-line" />
    </section>
  );
}
