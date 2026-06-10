/**
 * Architecture diagram as a designed component — boxes on a grid,
 * orthogonal hairline edges, mono labels. Authored as data in MDX,
 * rendered as crisp SVG. No screenshots in this archive.
 *
 * DiagramSvg is the raw renderer; ArchitectureDiagram wraps it in
 * figure chrome. The SystemDeepDive modal reuses DiagramSvg at scale.
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

const CW = 210; // column pitch
const RH = 108; // row pitch
const W = 180; // box width
const H = 64; // box height

function center(n: DiagramNode) {
  return { x: n.col * CW + 12 + W / 2, y: n.row * RH + 12 + H / 2 };
}

function edgePath(a: DiagramNode, b: DiagramNode): string {
  const ca = center(a);
  const cb = center(b);
  if (a.row === b.row) {
    return `M ${ca.x + W / 2} ${ca.y} L ${cb.x - W / 2} ${cb.y}`;
  }
  if (a.col === b.col) {
    const down = cb.y > ca.y;
    return `M ${ca.x} ${ca.y + (down ? H / 2 : -H / 2)} L ${cb.x} ${
      cb.y - (down ? H / 2 : -H / 2)
    }`;
  }
  const midX = (ca.x + W / 2 + cb.x - W / 2) / 2;
  return `M ${ca.x + W / 2} ${ca.y} L ${midX} ${ca.y} L ${midX} ${cb.y} L ${
    cb.x - W / 2
  } ${cb.y}`;
}

export function diagramSize(nodes: DiagramNode[]) {
  const cols = Math.max(...nodes.map((n) => n.col)) + 1;
  const rows = Math.max(...nodes.map((n) => n.row)) + 1;
  return {
    width: cols * CW + 24 - (CW - W),
    height: rows * RH + 24 - (RH - H),
  };
}

export function DiagramSvg({
  nodes,
  edges,
  ariaLabel,
  scale = 1,
  markerId = "arrow",
}: {
  nodes: DiagramNode[];
  edges: DiagramEdge[];
  ariaLabel: string;
  /** rendered pixel scale of the natural diagram size */
  scale?: number;
  markerId?: string;
}) {
  const { width, height } = diagramSize(nodes);
  const byId = Object.fromEntries(nodes.map((n) => [n.id, n]));

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      style={{ width: width * scale, minWidth: Math.min(width, 700) }}
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

      {edges.map((e, i) => {
        const a = byId[e.from];
        const b = byId[e.to];
        if (!a || !b) return null;
        const ca = center(a);
        const cb = center(b);
        return (
          <g key={i}>
            <path
              d={edgePath(a, b)}
              fill="none"
              stroke="var(--color-line-loud)"
              strokeWidth="1"
              strokeDasharray={e.dashed ? "4 4" : undefined}
              markerEnd={`url(#${markerId})`}
            />
            {e.label && (
              <text
                x={(ca.x + cb.x) / 2}
                y={(ca.y + cb.y) / 2 - 8}
                textAnchor="middle"
                fill="var(--color-dim)"
                style={{
                  font: "500 9px var(--font-mono)",
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                }}
              >
                {e.label}
              </text>
            )}
          </g>
        );
      })}

      {nodes.map((n) => {
        const x = n.col * CW + 12;
        const y = n.row * RH + 12;
        return (
          <g key={n.id}>
            <rect
              x={x}
              y={y}
              width={W}
              height={H}
              fill="var(--color-panel-2)"
              stroke={n.accent ? "var(--accent)" : "var(--color-line-loud)"}
              strokeWidth="1"
            />
            <text
              x={x + W / 2}
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
                x={x + W / 2}
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
          </g>
        );
      })}
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
  return (
    <figure className="my-10 border border-line bg-panel">
      {title && (
        <figcaption className="border-b border-line px-5 py-3 font-mono text-label tracking-[0.18em] text-dim uppercase">
          {title}
        </figcaption>
      )}
      <div className="overflow-x-auto p-6">
        <div className="w-full" style={{ maxWidth: diagramSize(nodes).width }}>
          <DiagramSvg
            nodes={nodes}
            edges={edges}
            ariaLabel={title ?? "Architecture diagram"}
          />
        </div>
      </div>
      {caption && (
        <p className="border-t border-line px-5 py-3 font-mono text-label tracking-[0.08em] text-dim">
          {caption}
        </p>
      )}
    </figure>
  );
}
