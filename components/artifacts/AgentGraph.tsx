/**
 * Agent orchestration graph — lanes of actors, numbered message flows.
 * Reads like a sequence diagram crossed with a wiring schematic.
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

const LANE_W = 250;
const NODE_W = 200;
const NODE_H = 60;
const NODE_GAP = 88;
const HEADER_H = 40;

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
  const pos: Record<string, { x: number; y: number; lane: number }> = {};
  lanes.forEach((lane, li) => {
    lane.nodes.forEach((node, ni) => {
      pos[node.id] = {
        x: li * LANE_W + 12,
        y: HEADER_H + ni * NODE_GAP + 8,
        lane: li,
      };
    });
  });
  const maxRows = Math.max(...lanes.map((l) => l.nodes.length));
  const width = lanes.length * LANE_W;
  const height = HEADER_H + maxRows * NODE_GAP + 8;

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
              x={li * LANE_W + 12}
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

          {flows.map((f) => {
            const a = pos[f.from];
            const b = pos[f.to];
            if (!a || !b) return null;
            const fromRight = a.lane <= b.lane;
            const x1 = a.x + (fromRight ? NODE_W : 0);
            const y1 = a.y + NODE_H / 2;
            const x2 = b.x + (fromRight ? 0 : NODE_W);
            const y2 = b.y + NODE_H / 2;
            const mx = (x1 + x2) / 2;
            const my = (y1 + y2) / 2;
            return (
              <g key={f.n}>
                <path
                  d={
                    y1 === y2
                      ? `M ${x1} ${y1} L ${x2} ${y2}`
                      : `M ${x1} ${y1} L ${mx} ${y1} L ${mx} ${y2} L ${x2} ${y2}`
                  }
                  fill="none"
                  stroke="var(--color-line-loud)"
                  strokeWidth="1"
                  markerEnd="url(#garrow)"
                />
                <circle
                  cx={mx}
                  cy={y1 === y2 ? my : (y1 + y2) / 2}
                  r="9"
                  fill="var(--color-void)"
                  stroke="var(--accent)"
                  strokeWidth="1"
                />
                <text
                  x={mx}
                  y={(y1 === y2 ? my : (y1 + y2) / 2) + 3}
                  textAnchor="middle"
                  fill="var(--accent)"
                  style={{ font: "600 9px var(--font-mono)" }}
                >
                  {f.n}
                </text>
                {f.label && (
                  <text
                    x={mx}
                    y={(y1 === y2 ? my : (y1 + y2) / 2) - 14}
                    textAnchor="middle"
                    fill="var(--color-dim)"
                    style={{
                      font: "500 9px var(--font-mono)",
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                    }}
                  >
                    {f.label}
                  </text>
                )}
              </g>
            );
          })}

          {lanes.flatMap((lane) =>
            lane.nodes.map((n) => {
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
            })
          )}
        </svg>
      </div>
      {caption && (
        <p className="border-t border-line px-5 py-3 font-mono text-label tracking-[0.08em] text-dim">
          {caption}
        </p>
      )}
    </figure>
  );
}
