import {
  EdgeLabelText,
  layoutDiagram,
  type GridMetrics,
} from "./ArchitectureDiagram";
import type { StateMachine } from "@/lib/inspect/types";

/**
 * Small-box flow renderer on the shared grid layout engine — used for
 * the deep dive's state machines and for the flow blocks behind a
 * clicked component (Temporal workflows, routing trees, pipelines).
 * Color doctrine holds: accent outline = a gate where the model has no
 * say; dashed box = terminal state; dashed path = failure/repair.
 */
export const STATE_METRICS: GridMetrics = {
  W: 152,
  H: 44,
  minColGap: 32,
  rowGap: 48,
  pad: 12,
  charW: 5,
  wrapAt: 96,
};

export default function StateFlowSvg({
  machine,
  markerId,
}: {
  machine: StateMachine;
  markerId: string;
}) {
  const m = STATE_METRICS;
  const { width, height, boxX, boxY, routed } = layoutDiagram(
    machine.states,
    machine.transitions,
    m
  );

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      style={{ width: "100%", maxWidth: width, minWidth: Math.min(width, 640) }}
      role="img"
      aria-label={machine.title}
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
      {/* 1 — transitions */}
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
      {/* 2 — states */}
      {machine.states.map((s) => {
        const x = boxX(s.col);
        const y = boxY(s.row);
        return (
          <g key={s.id}>
            <rect
              x={x}
              y={y}
              width={m.W}
              height={m.H}
              fill="var(--color-panel-2)"
              stroke={
                s.kind === "gate" ? "var(--accent)" : "var(--color-line-loud)"
              }
              strokeWidth="1"
              strokeDasharray={s.kind === "terminal" ? "3 3" : undefined}
            />
            <text
              x={x + m.W / 2}
              y={y + m.H / 2 + 3.5}
              textAnchor="middle"
              fill={s.kind === "terminal" ? "var(--color-dim)" : "var(--color-bone)"}
              style={{
                font: "600 10px var(--font-mono)",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
              }}
            >
              {s.label}
            </text>
          </g>
        );
      })}
      {/* 3 — transition labels, haloed, living in the box-free gaps */}
      {routed.map(
        (r, i) =>
          r.label && (
            <EdgeLabelText
              key={`l${i}`}
              label={r.label}
              font="500 8.5px var(--font-mono)"
              letterSpacing="0.06em"
            />
          )
      )}
    </svg>
  );
}
