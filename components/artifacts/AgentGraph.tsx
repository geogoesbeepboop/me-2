import { DiagramLegend } from "./ArchitectureDiagram";

/**
 * Agent orchestration graph — lanes of actors, numbered message flows.
 * Reads like a sequence diagram crossed with a wiring schematic.
 * Layering: flow routes → boxes → numbered badges and labels, so a
 * label is never buried under a lane.
 */
export interface GraphNode {
  id: string;
  label: string;
  sub?: string;
  accent?: boolean;
}

export interface GraphLane {
  title: string;
  nodes: GraphNode[];
}

export interface GraphFlow {
  n: number;
  from: string;
  to: string;
  label?: string;
}

const NODE_W = 200;
const NODE_H = 60;
const NODE_GAP = 88;
const HEADER_H = 40;
const CHAR_W = 5.4;

export default function AgentGraph({
  title,
  caption,
  lanes,
  flows,
}: {
  title?: string;
  caption?: string;
  lanes: GraphLane[];
  flows: GraphFlow[];
}) {
  const laneOf: Record<string, number> = {};
  lanes.forEach((lane, li) => lane.nodes.forEach((n) => (laneOf[n.id] = li)));

  // the gap between lanes stretches to fit the widest label crossing it
  const crossLabelW = Math.max(
    0,
    ...flows
      .filter((f) => f.label && laneOf[f.from] !== laneOf[f.to])
      .map((f) => f.label!.length * CHAR_W)
  );
  const GAP = Math.max(50, crossLabelW + 14);
  const laneW = NODE_W + GAP;

  const pos: Record<string, { x: number; y: number; lane: number }> = {};
  lanes.forEach((lane, li) => {
    lane.nodes.forEach((node, ni) => {
      pos[node.id] = {
        x: li * laneW + 12,
        y: HEADER_H + ni * NODE_GAP + 8,
        lane: li,
      };
    });
  });
  const maxRows = Math.max(...lanes.map((l) => l.nodes.length));
  const width = lanes.length * laneW - GAP + 24;
  const height = HEADER_H + maxRows * NODE_GAP + 8;

  const flowGeo = (f: GraphFlow) => {
    const a = pos[f.from];
    const b = pos[f.to];
    if (!a || !b) return null;
    if (a.lane === b.lane) {
      // same lane — a straight drop; badge rides the line, label beside it
      const down = b.y > a.y;
      const x = a.x + NODE_W / 2;
      const y1 = down ? a.y + NODE_H : a.y;
      const y2 = down ? b.y : b.y + NODE_H;
      return { vertical: true, x1: x, y1, x2: x, y2, mx: x, my: (y1 + y2) / 2 };
    }
    const ltr = a.lane < b.lane;
    const x1 = a.x + (ltr ? NODE_W : 0);
    const y1 = a.y + NODE_H / 2;
    const x2 = b.x + (ltr ? 0 : NODE_W);
    const y2 = b.y + NODE_H / 2;
    // route through the gap beside the source lane — never across a lane
    const mx = ltr ? x1 + GAP / 2 : x1 - GAP / 2;
    return { vertical: false, x1, y1, x2, y2, mx, my: (y1 + y2) / 2 };
  };

  const allNodes = lanes.flatMap((l) => l.nodes);
  const legendNodes = allNodes.map((n) => ({
    id: n.id,
    label: n.label,
    col: 0,
    row: 0,
    accent: n.accent,
  }));

  return (
    <figure className="my-10 border border-line bg-panel">
      {title && (
        <figcaption className="border-b border-line px-5 py-3 font-mono text-label tracking-[0.18em] text-dim uppercase">
          {title}
        </figcaption>
      )}
      <div className="overflow-x-auto p-6">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          style={{ minWidth: Math.min(width, 760), width: "100%", maxWidth: width }}
          role="img"
          aria-label={title ?? "Agent orchestration graph"}
        >
          <defs>
            <marker
              id="garrow"
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

          {lanes.map((lane, li) => (
            <text
              key={lane.title}
              x={li * laneW + 12}
              y={18}
              fill="var(--color-dim)"
              style={{
                font: "500 10px var(--font-mono)",
                letterSpacing: "0.16em",
                textTransform: "uppercase",
              }}
            >
              {lane.title}
            </text>
          ))}

          {/* 1 — flow routes */}
          {flows.map((f) => {
            const g = flowGeo(f);
            if (!g) return null;
            return (
              <path
                key={f.n}
                d={
                  g.vertical || g.y1 === g.y2
                    ? `M ${g.x1} ${g.y1} L ${g.x2} ${g.y2}`
                    : `M ${g.x1} ${g.y1} L ${g.mx} ${g.y1} L ${g.mx} ${g.y2} L ${g.x2} ${g.y2}`
                }
                fill="none"
                stroke="var(--color-line-loud)"
                strokeWidth="1"
                markerEnd="url(#garrow)"
              />
            );
          })}

          {/* 2 — actor boxes */}
          {allNodes.map((n) => {
            const p = pos[n.id];
            return (
              <g key={n.id}>
                <rect
                  x={p.x}
                  y={p.y}
                  width={NODE_W}
                  height={NODE_H}
                  fill="var(--color-panel-2)"
                  stroke={
                    n.accent ? "var(--accent)" : "var(--color-line-loud)"
                  }
                  strokeWidth="1"
                />
                <text
                  x={p.x + NODE_W / 2}
                  y={p.y + (n.sub ? 26 : 34)}
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
                    x={p.x + NODE_W / 2}
                    y={p.y + 44}
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
              </g>
            );
          })}

          {/* 3 — numbered badges + labels, haloed, on top. Vertical flows
              put the label beside the badge; cross-lane flows put it above,
              in a gap stretched to fit it. */}
          {flows.map((f) => {
            const g = flowGeo(f);
            if (!g) return null;
            const cy = g.my;
            return (
              <g key={`b${f.n}`}>
                <circle
                  cx={g.mx}
                  cy={cy}
                  r="9"
                  fill="var(--color-void)"
                  stroke="var(--accent)"
                  strokeWidth="1"
                />
                <text
                  x={g.mx}
                  y={cy + 3}
                  textAnchor="middle"
                  fill="var(--accent)"
                  style={{ font: "600 9px var(--font-mono)" }}
                >
                  {f.n}
                </text>
                {f.label && (
                  <text
                    x={g.vertical ? g.mx + 15 : g.mx}
                    y={g.vertical ? cy + 3 : cy - 14}
                    textAnchor={g.vertical ? "start" : "middle"}
                    fill="var(--color-dim)"
                    stroke="var(--color-panel)"
                    strokeWidth="4"
                    style={{
                      font: "500 9px var(--font-mono)",
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                      paintOrder: "stroke",
                    }}
                  >
                    {f.label}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>
      {(caption || allNodes.some((n) => n.accent)) && (
        <div className="space-y-1 border-t border-line px-5 py-3">
          <DiagramLegend nodes={legendNodes} edges={[]} />
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
