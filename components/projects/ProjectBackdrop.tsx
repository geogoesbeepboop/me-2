import type { ReactNode } from "react";

/**
 * ────────────────────────────────────────────────────────────────────
 * PROJECT BACKDROP — the dossier's vibe, drawn faint.
 *
 * Each project gets one piece of line art behind its landing header,
 * in its own accent, at whisper opacity — a DJ deck behind the booth,
 * pantry shelves behind the groceries, a candlestick wall behind the
 * analyst. If you notice it, it
 * should please you; it must never compete with the content. Replaces
 * the bench-grid texture in the header zone for slugs that have art;
 * unknown slugs keep the grid.
 *
 * Server component — pure SVG, no client JS.
 * ────────────────────────────────────────────────────────────────────
 */

const S = {
  fill: "none",
  stroke: "var(--accent)",
  strokeWidth: 1.4,
} as const;

/** two platters and a mixer — the booth */
function DjDeck() {
  return (
    <svg viewBox="0 0 760 420" preserveAspectRatio="xMaxYMid slice" className="h-full w-full">
      {/* platters */}
      {[
        { cx: 180, cy: 210 },
        { cx: 580, cy: 210 },
      ].map(({ cx, cy }) => (
        <g key={cx} {...S}>
          <circle cx={cx} cy={cy} r={140} />
          <circle cx={cx} cy={cy} r={104} opacity={0.7} />
          <circle cx={cx} cy={cy} r={68} opacity={0.5} />
          <circle cx={cx} cy={cy} r={14} />
          {/* stylus arm */}
          <path d={`M ${cx + 150} ${cy - 150} l -36 64 l -22 12`} />
          <circle cx={cx + 150} cy={cy - 150} r={7} />
        </g>
      ))}
      {/* mixer between the decks */}
      <g {...S}>
        <rect x={330} y={120} width={100} height={180} rx={3} />
        {[352, 380, 408].map((x) => (
          <g key={x}>
            <line x1={x} y1={140} x2={x} y2={250} opacity={0.6} />
            <rect x={x - 7} y={172 + (x % 3) * 18} width={14} height={8} />
          </g>
        ))}
        {/* crossfader */}
        <line x1={344} y1={278} x2={416} y2={278} opacity={0.6} />
        <rect x={368} y={272} width={12} height={12} />
      </g>
    </svg>
  );
}

/** shelves, jars and cartons — the pantry */
function PantryShelves() {
  return (
    <svg viewBox="0 0 760 420" preserveAspectRatio="xMaxYMid slice" className="h-full w-full">
      <g {...S}>
        {/* three shelves */}
        {[150, 260, 370].map((y) => (
          <line key={y} x1={90} y1={y} x2={730} y2={y} />
        ))}
        {/* shelf 1 — jars and a bottle */}
        <rect x={140} y={92} width={48} height={58} rx={4} />
        <rect x={148} y={80} width={32} height={12} rx={2} />
        <rect x={216} y={104} width={42} height={46} rx={4} opacity={0.7} />
        <path d="M 310 150 v -34 q 0 -10 8 -14 v -14 h 12 v 14 q 8 4 8 14 v 34 z" />
        {/* egg carton */}
        <rect x={400} y={122} width={86} height={28} rx={3} />
        {[414, 432, 450, 468].map((x) => (
          <path key={x} d={`M ${x} 122 a 8 8 0 0 1 16 0`} opacity={0.6} />
        ))}
        {/* shelf 2 — cans and a box */}
        {[150, 196].map((x) => (
          <g key={x} opacity={0.8}>
            <rect x={x} y={214} width={34} height={46} />
            <ellipse cx={x + 17} cy={214} rx={17} ry={5} />
          </g>
        ))}
        <rect x={272} y={200} width={64} height={60} />
        <line x1={272} y1={216} x2={336} y2={216} opacity={0.5} />
        <path d="M 420 260 v -44 q 0 -8 7 -11 v -10 h 10 v 10 q 7 3 7 11 v 44 z" opacity={0.7} />
        {/* shelf 3 — bags */}
        <path d="M 160 370 l 6 -44 h 46 l 6 44 z" />
        <path d="M 250 370 l 5 -36 h 38 l 5 36 z" opacity={0.6} />
        <rect x={340} y={322} width={50} height={48} rx={4} opacity={0.8} />
      </g>
    </svg>
  );
}

/** a candlestick wall and the price of one memo — the desk */
function MarketWall() {
  // candles: [x, wickTop, bodyTop, bodyH, wickBottom]
  const candles: [number, number, number, number, number][] = [
    [120, 300, 318, 36, 372],
    [165, 270, 290, 44, 352],
    [210, 286, 302, 30, 348],
    [255, 240, 258, 48, 322],
    [300, 220, 236, 40, 292],
    [345, 238, 250, 30, 296],
    [390, 196, 212, 44, 270],
    [435, 170, 188, 38, 240],
    [480, 188, 200, 28, 242],
    [525, 150, 164, 42, 220],
  ];
  return (
    <svg viewBox="0 0 760 420" preserveAspectRatio="xMaxYMid slice" className="h-full w-full">
      <g {...S}>
        {candles.map(([x, wt, bt, bh, wb], i) => (
          <g key={x} opacity={i % 3 === 1 ? 0.6 : 1}>
            <line x1={x} y1={wt} x2={x} y2={wb} />
            <rect x={x - 9} y={bt} width={18} height={bh} />
          </g>
        ))}
        {/* the trend through them */}
        <path d="M 100 340 L 230 312 L 320 262 L 430 212 L 560 160" opacity={0.5} />
        {/* the status code that pays for it all */}
        <text
          x={640}
          y={170}
          textAnchor="middle"
          fontSize={150}
          fontFamily="var(--font-mono)"
          fill="none"
          stroke="var(--accent)"
          strokeWidth={1.4}
          opacity={0.55}
        >
          402
        </text>
        {/* a coin */}
        <circle cx={642} cy={300} r={52} />
        <circle cx={642} cy={300} r={40} opacity={0.6} />
        <text
          x={642}
          y={314}
          textAnchor="middle"
          fontSize={40}
          fontFamily="var(--font-mono)"
          fill="none"
          stroke="var(--accent)"
          strokeWidth={1.4}
        >
          $
        </text>
      </g>
    </svg>
  );
}

/** one card, locked to its rails — the desk that cannot spend */

const ART: Record<string, ReactNode> = {
  "dj-agent": <DjDeck />,
  "grocery-buddy": <PantryShelves />,
  jim: <MarketWall />,
};

export function hasBackdrop(slug: string): boolean {
  return slug in ART;
}

export default function ProjectBackdrop({ slug }: { slug: string }) {
  const art = ART[slug];
  if (!art) return null;
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-y-0 right-0 hidden w-[68%] overflow-hidden opacity-[0.21] sm:block md:w-[52%]"
      style={{
        maskImage:
          "linear-gradient(to left, black 45%, transparent 97%)",
        WebkitMaskImage:
          "linear-gradient(to left, black 45%, transparent 97%)",
      }}
    >
      {art}
    </div>
  );
}
