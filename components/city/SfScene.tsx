/**
 * THE CITY — San Francisco drawn in silhouette, west to east:
 * Marin headlands, the Golden Gate, Sutro Tower on Twin Peaks, a
 * painted-ladies hill, downtown (555 California, the Transamerica
 * Pyramid, Salesforce Tower and its night crown), Coit Tower, the
 * Ferry Building, the piers, the Bay Bridge, Oracle Park and Chase
 * Center — with the bay in front, a ferry crossing it, a cable-car
 * grade in the near foreground and the fog doing what the fog does.
 *
 * The drawing is scenery; every palette, light and motion is driven by
 * the `scene` prop (night / morning / day / evening) through CSS
 * variables in v2.css. Pure SVG + CSS — no client JS, reduced-motion
 * handled in the stylesheet.
 */

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

/* ── lit windows, hand-gridded per tower, PRNG-thinned ────── */
interface TowerGrid {
  x: number; y: number; cols: number; rows: number; sx: number; sy: number; keep: number;
}
const TOWERS: TowerGrid[] = [
  { x: 806, y: 262, cols: 5, rows: 14, sx: 7, sy: 10, keep: 0.34 }, // 555 California
  { x: 935, y: 152, cols: 4, rows: 22, sx: 7, sy: 11, keep: 0.3 }, // Salesforce
  { x: 873, y: 250, cols: 2, rows: 12, sx: 8, sy: 12, keep: 0.3 }, // Transamerica shaft
  { x: 984, y: 218, cols: 3, rows: 16, sx: 7, sy: 11, keep: 0.28 }, // 181 Fremont
  { x: 1014, y: 248, cols: 3, rows: 13, sx: 7, sy: 11, keep: 0.3 }, // Millennium
  { x: 768, y: 300, cols: 3, rows: 9, sx: 7, sy: 11, keep: 0.3 }, // back slab west
  { x: 1052, y: 296, cols: 2, rows: 9, sx: 7, sy: 11, keep: 0.32 }, // back slab east
];
const winRand = mulberry32(41587); // area codes of the city
const WINDOWS: { x: number; y: number; late: boolean }[] = [];
for (const t of TOWERS) {
  for (let c = 0; c < t.cols; c++) {
    for (let r = 0; r < t.rows; r++) {
      const roll = winRand();
      if (roll < t.keep) {
        WINDOWS.push({ x: t.x + c * t.sx, y: t.y + r * t.sy, late: roll < t.keep * 0.45 });
      }
    }
  }
}

/* painted-ladies row — six gabled bays stepping down the hill */
const LADIES = Array.from({ length: 6 }, (_, i) => {
  const x = 656 + i * 17;
  const base = 386 + i * 2.4;
  const h = 30 - i * 1.2;
  return { x, base, h, i };
});

export default function SfScene({ scene }: { scene: SceneName }) {
  return (
    <div className="sf-scene" data-scene={scene} aria-hidden>
      {/* upper sky — stars, moon, satellite — bleeds the whole stage */}
      <svg className="sf-sky-svg">
        <defs>
          <mask id="sf-mooncut">
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            <circle className="sf-moon-bite" cx="87.2%" cy="14.6%" r="19" fill="black" />
          </mask>
        </defs>
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
          <filter id="sf-fog" x="-40%" y="-200%" width="180%" height="500%">
            <feGaussianBlur stdDeviation="16" />
          </filter>
          <radialGradient id="sf-sunglow" r="50%">
            <stop offset="0%" stopColor="var(--sf-sun)" stopOpacity="0.9" />
            <stop offset="45%" stopColor="var(--sf-sun)" stopOpacity="0.25" />
            <stop offset="100%" stopColor="var(--sf-sun)" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="sf-cityglow" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--sf-glow)" stopOpacity="0" />
            <stop offset="100%" stopColor="var(--sf-glow)" stopOpacity="0.5" />
          </linearGradient>
        </defs>

        {/* the city's own light against the night sky */}
        <rect x="-600" y="180" width="2640" height="230" fill="url(#sf-cityglow)" />

        {/* sun — one element, repositioned per scene by CSS transform */}
        <g className="sf-sun-g">
          <circle className="sf-sun-halo" r="120" fill="url(#sf-sunglow)" />
          <circle className="sf-sun" r="26" />
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
          {/* beacons + cable necklace, lit by CSS at night */}
          <circle cx={GG.t1} cy="184" r="1.8" className="sf-beacon" />
          <circle cx={GG.t2} cy="184" r="1.8" className="sf-beacon" />
          <g className="sf-necklace">
            {GG_LIGHTS.map((l) => (
              <circle key={l.x} cx={l.x} cy={l.y} r="1.1" />
            ))}
          </g>
        </g>

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

        {/* painted ladies on their slope */}
        <g className="sf-ladies">
          <path d="M640 410 L 640 392 L 768 404 L 768 410 Z" className="sf-mid" />
          {LADIES.map((l) => (
            <g key={l.i}>
              <rect x={l.x} y={l.base - l.h} width="13" height={l.h} />
              <path d={`M${l.x - 1} ${l.base - l.h} L ${l.x + 6.5} ${l.base - l.h - 7} L ${l.x + 14} ${l.base - l.h} Z`} />
              <rect x={l.x + 4} y={l.base - l.h + 6} width="5" height="7" className="sf-lady-win" />
            </g>
          ))}
        </g>

        {/* ── downtown ── */}
        <g className="sf-city">
          {/* back row */}
          <rect x="762" y="294" width="26" height="116" />
          <rect x="900" y="306" width="22" height="104" />
          <rect x="1046" y="290" width="20" height="120" />
          <rect x="1090" y="316" width="18" height="94" />
          {/* 555 California — fluted slab */}
          <rect x="800" y="254" width="42" height="156" />
          <path d="M804 254 V410 M812 254 V410 M820 254 V410 M828 254 V410 M836 254 V410" className="sf-flute" />
          {/* Transamerica — pyramid, wings, spire */}
          <path d="M858 410 L 873 396 L 886 220 Q 888 200 890 220 L 903 396 L 918 410 Z" />
          <rect x="868" y="262" width="5" height="60" />
          <rect x="903" y="262" width="5" height="60" />
          <line x1="888" y1="206" x2="888" y2="178" className="sf-spire" />
          {/* Moscone hall + banners, low in front */}
          <rect x="848" y="394" width="58" height="16" />
          <line x1="856" y1="394" x2="856" y2="380" className="sf-spire" />
          <line x1="898" y1="394" x2="898" y2="380" className="sf-spire" />
          <path d="M856 380 l 9 3 l -9 3 Z M898 380 l 9 3 l -9 3 Z" className="sf-banner" />
          {/* Salesforce — round-shouldered tube + crown */}
          <path d="M930 410 V 162 Q 930 142 948 142 Q 966 142 966 162 V 410 Z" />
          <g className="sf-crown">
            {[0, 1, 2, 3, 4].map((i) => (
              <rect key={i} x={932 + i * 7} y="146" width="4" height="10" style={{ ["--i" as string]: i }} />
            ))}
          </g>
          {/* 181 Fremont — sloped crown; Millennium — flat */}
          <path d="M980 410 V 224 L 1002 210 V 410 Z" />
          <rect x="1010" y="242" width="26" height="168" />
          {/* lit windows — opacity is the scene's call */}
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

        {/* Telegraph Hill + Coit */}
        <g className="sf-city">
          <path d="M1100 410 Q 1124 366 1148 360 Q 1172 366 1192 410 Z" />
          <rect x="1142" y="300" width="12" height="62" />
          <path d="M1140 300 h16 l-2 -8 h-12 Z" />
          <rect x="1144" y="288" width="8" height="6" />
        </g>

        {/* Ferry Building at the waterline */}
        <g className="sf-city">
          <rect x="1196" y="392" width="78" height="18" />
          <rect x="1228" y="328" width="15" height="64" />
          <rect x="1230" y="324" width="11" height="6" />
          <path d="M1228 324 L 1235.5 312 L 1243 324 Z" />
          <rect x="1232.5" y="338" width="6" height="6" className="sf-clock" />
        </g>

        {/* piers — the wharf gesture, masts in the water */}
        <g className="sf-piers">
          <rect x="1130" y="408" width="46" height="3" />
          <rect x="1284" y="408" width="40" height="3" />
          <path d="M1140 408 V 396 M1148 408 V 392 M1158 408 V 398 M1294 408 V 396 M1302 408 V 393 M1312 408 V 398" />
        </g>

        {/* ── Bay Bridge, east — deck runs off toward Oakland ── */}
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
          <path d="M1196 322 Q 1232 350 1268 268 M1268 268 Q 1330 354 1392 268 M1392 268 Q 1448 326 1500 334 L 2040 346" className="sf-cable" />
        </g>

        {/* ── the yards: Oracle Park + Chase Center, on the south water ── */}
        <g className="sf-yards">
          <path d="M1216 410 L 1222 392 Q 1252 384 1282 392 L 1288 410 Z" />
          {[1228, 1244, 1262, 1278].map((lx) => (
            <g key={lx} className="sf-lightmast">
              <line x1={lx} y1="390" x2={lx} y2="372" />
              <rect x={lx - 5} y="368" width="10" height="4" rx="1" className="sf-floodhead" />
            </g>
          ))}
          <path d="M1318 410 L 1322 398 Q 1352 386 1382 398 L 1386 410 Z" />
          <path d="M1330 400 h44" className="sf-flute" />
        </g>

        {/* ── the bay — wider than any screen ── */}
        <rect className="sf-bay" x="-600" y="410" width="2640" height="110" />
        <g className="sf-refl">
          <path d="M60 424 h26 M130 432 h34 M236 420 h22 M320 438 h30 M450 446 h26 M520 426 h24 M610 440 h20 M700 434 h28 M880 422 h32 M940 444 h24 M1010 430 h22 M1150 424 h30 M1240 442 h20 M1290 436 h26 M1380 422 h22" />
        </g>
        {/* the ferry, crossing */}
        <g className="sf-ferry">
          <path d="M0 0 L 30 0 L 26 6 L 4 6 Z" />
          <rect x="7" y="-6" width="16" height="6" rx="1" />
          <rect x="10" y="-4" width="3" height="2.4" className="sf-ferry-win" />
          <rect x="16" y="-4" width="3" height="2.4" className="sf-ferry-win" />
        </g>

        {/* ── fog — Karl, drawn twice ── */}
        <g className="sf-fog" filter="url(#sf-fog)">
          <ellipse className="sf-fog-gate" cx="240" cy="330" rx="240" ry="34" />
          <ellipse className="sf-fog-city" cx="900" cy="300" rx="300" ry="30" />
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
    </div>
  );
}
