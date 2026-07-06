/**
 * THE CITY — San Francisco drawn in layered silhouette, west to east:
 * two ridges of Marin, the Golden Gate with its traffic, the Presidio
 * treeline, the Palace of Fine Arts at the shore, Sutro Tower on Twin
 * Peaks, the Painted Ladies on the slope west of downtown, the financial
 * district (555 California, the Transamerica Pyramid, Salesforce Tower
 * and its night crown, 181 Fremont, Millennium) over a low base of
 * fill buildings, the Ferry Building's clock tower standing in the gap
 * before the Bay Bridge — its west span carrying the Bay
 * Lights at night — running to Treasure Island and the east-span mast,
 * the port cranes of Oakland on the far shore — and the bay in front
 * of it all: Alcatraz sweeping its light,
 * a ferry and a container ship passing, sailboats out when the sun is,
 * gulls in the morning, the fog doing what the fog does, and the
 * cable-car grade in the near foreground.
 *
 * The drawing is scenery; every palette, light and motion is driven by
 * the `scene` prop (night / morning / day / evening) through CSS
 * variables in v2.css. Pure SVG + CSS — no client JS, reduced-motion
 * handled in the stylesheet.
 */

import type { SfCondition } from "@/lib/ops/weather";

export type SceneName = "night" | "morning" | "day" | "evening";

/* deterministic PRNG — same city every render, server and client */
function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* ── stars (night only) — percentage-positioned, full-bleed ── */
const starRand = mulberry32(94117); // a Sunset District zip
const STARS = Array.from({ length: 110 }, (_, i) => ({
  x: (starRand() * 100).toFixed(1),
  y: (starRand() * 62).toFixed(1),
  r: (0.4 + starRand() * 1.0).toFixed(1),
  i,
}));

/* ── golden gate cable geometry ─────────────────────────────
   main span: quadratic from tower top (140,206) to (330,206),
   control (235,330) → sag to ~y 268 mid-span. Suspenders sampled
   off the exact curve so the rhythm is true. */
const GG = { t1: 140, t2: 330, top: 206, deck: 336, ctlY: 330 };
function ggCableY(x: number): number {
  const t = (x - GG.t1) / (GG.t2 - GG.t1);
  return (1 - t) * (1 - t) * GG.top + 2 * (1 - t) * t * GG.ctlY + t * t * GG.top;
}
const GG_SUSPENDERS = Array.from({ length: 13 }, (_, i) => {
  const x = GG.t1 + ((i + 1) * (GG.t2 - GG.t1)) / 14;
  return { x: Math.round(x * 10) / 10, y: Math.round(ggCableY(x) * 10) / 10 };
});
/* the necklace — lights along the main cable, night only */
const GG_LIGHTS = Array.from({ length: 9 }, (_, i) => {
  const x = GG.t1 + ((i + 1) * (GG.t2 - GG.t1)) / 10;
  return { x: Math.round(x), y: Math.round(ggCableY(x)) };
});

/* ── Bay Bridge west span — "The Bay Lights" ───────────────
   Leo Villareal's white LEDs ride the vertical suspenders of the
   west span between the SF anchorage and Yerba Buena, lit at night.
   We trace the three cable segments and hang a strand from the cable
   down to the deck at each station so the necklace runs true. */
const BB = { a: 1196, t1: 1268, t2: 1392, e: 1468, top: 268, deck: 350, aY: 322, eY: 342 };
function bbCableY(x: number): number {
  if (x <= BB.t1) {
    const t = (x - BB.a) / (BB.t1 - BB.a);
    return (1 - t) * (1 - t) * BB.aY + 2 * (1 - t) * t * 350 + t * t * BB.top;
  }
  if (x <= BB.t2) {
    const t = (x - BB.t1) / (BB.t2 - BB.t1);
    return (1 - t) * (1 - t) * BB.top + 2 * (1 - t) * t * 354 + t * t * BB.top;
  }
  const t = (x - BB.t2) / (BB.e - BB.t2);
  return (1 - t) * (1 - t) * BB.top + 2 * (1 - t) * t * 330 + t * t * BB.eY;
}
const BB_STRANDS: { x: number; y: number }[] = [];
for (let x = 1206; x <= 1458; x += 6) {
  if (Math.abs(x - BB.t1) < 7 || Math.abs(x - BB.t2) < 7) continue; // clear the towers
  const y = bbCableY(x);
  if (BB.deck - y < 7) continue; // skip near the anchorages, where the strand is a nub
  BB_STRANDS.push({ x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10 });
}

/* ── lit windows — each grid is generated STRICTLY inside its tower's
   shaft (x..x+w, top..bot), so a lit cell can never float off the
   silhouette into open sky. Non-rectangular landmarks (the pyramid)
   carry no window grid and read by their shape. ─────────────────── */
interface Shaft {
  x: number; w: number; top: number; bot: number; gx: number; gy: number; keep: number;
}
const SHAFTS: Shaft[] = [
  { x: 802, w: 38, top: 266, bot: 402, gx: 8, gy: 11, keep: 0.42 }, // 555 California
  { x: 934, w: 30, top: 170, bot: 400, gx: 8, gy: 12, keep: 0.34 }, // Salesforce
  { x: 986, w: 20, top: 252, bot: 400, gx: 7, gy: 12, keep: 0.32 }, // 181 Fremont
  { x: 1024, w: 30, top: 262, bot: 400, gx: 8, gy: 11, keep: 0.44 }, // Millennium (residential)
];
const winRand = mulberry32(41587); // area codes of the city
const WINDOWS: { x: number; y: number; late: boolean }[] = [];
for (const s of SHAFTS) {
  const cols = Math.max(1, Math.floor(s.w / s.gx) + 1);
  const rows = Math.max(1, Math.floor((s.bot - s.top) / s.gy) + 1);
  const ox = s.x + (s.w - (cols - 1) * s.gx) / 2; // centre the grid in the shaft
  for (let c = 0; c < cols; c++) {
    for (let r = 0; r < rows; r++) {
      const roll = winRand();
      if (roll < s.keep) {
        WINDOWS.push({
          x: Math.round((ox + c * s.gx) * 10) / 10,
          y: s.top + r * s.gy,
          late: roll < s.keep * 0.4,
        });
      }
    }
  }
}

/* the Painted Ladies — a row of Victorians on the Alamo Square slope,
   well WEST of the financial district; their own cluster, never under
   a tower. Stepping down toward downtown. */
const LADIES = Array.from({ length: 6 }, (_, i) => {
  const x = 650 + i * 20;
  return { x, base: 408, h: 46 - i * 3, i };
});

/* a low downtown base — short buildings that fill the gaps between the
   landmark towers and ground the cluster at the waterline */
const BASE = [
  { x: 844, w: 14, h: 18 },
  { x: 966, w: 16, h: 24 },
  { x: 1010, w: 12, h: 16 },
  { x: 1060, w: 20, h: 34 },
  { x: 1083, w: 15, h: 22 },
];

/* Presidio conifers on the bluff east of the toll plaza */
const TREES = [480, 491, 503, 516, 528, 541].map((x, i) => {
  const base = 350 + (x - 480) * 0.78;
  const h = 13 - (i % 3) * 2;
  return { x, base: Math.round(base), h };
});

/* container ship — barge hull + two rows of boxes, drawn once */
const SHIP_BOXES = [
  { x: 12, y: -12, w: 18 }, { x: 34, y: -12, w: 22 }, { x: 60, y: -12, w: 14 },
  { x: 18, y: -6, w: 20 }, { x: 46, y: -6, w: 24 },
];

export default function SfScene({
  scene,
  condition = "clear",
}: {
  scene: SceneName;
  condition?: SfCondition;
}) {
  return (
    <div className="sf-scene" data-scene={scene} data-weather={condition} aria-hidden>
      {/* upper sky — stars, moon, satellite — bleeds the whole stage */}
      <svg className="sf-sky-svg">
        <defs>
          <mask id="sf-mooncut">
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            <circle className="sf-moon-bite" cx="87.2%" cy="14.6%" r="19" fill="black" />
          </mask>
          {/* soft-body fill for clouds/fog — a gradient, never a filter:
              Gaussian blur re-rasterizes every animation frame; this is free */}
          <radialGradient id="sf-cloudsoft">
            <stop className="g-soft-c" offset="0" />
            <stop className="g-soft-m" offset="0.62" />
            <stop className="g-soft-e" offset="1" />
          </radialGradient>
        </defs>
        {/* real-weather cloud bank — drifts in when SF is overcast or wet */}
        <g className="sf-clouds">
          <ellipse cx="18%" cy="20%" rx="200" ry="34" />
          <ellipse cx="52%" cy="13%" rx="240" ry="40" />
          <ellipse cx="83%" cy="24%" rx="180" ry="32" />
          <ellipse cx="36%" cy="30%" rx="170" ry="27" />
        </g>
        <g className="sf-stars">
          {STARS.map((s) => (
            <circle
              key={s.i}
              cx={`${s.x}%`}
              cy={`${s.y}%`}
              r={s.r}
              style={{ ["--i" as string]: s.i % 8 }}
            />
          ))}
        </g>
        <circle className="sf-moon" cx="86%" cy="16%" r="23" mask="url(#sf-mooncut)" />
        <g className="sf-satellite">
          <line x1="-46" y1="14" x2="0" y2="0" />
          <circle r="1.6" />
        </g>
      </svg>

      {/* the city — anchored to the bottom edge, never cropped */}
      <svg
        className="sf-svg"
        viewBox="0 0 1440 520"
        preserveAspectRatio="xMidYMax meet"
        overflow="visible"
      >
        <defs>
          {/* soft-body fill for the fog banks — see sf-cloudsoft */}
          <radialGradient id="sf-fogsoft">
            <stop className="g-soft-c" offset="0" />
            <stop className="g-soft-m" offset="0.62" />
            <stop className="g-soft-e" offset="1" />
          </radialGradient>
          <radialGradient id="sf-sunglow" r="50%">
            <stop offset="0%" stopColor="var(--sf-sun)" stopOpacity="0.9" />
            <stop offset="45%" stopColor="var(--sf-sun)" stopOpacity="0.25" />
            <stop offset="100%" stopColor="var(--sf-sun)" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="sf-cityglow" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--sf-glow)" stopOpacity="0" />
            <stop offset="100%" stopColor="var(--sf-glow)" stopOpacity="0.5" />
          </linearGradient>
          <linearGradient id="sf-beamgrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#fff6dd" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#fff6dd" stopOpacity="0" />
          </linearGradient>
          {/* the bay: bright at the horizon, deepening toward the foreground */}
          <linearGradient id="sf-watergrad" gradientUnits="userSpaceOnUse" x1="0" y1="408" x2="0" y2="540">
            <stop offset="0" stopColor="var(--sf-horizon)" />
            <stop offset="0.16" stopColor="var(--sf-bay-lit)" />
            <stop offset="1" stopColor="var(--sf-bay)" />
          </linearGradient>
          {/* atmospheric haze — transparent up high, the horizon's color low */}
          <linearGradient id="sf-hazegrad" gradientUnits="userSpaceOnUse" x1="0" y1="286" x2="0" y2="412">
            <stop offset="0" stopColor="var(--sf-haze)" stopOpacity="0" />
            <stop offset="1" stopColor="var(--sf-haze)" stopOpacity="0.85" />
          </linearGradient>
          {/* the luminous seam where land meets water */}
          <linearGradient id="sf-horizongrad" gradientUnits="userSpaceOnUse" x1="0" y1="404" x2="0" y2="420">
            <stop offset="0" stopColor="var(--sf-horizon)" stopOpacity="0" />
            <stop offset="0.4" stopColor="var(--sf-horizon)" stopOpacity="1" />
            <stop offset="1" stopColor="var(--sf-horizon)" stopOpacity="0" />
          </linearGradient>
          {/* atmospheric-perspective fills: each depth plane lightens toward
              its base, where the marine layer pools — colors set in CSS so
              they cross-fade with the palette */}
          <linearGradient id="sf-gFar2" gradientUnits="userSpaceOnUse" x1="0" y1="300" x2="0" y2="412">
            <stop className="g-far2-t" offset="0" /><stop className="g-far2-b" offset="1" />
          </linearGradient>
          <linearGradient id="sf-gFar" gradientUnits="userSpaceOnUse" x1="0" y1="296" x2="0" y2="412">
            <stop className="g-far-t" offset="0" /><stop className="g-far-b" offset="1" />
          </linearGradient>
          <linearGradient id="sf-gMid" gradientUnits="userSpaceOnUse" x1="0" y1="320" x2="0" y2="412">
            <stop className="g-mid-t" offset="0" /><stop className="g-mid-b" offset="1" />
          </linearGradient>
          <linearGradient id="sf-gCity" gradientUnits="userSpaceOnUse" x1="0" y1="150" x2="0" y2="412">
            <stop className="g-city-t" offset="0" /><stop className="g-city-b" offset="1" />
          </linearGradient>
          {/* the warm halo a lit city pushes into the night sky */}
          <radialGradient id="sf-bloom" gradientUnits="userSpaceOnUse" cx="935" cy="330" r="360" gradientTransform="scale(1 0.5)">
            <stop offset="0" stopColor="var(--sf-glow)" stopOpacity="0.55" />
            <stop offset="1" stopColor="var(--sf-glow)" stopOpacity="0" />
          </radialGradient>
          {/* a tower's lit face fades from sky-catch at the crown to dark below */}
          <linearGradient id="sf-faceLit" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="var(--sf-edge)" stopOpacity="0.9" />
            <stop offset="1" stopColor="var(--sf-edge)" stopOpacity="0.05" />
          </linearGradient>
          {/* a glimmer column dissolving down into the water */}
          <linearGradient id="sf-glimcol" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="var(--sf-win)" stopOpacity="0.9" />
            <stop offset="1" stopColor="var(--sf-win)" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* the city's own light against the night sky */}
        <rect x="-600" y="180" width="2640" height="230" fill="url(#sf-cityglow)" />
        {/* the warm bloom downtown pushes into the sky — depth behind towers */}
        <rect className="sf-bloom" x="560" y="120" width="760" height="300" fill="url(#sf-bloom)" />

        {/* sun — one element, repositioned per scene by CSS transform */}
        <g className="sf-sun-g">
          <circle className="sf-sun-halo" r="120" fill="url(#sf-sunglow)" />
          <circle className="sf-sun" r="26" />
        </g>

        {/* gulls cross the whole stage when the sun is out */}
        <g className="sf-gulls">
          <g className="sf-gull-a">
            <path className="flap" d="M0 0 Q3.5 -3.5 7 0 M7 0 Q10.5 -3.5 14 0" />
          </g>
          <g className="sf-gull-b">
            <path className="flap" d="M0 0 Q3 -3 6 0 M6 0 Q9 -3 12 0" />
          </g>
        </g>

        {/* ── deepest band: Marin's back ridge + the East Bay shore ── */}
        <path
          className="sf-far2"
          d="M-600 410 L -600 372 Q -300 332 -60 352 Q 60 296 170 338 Q 250 310 310 348 L 340 410 Z"
        />
        <path
          className="sf-far2"
          d="M1150 410 Q 1180 384 1250 372 Q 1330 360 1400 368 Q 1424 371 1440 374 L 2040 380 L 2040 410 Z"
        />
        {/* Oakland's port cranes on that far shore, behind the bridge */}
        <g className="sf-cranes">
          {[1342, 1376, 1416].map((x) => (
            <path
              key={x}
              d={`M${x} 410 V 380 M${x + 9} 410 V 380 M${x - 3} 380 H ${x + 12} M${x + 9} 380 L ${x - 14} 364 M${x + 9} 380 L ${x + 18} 374`}
            />
          ))}
        </g>

        {/* ── far band: Marin headlands (west) ── */}
        <path
          className="sf-far"
          d="M-600 360 L -600 410 L 300 410 L 268 372 Q 232 344 188 330 Q 144 312 96 306 Q 50 296 0 326 Q -300 350 -600 360 Z"
        />

        {/* ── the Golden Gate ── */}
        <g className="sf-gg">
          {/* deck — runs off toward the toll plaza */}
          <rect x="-600" y={GG.deck} width="1074" height="5" />
          {/* south approach down to the bluff */}
          <path d="M452 336 L 500 348 L 540 362 L 540 410 L 430 410 L 430 341 Z" className="sf-far" />
          {/* towers — twin legs, struts, stepped art-deco crowns */}
          {[GG.t1, GG.t2].map((tx) => (
            <g key={tx}>
              <rect x={tx - 8.5} y="206" width="6" height="130" />
              <rect x={tx + 2.5} y="206" width="6" height="130" />
              {[218, 244, 272, 302].map((sy) => (
                <rect key={sy} x={tx - 8.5} y={sy} width="17" height="4.5" />
              ))}
              <rect x={tx - 10} y="199" width="20" height="7" />
              <rect x={tx - 7} y="193" width="14" height="6" />
              <rect x={tx - 4} y="188" width="8" height="5" />
            </g>
          ))}
          {/* cables: side spans rise from the deck, main span sags */}
          <path d="M-30 334 C 50 252 100 212 140 206" className="sf-cable" />
          <path d={`M${GG.t1} ${GG.top} Q 235 ${GG.ctlY} ${GG.t2} ${GG.top}`} className="sf-cable" />
          <path d="M330 206 C 376 214 430 300 470 334" className="sf-cable" />
          {GG_SUSPENDERS.map((s) => (
            <line key={s.x} x1={s.x} y1={s.y} x2={s.x} y2={GG.deck} className="sf-suspender" />
          ))}
          {/* traffic takes the span — headlights west, taillights east */}
          <g className="sf-traffic">
            <path className="t-head" d="M474 334.5 H -600" />
            <path className="t-tail" d="M-600 338.5 H 474" />
          </g>
          {/* beacons + cable necklace, lit by CSS at night */}
          <circle cx={GG.t1} cy="184" r="1.8" className="sf-beacon" />
          <circle cx={GG.t2} cy="184" r="1.8" className="sf-beacon" />
          <g className="sf-necklace">
            {GG_LIGHTS.map((l) => (
              <circle key={l.x} cx={l.x} cy={l.y} r="1.1" />
            ))}
          </g>
        </g>

        {/* Presidio conifers on the bluff */}
        <g className="sf-trees">
          {TREES.map((t) => (
            <path
              key={t.x}
              d={`M${t.x - 5} ${t.base} L ${t.x} ${t.base - t.h} L ${t.x + 5} ${t.base} Z M${t.x - 3.4} ${t.base - t.h * 0.45} L ${t.x} ${t.base - t.h - 4} L ${t.x + 3.4} ${t.base - t.h * 0.45} Z`}
            />
          ))}
        </g>

        {/* atmospheric haze — veils everything behind it (Marin, the Gate,
            the far shore) so the near city reads forward of the distance */}
        <rect className="sf-haze-veil" x="-600" y="286" width="2640" height="126" />

        {/* ── mid band: Twin Peaks, Sutro, the hills into downtown ── */}
        <path
          className="sf-mid"
          d="M520 410 L 520 372 Q 556 340 600 332 Q 640 326 664 344 L 700 368 Q 730 384 756 392 L 780 410 Z"
        />
        <g className="sf-sutro">
          {/* three masts off the waist — the trident */}
          <path d="M586 332 L 593 250 L 593 196 M614 332 L 607 250 L 607 196 M600 322 L 600 188" />
          <line x1="589" y1="252" x2="611" y2="252" />
          <line x1="591" y1="222" x2="609" y2="222" />
          <line x1="593" y1="196" x2="607" y2="196" />
          <circle cx="600" cy="186" r="1.6" className="sf-beacon" />
        </g>

        {/* the Palace of Fine Arts at the shore, under the bluff */}
        <g className="sf-palace">
          <rect x="498" y="393" width="62" height="3" />
          {[500, 511, 522, 533, 544, 555].map((cx) => (
            <rect key={cx} x={cx} y="396" width="2.6" height="12" />
          ))}
          <rect x="514" y="389" width="30" height="5" />
          <path d="M512 389 A 16 16 0 0 1 544 389 Z" />
        </g>

        {/* ── the Painted Ladies — Victorians on the Alamo Square slope,
            west of downtown; their own cluster, never under a tower ── */}
        <g className="sf-ladies">
          <path d="M632 410 L 632 401 Q 706 393 778 399 L 778 410 Z" className="sf-mid" />
          {LADIES.map((l) => {
            const top = l.base - l.h;
            return (
              <g key={l.i}>
                <rect x={l.x} y={top} width="16" height={l.h} />
                <path d={`M${l.x - 1.5} ${top} L ${l.x + 8} ${top - 9} L ${l.x + 17.5} ${top} Z`} />
                <rect x={l.x + 3} y={top + 6} width="4" height="6" className="sf-lady-win" />
                <rect x={l.x + 9} y={top + 6} width="4" height="6" className="sf-lady-win" />
                <rect x={l.x + 6} y={l.base - 11} width="4" height="6" className="sf-lady-win" />
              </g>
            );
          })}
        </g>

        {/* ── downtown — the financial district. Each landmark is a clean,
            well-separated silhouette so it reads on its own; a low base
            grounds the cluster, and every window sits inside a shaft ── */}
        <g className="sf-city">
          {/* the low base that fills the gaps and meets the waterline */}
          {BASE.map((b) => (
            <rect key={b.x} x={b.x} y={410 - b.h} width={b.w} height={b.h} />
          ))}

          {/* 555 California Street — dark fluted slab, flat mechanical crown */}
          <rect x="800" y="252" width="42" height="158" />
          <rect x="809" y="244" width="24" height="9" />
          <path d="M806 252 V410 M814 252 V410 M822 252 V410 M830 252 V410 M838 252 V410" className="sf-flute" />

          {/* Transamerica Pyramid — pyramid, wings, spire (reads by shape) */}
          <path d="M858 410 L 873 396 L 887 218 Q 888 211 889 218 L 903 396 L 918 410 Z" />
          <rect x="868" y="300" width="5" height="96" />
          <rect x="903" y="300" width="5" height="96" />
          <line x1="888" y1="218" x2="888" y2="180" className="sf-spire" />
          <circle cx="888" cy="178" r="1.6" className="sf-beacon" />

          {/* Salesforce Tower — tallest, round-shouldered tube + LED crown */}
          <path d="M930 410 V 162 Q 930 142 948 142 Q 966 142 966 162 V 410 Z" />
          <g className="sf-crown">
            {[0, 1, 2, 3, 4].map((i) => (
              <rect key={i} x={932 + i * 7} y="146" width="4" height="10" style={{ ["--i" as string]: i }} />
            ))}
          </g>

          {/* 181 Fremont — tapered shaft with an exposed structural crown */}
          <path d="M984 410 V 236 L 992 214 L 1000 214 L 1008 236 V 410 Z" />
          <path d="M992 214 V 203 M996 214 V 198 M1000 214 V 203" className="sf-spire" />

          {/* Millennium Tower — flat residential slab + rooftop penthouse */}
          <rect x="1022" y="250" width="34" height="160" />
          <rect x="1030" y="244" width="18" height="6" />

          {/* rooftop antenna + beacon on 555 California */}
          <line x1="819" y1="244" x2="819" y2="226" className="sf-antenna" />
          <circle cx="819" cy="224" r="1.5" className="sf-beacon" />

          {/* lit faces — a sky-catching east edge + a shaded west face give
              the headline slabs volume */}
          <rect x="800" y="252" width="7" height="158" className="sf-shade" />
          <rect x="835" y="252" width="7" height="158" className="sf-edge" />
          <rect x="930" y="162" width="8" height="248" className="sf-shade" />
          <rect x="958" y="152" width="8" height="258" className="sf-edge" />
          <rect x="1004" y="236" width="4" height="174" className="sf-edge" />
          <rect x="1050" y="250" width="6" height="160" className="sf-edge" />

          {/* lit windows — strictly inside each shaft; opacity is the scene's */}
          <g className="sf-windows">
            {WINDOWS.filter((w) => !w.late).map((w, i) => (
              <rect key={i} x={w.x} y={w.y} width="3" height="4" />
            ))}
          </g>
          <g className="sf-windows sf-windows-late">
            {WINDOWS.filter((w) => w.late).map((w, i) => (
              <rect key={i} x={w.x} y={w.y} width="3" height="4" />
            ))}
          </g>
        </g>

        {/* (Telegraph Hill + Coit Tower removed — read ambiguously at this
            scale. The Ferry Building is now drawn in front of the Bay
            Bridge, further below, so the bridge sweeps behind its tower.) */}

        {/* (the arched pier sheds that flanked the Ferry Building were
            removed — they crowded it and the Bay Bridge tower) */}

        {/* Treasure Island under the bridge's east run */}
        <g className="sf-far">
          <path d="M1404 410 Q 1436 392 1472 395 Q 1502 397 1516 410 Z" className="sf-far" />
          <g className="sf-windows">
            <rect x="1438" y="399" width="2.5" height="3" />
            <rect x="1452" y="397" width="2.5" height="3" />
            <rect x="1466" y="399" width="2.5" height="3" />
          </g>
        </g>

        {/* ── Bay Bridge, east — west spans, then the new single mast ── */}
        <g className="sf-baybridge">
          <rect x="1196" y="350" width="844" height="4.5" />
          {[1268, 1392].map((tx) => (
            <g key={tx}>
              <rect x={tx - 5} y="266" width="3.8" height="88" />
              <rect x={tx + 1.2} y="266" width="3.8" height="88" />
              <rect x={tx - 6} y="262" width="12" height="4" />
              {[286, 312, 336].map((sy) => (
                <rect key={sy} x={tx - 5} y={sy} width="10.2" height="3" />
              ))}
              <circle cx={tx} cy="258" r="1.6" className="sf-beacon" />
            </g>
          ))}
          <path d="M1196 322 Q 1232 350 1268 268 M1268 268 Q 1330 354 1392 268 M1392 268 Q 1430 330 1468 342" className="sf-cable" />
          {/* vertical suspenders — faint structure in every scene */}
          <g className="sf-bb-susp">
            {BB_STRANDS.map((s) => (
              <line key={s.x} x1={s.x} y1={s.y} x2={s.x} y2={BB.deck} />
            ))}
          </g>
          {/* The Bay Lights — white LED strands that come up at night and
              shimmer west→east across the span, evoking Leo Villareal's
              2013 installation on the west-span cables */}
          <g className="sf-baylights">
            {BB_STRANDS.map((s, i) => (
              <line key={s.x} x1={s.x} y1={s.y} x2={s.x} y2={BB.deck} style={{ ["--i" as string]: i }} />
            ))}
          </g>
          {/* the self-anchored mast east of Yerba Buena */}
          <rect x="1524" y="256" width="5" height="94" />
          <circle cx="1526.5" cy="252" r="1.6" className="sf-beacon" />
          <path d="M1526 260 L 1448 350 M1526 264 L 1474 350 M1526 268 L 1500 350 M1527 260 L 1604 350 M1527 264 L 1578 350 M1527 268 L 1552 350" className="sf-fan" />
          {/* two-way traffic on the deck */}
          <g className="sf-traffic">
            <path className="t-head" d="M2040 349 H 1196" />
            <path className="t-tail" d="M1196 353 H 2040" />
          </g>
        </g>

        {/* ── the Ferry Building — the long Beaux-Arts arcade and its
            Giralda-inspired clock tower at the foot of Market Street;
            drawn here, after the bridge, so the Bay Bridge sweeps behind
            its tower (the postcard view) ── */}
        <g className="sf-city">
          {/* the long two-storey arcade + its cornice */}
          <rect x="1096" y="389" width="116" height="21" />
          <rect x="1094" y="385" width="120" height="4" />
          {/* the clock tower: shaft, belfry, hipped roof, flagpole */}
          <rect x="1142" y="316" width="18" height="74" />
          <rect x="1138" y="309" width="26" height="8" />
          <rect x="1145" y="296" width="12" height="13" />
          <rect x="1143" y="292" width="16" height="4" />
          <path d="M1145 292 L 1151 282 L 1157 292 Z" />
          <line x1="1151" y1="282" x2="1151" y2="274" className="sf-spire" />
          <circle cx="1151" cy="273" r="1.4" className="sf-beacon" />
        </g>
        {/* the lit clock + the arcade marketplace glow — night-driven,
            like the city's windows */}
        <g className="sf-windows">
          {/* the four-faced clock high on the tower */}
          <rect x="1146" y="320" width="10" height="10" rx="1.5" />
          {/* the arcade glow, either side of the tower */}
          {[1101, 1110, 1119, 1128, 1174, 1183, 1192, 1201].map((wx) => (
            <rect key={wx} x={wx} y="396" width="4" height="10" />
          ))}
        </g>

        {/* ── the bay — wider than any screen ── */}
        <rect className="sf-bay" x="-600" y="410" width="2640" height="130" />
        {/* the luminous seam where the city's feet meet the water */}
        <rect className="sf-horizon-line" x="-600" y="404" width="2640" height="16" />
        <g className="sf-refl">
          <path d="M60 424 h26 M130 432 h34 M236 420 h22 M320 438 h30 M450 446 h26 M520 426 h24 M700 434 h28 M880 422 h32 M940 444 h24 M1010 430 h22 M1150 424 h30 M1240 442 h20 M1290 436 h26 M1380 422 h22" />
        </g>
        {/* downtown pours its light into the water */}
        <g className="sf-glimmer">
          {[
            { x: 818, h: 30 }, { x: 884, h: 24 }, { x: 946, h: 38 },
            { x: 992, h: 28 }, { x: 1022, h: 33 }, { x: 1151, h: 22 },
          ].map((g, i) => (
            <rect key={g.x} x={g.x} y="413" width="2" height={g.h} style={{ ["--i" as string]: i }} />
          ))}
        </g>

        {/* ── Alcatraz — the rock holds its light over the water ── */}
        <g className="sf-alcatraz">
          <g className="sf-beam-g">
            <path d="M588 404 L 836 374 L 836 430 Z" fill="url(#sf-beamgrad)" />
          </g>
          <path
            className="rock"
            d="M520 488 Q 548 462 584 456 Q 622 450 652 460 Q 672 466 684 478 L 690 492 Q 600 503 514 495 Z"
          />
          <rect className="house" x="556" y="436" width="56" height="22" rx="1" />
          <g>
            {[562, 570, 578, 594, 602].map((wx) => (
              <rect key={wx} className="cell-win" x={wx} y="444" width="2.6" height="3.4" />
            ))}
          </g>
          {/* the water tower */}
          <line x1="630" y1="436" x2="633" y2="416" />
          <line x1="644" y1="436" x2="641" y2="416" />
          <rect className="house" x="629" y="406" width="16" height="11" rx="2" />
          {/* the lighthouse */}
          <rect className="house" x="584" y="408" width="7" height="30" />
          <rect className="house" x="581.5" y="405" width="12" height="3.4" />
          <circle className="sf-beacon" cx="587.5" cy="402" r="2.2" />
        </g>

        {/* the ferry, crossing east to west */}
        <g className="sf-ferry">
          <path d="M0 0 L 30 0 L 26 6 L 4 6 Z" />
          <rect x="7" y="-6" width="16" height="6" rx="1" />
          <rect x="10" y="-4" width="3" height="2.4" className="sf-ferry-win" />
          <rect x="16" y="-4" width="3" height="2.4" className="sf-ferry-win" />
        </g>

        {/* a container ship takes the deep channel the other way */}
        <g className="sf-ship">
          {SHIP_BOXES.map((b) => (
            <rect key={`${b.x}-${b.y}`} className="box" x={b.x} y={b.y} width={b.w} height="5.4" rx="0.5" />
          ))}
          <path className="hull" d="M0 0 H 96 L 89 12 H 9 Z" />
          <rect className="castle" x="76" y="-17" width="13" height="17" rx="1" />
          <rect className="ship-win" x="78.5" y="-14.5" width="8" height="2.6" />
        </g>

        {/* sailboats, out when the sun is */}
        <g className="sf-sails">
          {[
            { x: 790, y: 452, s: 1 },
            { x: 1002, y: 446, s: 0.85 },
            { x: 1214, y: 456, s: 1.1 },
          ].map((b) => (
            /* outer g holds position — the bob animation owns the inner
               transform, so it must not share an element with translate */
            <g key={b.x} transform={`translate(${b.x} ${b.y}) scale(${b.s})`}>
              <g className="sf-sail-g">
                <path className="sail" d="M0 -16 L 0 -2 L -7.5 -2 Z" />
                <path className="sail" d="M1 -14 L 6.5 -2 L 1 -2 Z" />
                <path className="hull" d="M-9 0 Q 0 4 9 0 L 7 3.4 H -7 Z" />
              </g>
            </g>
          ))}
        </g>

        {/* ── fog — Karl, drawn three times, plus the marine band that
            rolls across the whole front when SF is really socked in ── */}
        <g className="sf-fog">
          <ellipse className="sf-fog-gate" cx="240" cy="330" rx="290" ry="48" />
          <ellipse className="sf-fog-low" cx="520" cy="372" rx="340" ry="34" />
          <ellipse className="sf-fog-city" cx="900" cy="300" rx="350" ry="44" />
        </g>
        <g className="sf-marine">
          <ellipse cx="500" cy="356" rx="1150" ry="60" />
          <ellipse cx="980" cy="338" rx="950" ry="52" />
        </g>

        {/* ── foreground: the cable-car grade ── */}
        <g className="sf-front">
          <path d="M-600 520 L -600 436 L 96 428 Q 150 430 208 446 Q 300 472 380 500 L 420 520 Z" />
          {/* three bay-window houses on the grade */}
          <g className="sf-front-houses">
            <rect x="20" y="398" width="26" height="34" />
            <path d="M18 398 L 33 388 L 48 398 Z" />
            <rect x="60" y="402" width="24" height="28" />
            <path d="M58 402 L 72 393 L 86 402 Z" />
            <rect x="98" y="408" width="22" height="24" />
            <path d="M96 408 L 109 400 L 122 408 Z" />
            <rect x="27" y="406" width="5" height="7" className="sf-lady-win" />
            <rect x="67" y="409" width="5" height="7" className="sf-lady-win" />
          </g>
          {/* overhead wire + track */}
          <path d="M120 414 L 360 478" className="sf-wire" />
          <path d="M128 432 L 352 492" className="sf-track" />
          {/* the car itself — animated along the grade in CSS */}
          <g className="sf-cablecar">
            <g transform="rotate(15.2) scale(1.3)">
              <rect className="sf-car-body" x="-22" y="-16" width="44" height="14" rx="3" />
              <rect x="-19" y="-13" width="9" height="7" className="sf-car-win" />
              <rect x="-7" y="-13" width="9" height="7" className="sf-car-win" />
              <rect x="5" y="-13" width="9" height="7" className="sf-car-win" />
              <path className="sf-car-body" d="M-24 -2 L 24 -2 L 20 2 L -20 2 Z" />
              <line x1="0" y1="-16" x2="-6" y2="-30" className="sf-trolleypole" />
            </g>
          </g>
          {/* a streetlamp at the crest */}
          <path d="M150 436 V 414 q 0 -6 6 -6" className="sf-lamppost" />
          <circle cx="158" cy="408" r="2.2" className="sf-lamp" />
        </g>
      </svg>

      {/* real-weather rain — a cheap, convincing streak overlay */}
      <div className="sf-rain" />
    </div>
  );
}
