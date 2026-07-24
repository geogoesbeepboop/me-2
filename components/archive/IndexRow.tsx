import Link from "next/link";

/**
 * ────────────────────────────────────────────────────────────────────
 * SIGNATURE INTERACTION — "INDEX → DOSSIER"  (chosen over a dynamic
 * layout system; committed everywhere.)
 *
 * The archive reads as a flat mono index until you touch it. On hover
 * or keyboard focus a row INVERTS — bone field, void type — an accent
 * bar drops down the left edge in the project's own color, and a
 * clipped second layer opens a crack (grid-rows 0fr→1fr): the thesis
 * line and dense metadata slide into view while the title physically
 * widens along Archivo's wdth axis. Click cuts to the dossier with a
 * full-bleed wipe (see app/template.tsx). The same reveal runs on
 * "/", /projects and /writing — it IS the navigation.
 *
 * The wdth axis carries exactly one pointer meaning on this site:
 * titles WIDEN on touch (here, and in landing2's mega index and
 * method band). Kinetic hero type was tried twice and cut —
 * pointer-following read as lag, idle breathing read as floating.
 * Display type holds still; only touch moves it.
 * ────────────────────────────────────────────────────────────────────
 */
export interface IndexRowProps {
  no: string;
  tag: string;
  href: string;
  title: string;
  /** right column: year, updated stamp, or read time */
  primaryMeta: string;
  status: string;
  /** ALWAYS-VISIBLE evidence line under the title — domain + one real
   *  metric. The hover reveal is the flourish; this line is the scan.
   *  Without it, touch devices (no hover) see only codenames. */
  signal?: string;
  /** the hidden layer: one-line thesis */
  thesis: string;
  /** the hidden layer: dense mono metadata */
  secondary: string;
  /** project/track accent color */
  accent: string;
  live?: boolean;
  /** lab rows get dashed hairlines — the workbench track */
  dashed?: boolean;
}

export default function IndexRow({
  no,
  tag,
  href,
  title,
  primaryMeta,
  status,
  signal,
  thesis,
  secondary,
  accent,
  live,
  dashed,
}: IndexRowProps) {
  const cols =
    "grid grid-cols-[1fr_auto] items-baseline gap-x-4 md:grid-cols-[72px_64px_1fr_120px_140px_28px]";

  return (
    <Link
      href={href}
      style={{ "--accent": accent } as React.CSSProperties}
      className={`group relative block border-t ${
        dashed ? "border-dashed" : ""
      } border-line transition-colors duration-500 ease-(--ease-cine) hover:bg-bone hover:text-void focus-visible:bg-bone focus-visible:text-void focus-visible:outline-none`}
    >
      {/* accent bar — the project's color drops in on touch */}
      <span
        aria-hidden
        className="absolute top-0 bottom-0 left-0 w-[3px] origin-top scale-y-0 bg-(--accent) transition-transform duration-500 ease-(--ease-cine) group-hover:scale-y-100 group-focus-visible:scale-y-100"
      />

      <div className={`${cols} px-5 py-6 md:px-10 md:py-7`}>
        <span className="hidden font-mono text-mono-sm text-dim transition-colors duration-500 group-hover:text-void/55 group-focus-visible:text-void/55 md:block">
          {no}
        </span>
        <span className="hidden items-center gap-2 font-mono text-label tracking-[0.18em] uppercase md:flex">
          {live && <span className="live-dot" aria-hidden />}
          <span className="text-(--accent)">{tag}</span>
        </span>
        <div className="min-w-0">
          <h3 className="text-title font-bold uppercase transition-[font-stretch] duration-700 ease-(--ease-cine) group-hover:stretch-110 group-focus-visible:stretch-110">
            <span className="mr-3 font-mono text-label md:hidden">
              <span className="text-dim">{no} · </span>
              <span className="text-(--accent)">{tag}</span>
            </span>
            {title}
          </h3>
          {signal && (
            <p className="mt-1.5 font-mono text-label tracking-[0.14em] text-dim uppercase transition-colors duration-500 group-hover:text-void/60 group-focus-visible:text-void/60">
              {signal}
            </p>
          )}
        </div>
        <span className="text-right font-mono text-mono-sm text-ash transition-colors duration-500 group-hover:text-void/70 group-focus-visible:text-void/70">
          {primaryMeta}
        </span>
        <span className="hidden text-right font-mono text-label tracking-[0.18em] text-dim uppercase transition-colors duration-500 group-hover:text-void/55 group-focus-visible:text-void/55 md:block">
          {status}
        </span>
        <span
          aria-hidden
          className="hidden text-right font-mono text-mono-sm text-dim transition-all duration-500 ease-(--ease-cine) group-hover:translate-x-1.5 group-hover:text-void group-focus-visible:translate-x-1.5 group-focus-visible:text-void md:block"
        >
          →
        </span>
      </div>

      {/* the hidden layer — opens a crack on hover/focus */}
      <div className="grid grid-rows-[0fr] transition-[grid-template-rows] duration-600 ease-(--ease-cine) group-hover:grid-rows-[1fr] group-focus-visible:grid-rows-[1fr]">
        <div className="overflow-hidden">
          <div className={`${cols} px-5 pb-0 group-hover:pb-7 group-focus-visible:pb-7 transition-[padding] duration-600 ease-(--ease-cine) md:px-10`}>
            <span className="hidden md:block" />
            <span className="hidden md:block" />
            <div className="col-span-full md:col-span-1 md:col-start-3">
              <p className="max-w-2xl text-[1.05rem] leading-snug font-medium md:text-[1.25rem]">
                {thesis}
              </p>
              <p className="mt-3 font-mono text-label tracking-[0.12em] text-void/55 uppercase">
                {secondary}
              </p>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
