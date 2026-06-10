/**
 * Architecture diagram as a designed component — boxes on a grid,
 * orthogonal hairline edges, mono labels. Authored as data in MDX,
 * rendered as crisp SVG. No screenshots in this archive.
 *
 * Layout doctrine: boxes own the grid cells; everything else lives in
 * the gaps. Column gaps stretch to fit the labels of the straight
 * edges that cross them (long labels wrap to two lines), and every
 * multi-segment route travels the box-free lanes between columns and
 * bands between rows — so no edge runs through a box and no label
 * lands on a box title.
 *
 * The accent outline means ONE thing everywhere: a point where the
 * model has no say — deterministic code or a human decides. Every
 * figure that uses it gets the legend automatically.
 *
 * DiagramSvg is the raw renderer; ArchitectureDiagram wraps it in
 * figure chrome. The SystemDeepDive modal reuses DiagramSvg at scale
 * and can make nodes clickable (click → the file behind the box).
 */
export interface DiagramNode {
  id: string;
  label: string;
  sub?: string;
  col: number;
  row: number;
  accent?: boolean;
}

export interface DiagramEdge {
  from: string;
  to: string;
  label?: string;
  dashed?: boolean;
}

/* ── shared grid layout engine ──────────────────────────────────────
   Used by the topology renderer here and the state-machine renderer
   in SystemDeepDive. Pure geometry, no React. */

export interface GridMetrics {
  W: number; // box width
  H: number; // box height
  minColGap: number;
  rowGap: number;
  pad: number;
  charW: number; // approx px per char at label font size
  wrapAt: number; // label line width (px) beyond which it wraps to 2 lines
}

export const TOPOLOGY_METRICS: GridMetrics = {
  W: 180,
  H: 64,
  minColGap: 34,
  rowGap: 52,
  pad: 12,
  charW: 5.4,
  wrapAt: 104,
};

interface GridBox {
  id: string;
  col: number;
  row: number;
}

const LINE_H = 11;

export interface PlacedLabel {
  x: number;
  y: number; // baseline of the first line
  lines: string[];
  anchor: "middle" | "start" | "end";
  w: number;
  h: number;
  /** collision nudges move this label up instead of down */
  nudgeUp?: boolean;
}

export interface RoutedEdge {
  d: string;
  dashed?: boolean;
  label?: PlacedLabel;
}

export interface DiagramLayout {
  width: number;
  height: number;
  boxX: (col: number) => number;
  boxY: (row: number) => number;
  routed: RoutedEdge[];
}

function wrapLabel(label: string, charW: number, wrapAt: number): string[] {
  if (label.length * charW <= wrapAt) return [label];
  const mid = label.length / 2;
  let best = -1;
  for (let i = 0; i < label.length; i++) {
    if (label[i] === " " && (best < 0 || Math.abs(i - mid) < Math.abs(best - mid))) {
      best = i;
    }
  }
  if (best < 0) return [label];
  return [label.slice(0, best), label.slice(best + 1)];
}

/** parallel runs through the same lane/band fan out around its center */
function slotOffset(k: number): number {
  if (k === 0) return 0;
  return (k % 2 === 1 ? -1 : 1) * Math.ceil(k / 2) * 8;
}

export function layoutDiagram(
  boxes: GridBox[],
  edges: DiagramEdge[],
  m: GridMetrics
): DiagramLayout {
  const byId = new Map(boxes.map((b) => [b.id, b]));
  const cols = Math.max(...boxes.map((b) => b.col)) + 1;
  const rows = Math.max(...boxes.map((b) => b.row)) + 1;

  const wrapped = new Map<DiagramEdge, string[]>();
  for (const e of edges) {
    if (e.label) wrapped.set(e, wrapLabel(e.label, m.charW, m.wrapAt));
  }

  // 1 — column gaps stretch to fit the straight-edge labels crossing them
  const gaps: number[] = Array(Math.max(cols - 1, 0)).fill(m.minColGap);
  for (const e of edges) {
    const a = byId.get(e.from);
    const b = byId.get(e.to);
    const lines = wrapped.get(e);
    if (!a || !b || !lines) continue;
    if (a.row === b.row && b.col - a.col === 1) {
      const w = Math.max(...lines.map((l) => l.length)) * m.charW;
      gaps[a.col] = Math.max(gaps[a.col], w + 16);
    }
  }

  const colX: number[] = [];
  let xAcc = m.pad;
  for (let c = 0; c < cols; c++) {
    colX.push(xAcc);
    xAcc += m.W + (gaps[c] ?? 0);
  }
  const width = colX[cols - 1] + m.W + m.pad;
  const rowYAt = (r: number) => m.pad + r * (m.H + m.rowGap);

  const left = (b: GridBox) => colX[b.col];
  const right = (b: GridBox) => colX[b.col] + m.W;
  const cx = (b: GridBox) => colX[b.col] + m.W / 2;
  const cy = (b: GridBox) => rowYAt(b.row) + m.H / 2;
  const top = (b: GridBox) => rowYAt(b.row);
  const bot = (b: GridBox) => rowYAt(b.row) + m.H;
  /** vertical lane between col i and i+1 — box-free at every row */
  const laneXAt = (i: number) => colX[i] + m.W + (gaps[i] ?? m.minColGap) / 2;
  /** horizontal band between row r and r+1 — box-free at every column */
  const bandYAt = (r: number) => rowYAt(r) + m.H + m.rowGap / 2;

  const laneUse = new Map<number, number>();
  const bandUse = new Map<number, number>();
  const takeLane = (i: number) => {
    const k = laneUse.get(i) ?? 0;
    laneUse.set(i, k + 1);
    return laneXAt(i) + slotOffset(k);
  };
  const takeBand = (r: number) => {
    const k = bandUse.get(r) ?? 0;
    bandUse.set(r, k + 1);
    return bandYAt(r) + slotOffset(k);
  };

  let extraBottom = 0;
  const routed: RoutedEdge[] = [];
  const placed: PlacedLabel[] = [];
  /** labels already assigned per band — used to spread crowds */
  const bandLabelCount = new Map<number, number>();

  const mkLabel = (
    x: number,
    firstBaseline: number,
    anchor: PlacedLabel["anchor"],
    lines: string[],
    nudgeUp = false
  ): PlacedLabel => ({
    x,
    y: firstBaseline,
    lines,
    anchor,
    w: Math.max(...lines.map((l) => l.length)) * m.charW,
    h: lines.length * LINE_H,
    nudgeUp,
  });

  const collidesAny = (l: PlacedLabel) => placed.some((p) => collides(p, l));

  /** resolve collisions without ever leaving the safe zone. Band labels
      snap to a shared shelf grid inside their box-free band and try the
      other shelves, then slide along the band (box-free at any x);
      free labels nudge along their open axis. */
  const SHELF = 15;
  const settleLabel = (label: PlacedLabel, bandIdx?: number) => {
    if (bandIdx !== undefined) {
      bandLabelCount.set(bandIdx, (bandLabelCount.get(bandIdx) ?? 0) + 1);
    }
    const x0 = label.x;
    let ys: number[];
    if (bandIdx !== undefined) {
      const minB = rowYAt(bandIdx) + m.H + 11;
      // shelves the label fits on without its last line leaving the band
      const room = m.rowGap - 13 - (label.h - LINE_H);
      const nShelves = Math.max(1, Math.floor(room / SHELF) + 1);
      const k0 = Math.min(
        nShelves - 1,
        Math.max(0, Math.round((label.y - minB) / SHELF))
      );
      ys = [k0];
      for (let d = 1; d < nShelves; d++) {
        if (k0 - d >= 0) ys.push(k0 - d);
        if (k0 + d < nShelves) ys.push(k0 + d);
      }
      ys = ys.map((k) => minB + k * SHELF);
    } else {
      const dir = label.nudgeUp ? -1 : 1;
      ys = [0, 1, 2, 3].map((d) => label.y + dir * d * LINE_H);
    }
    for (const dx of [0, -28, 28, -56, 56, -88, 88, -120, 120]) {
      for (const y of ys) {
        label.x = x0 + dx;
        label.y = y;
        if (!collidesAny(label)) {
          placed.push(label);
          return;
        }
      }
    }
    label.x = x0;
    label.y = ys[0];
    placed.push(label);
  };

  /** among the bands a vertical run crosses, pick the least crowded,
      tie-broken by distance to the run's midpoint */
  const pickBand = (rowA: number, rowB: number, midY: number): number => {
    const lo = Math.min(rowA, rowB);
    const hi = Math.max(rowA, rowB);
    let best = lo;
    let bestScore = Infinity;
    for (let r = lo; r < hi; r++) {
      const score =
        (bandLabelCount.get(r) ?? 0) * 10000 + Math.abs(bandYAt(r) - midY);
      if (score < bestScore) {
        bestScore = score;
        best = r;
      }
    }
    return best;
  };

  for (const e of edges) {
    const a = byId.get(e.from);
    const b = byId.get(e.to);
    if (!a || !b) continue;
    const dc = b.col - a.col;
    const dr = b.row - a.row;
    const lines = wrapped.get(e);

    let pts: [number, number][] = [];
    let label: PlacedLabel | undefined;
    let labelBand: number | undefined;

    if (dr === 0 && dc === 1) {
      // straight horizontal between neighbors — the gap was sized for the label
      pts = [
        [right(a), cy(a)],
        [left(b), cy(b)],
      ];
      if (lines) {
        const lx = (right(a) + left(b)) / 2;
        label = mkLabel(lx, cy(a) - 8 - (lines.length - 1) * LINE_H, "middle", lines, true);
      }
    } else if (dc === 0 && Math.abs(dr) === 1) {
      // straight vertical between neighbors — label sits in the row band
      const down = dr > 0;
      pts = [
        [cx(a), down ? bot(a) : top(a)],
        [cx(b), down ? top(b) : bot(b)],
      ];
      if (lines) {
        const w = Math.max(...lines.map((l) => l.length)) * m.charW;
        const fitsRight = cx(a) + 7 + w <= width - 4;
        labelBand = Math.min(a.row, b.row);
        label = mkLabel(
          cx(a) + (fitsRight ? 7 : -7),
          bandYAt(labelBand) + 3 - ((lines.length - 1) * LINE_H) / 2,
          fitsRight ? "start" : "end",
          lines
        );
      }
    } else if (dc === 0) {
      // same column, rows apart — travel the lane beside the column
      const li = a.col < cols - 1 ? a.col : a.col - 1;
      const useRight = a.col < cols - 1;
      const lx = takeLane(li);
      const ax = useRight ? right(a) : left(a);
      const bx = useRight ? right(b) : left(b);
      pts = [
        [ax, cy(a)],
        [lx, cy(a)],
        [lx, cy(b)],
        [bx, cy(b)],
      ];
      if (lines) {
        labelBand = pickBand(a.row, b.row, (cy(a) + cy(b)) / 2);
        label = mkLabel(lx, bandYAt(labelBand) - 2, "middle", lines);
      }
    } else if (Math.abs(dc) === 1 && dr !== 0) {
      // elbow through the shared column lane
      const li = Math.min(a.col, b.col);
      const lx = takeLane(li);
      const ax = dc > 0 ? right(a) : left(a);
      const bx = dc > 0 ? left(b) : right(b);
      pts = [
        [ax, cy(a)],
        [lx, cy(a)],
        [lx, cy(b)],
        [bx, cy(b)],
      ];
      if (lines) {
        labelBand = pickBand(a.row, b.row, (cy(a) + cy(b)) / 2);
        label = mkLabel(lx, bandYAt(labelBand) - 2, "middle", lines);
      }
    } else if (dr === 0) {
      // same row, long span or backwards — loop through the band below
      if (a.row === rows - 1) extraBottom = Math.max(extraBottom, m.rowGap / 2 + 16);
      const by = takeBand(a.row);
      const dir = Math.sign(dc) || -1;
      const ex = cx(a) + dir * m.W * 0.2;
      const nx = cx(b) - dir * m.W * 0.2;
      pts = [
        [ex, bot(a)],
        [ex, by],
        [nx, by],
        [nx, bot(b)],
      ];
      if (lines) {
        labelBand = a.row;
        label = mkLabel((ex + nx) / 2, by - 5, "middle", lines);
      }
    } else {
      // far elbow — adjacent lane, then the band beside the target
      const dirX = dc > 0 ? 1 : -1;
      const li = dirX > 0 ? a.col : a.col - 1;
      const lx = takeLane(li);
      const ax = dirX > 0 ? right(a) : left(a);
      const bandIdx = dr > 0 ? b.row - 1 : b.row;
      const by = takeBand(bandIdx);
      const ny = dr > 0 ? top(b) : bot(b);
      const nx = cx(b) - dirX * m.W * 0.2;
      pts = [
        [ax, cy(a)],
        [lx, cy(a)],
        [lx, by],
        [nx, by],
        [nx, ny],
      ];
      if (lines) {
        labelBand = bandIdx;
        label = mkLabel((lx + nx) / 2, by - 5, "middle", lines);
      }
    }

    // labels resolve collisions inside their box-free band — clamped
    // vertical shelves first, then sliding along the band
    if (label) settleLabel(label, labelBand);

    routed.push({
      d: pts.map(([px, py], i) => `${i === 0 ? "M" : "L"} ${px} ${py}`).join(" "),
      dashed: e.dashed,
      label,
    });
  }

  return {
    width,
    height: rowYAt(rows - 1) + m.H + m.pad + extraBottom,
    boxX: (c: number) => colX[c],
    boxY: rowYAt,
    routed,
  };
}

function collides(a: PlacedLabel, b: PlacedLabel): boolean {
  const rect = (l: PlacedLabel) => {
    const left = l.anchor === "middle" ? l.x - l.w / 2 : l.anchor === "start" ? l.x : l.x - l.w;
    return { x1: left - 4, x2: left + l.w + 4, y1: l.y - 9 - 2, y2: l.y - 9 + l.h + 2 };
  };
  const ra = rect(a);
  const rb = rect(b);
  return ra.x1 < rb.x2 && rb.x1 < ra.x2 && ra.y1 < rb.y2 && rb.y1 < ra.y2;
}

/** edge-label text block, haloed so a crossing hairline never cuts it */
export function EdgeLabelText({
  label,
  font,
  letterSpacing = "0.08em",
}: {
  label: PlacedLabel;
  font: string;
  letterSpacing?: string;
}) {
  return (
    <text
      x={label.x}
      y={label.y}
      textAnchor={label.anchor}
      fill="var(--color-dim)"
      stroke="var(--color-panel)"
      strokeWidth="4"
      style={{
        font,
        letterSpacing,
        textTransform: "uppercase",
        paintOrder: "stroke",
      }}
    >
      {label.lines.map((line, i) => (
        <tspan key={i} x={label.x} dy={i === 0 ? 0 : LINE_H}>
          {line}
        </tspan>
      ))}
    </text>
  );
}

/** the one sentence the accent outline means, everywhere it appears */
export function DiagramLegend({
  nodes,
  edges,
  extra,
}: {
  nodes: DiagramNode[];
  edges: DiagramEdge[];
  extra?: React.ReactNode;
}) {
  const hasAccent = nodes.some((n) => n.accent);
  const hasDashed = edges.some((e) => e.dashed);
  if (!hasAccent && !hasDashed && !extra) return null;
  return (
    <p className="font-mono text-label tracking-[0.12em] text-dim uppercase">
      {hasAccent && (
        <>
          <span className="text-(--accent)">outlined</span> = where the model
          has no say — code or a human decides
        </>
      )}
      {hasAccent && hasDashed && " · "}
      {hasDashed && (
        <>
          <span className="text-ash">dashed</span> = failure / repair path
        </>
      )}
      {extra}
    </p>
  );
}

export function DiagramSvg({
  nodes,
  edges,
  ariaLabel,
  fluid = false,
  markerId = "arrow",
  interactiveIds,
  selectedId,
  onNodeClick,
}: {
  nodes: DiagramNode[];
  edges: DiagramEdge[];
  ariaLabel: string;
  /** scale down to fit the container instead of natural pixel size */
  fluid?: boolean;
  markerId?: string;
  /** node ids that open something on click (deep dive: the file behind the box) */
  interactiveIds?: ReadonlySet<string>;
  selectedId?: string | null;
  onNodeClick?: (id: string) => void;
}) {
  const m = TOPOLOGY_METRICS;
  const { width, height, boxX, boxY, routed } = layoutDiagram(nodes, edges, m);

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      style={
        fluid
          ? { width: "100%", maxWidth: width, minWidth: Math.min(width, 700) }
          : { width, minWidth: Math.min(width, 700) }
      }
      role="img"
      aria-label={ariaLabel}
    >
      <defs>
        <marker
          id={markerId}
          viewBox="0 0 8 8"
          refX="7"
          refY="4"
          markerWidth="7"
          markerHeight="7"
          orient="auto-start-reverse"
        >
          <path d="M 0 0 L 8 4 L 0 8 z" fill="var(--color-dim)" />
        </marker>
      </defs>

      {/* 1 — edge routes */}
      {routed.map((r, i) => (
        <path
          key={i}
          d={r.d}
          fill="none"
          stroke="var(--color-line-loud)"
          strokeWidth="1"
          strokeDasharray={r.dashed ? "4 4" : undefined}
          markerEnd={`url(#${markerId})`}
        />
      ))}

      {/* 2 — boxes */}
      {nodes.map((n) => {
        const x = boxX(n.col);
        const y = boxY(n.row);
        const interactive = interactiveIds?.has(n.id) && onNodeClick;
        const selected = selectedId === n.id;
        const box = (
          <>
            <rect
              x={x}
              y={y}
              width={m.W}
              height={m.H}
              fill="var(--color-panel-2)"
              stroke={
                selected
                  ? "var(--accent)"
                  : n.accent
                    ? "var(--accent)"
                    : "var(--color-line-loud)"
              }
              strokeWidth={selected ? 1.5 : 1}
            />
            <text
              x={x + m.W / 2}
              y={y + (n.sub ? 28 : 36)}
              textAnchor="middle"
              fill="var(--color-bone)"
              style={{
                font: "600 11px var(--font-mono)",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
              }}
            >
              {n.label}
            </text>
            {n.sub && (
              <text
                x={x + m.W / 2}
                y={y + 46}
                textAnchor="middle"
                fill="var(--color-dim)"
                style={{
                  font: "400 9px var(--font-mono)",
                  letterSpacing: "0.06em",
                }}
              >
                {n.sub}
              </text>
            )}
            {interactive && (
              <text
                x={x + m.W - 8}
                y={y + 14}
                textAnchor="end"
                fill={selected ? "var(--accent)" : "var(--color-dim)"}
                style={{ font: "600 11px var(--font-mono)" }}
                aria-hidden
              >
                +
              </text>
            )}
          </>
        );
        return interactive ? (
          <g
            key={n.id}
            className="diagram-hit"
            role="button"
            tabIndex={0}
            aria-label={`Open the file behind ${n.label}`}
            aria-pressed={selected}
            onClick={() => onNodeClick(n.id)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onNodeClick(n.id);
              }
            }}
          >
            {box}
          </g>
        ) : (
          <g key={n.id}>{box}</g>
        );
      })}

      {/* 3 — edge labels: every label lives in a box-free gap, haloed,
          rendered last so a crossing hairline never cuts it */}
      {routed.map(
        (r, i) =>
          r.label && (
            <EdgeLabelText
              key={`l${i}`}
              label={r.label}
              font="500 9px var(--font-mono)"
            />
          )
      )}
    </svg>
  );
}

export default function ArchitectureDiagram({
  title,
  caption,
  nodes,
  edges,
}: {
  title?: string;
  caption?: string;
  nodes: DiagramNode[];
  edges: DiagramEdge[];
}) {
  const hasFooter =
    Boolean(caption) || nodes.some((n) => n.accent) || edges.some((e) => e.dashed);
  const { width } = layoutDiagram(nodes, edges, TOPOLOGY_METRICS);
  return (
    <figure className="my-10 border border-line bg-panel">
      {title && (
        <figcaption className="border-b border-line px-5 py-3 font-mono text-label tracking-[0.18em] text-dim uppercase">
          {title}
        </figcaption>
      )}
      <div className="overflow-x-auto p-6">
        <div className="w-full" style={{ maxWidth: width }}>
          <DiagramSvg
            nodes={nodes}
            edges={edges}
            fluid
            ariaLabel={title ?? "Architecture diagram"}
          />
        </div>
      </div>
      {hasFooter && (
        <div className="space-y-1 border-t border-line px-5 py-3">
          <DiagramLegend nodes={nodes} edges={edges} />
          {caption && (
            <p className="font-mono text-label tracking-[0.08em] text-dim">
              {caption}
            </p>
          )}
        </div>
      )}
    </figure>
  );
}
