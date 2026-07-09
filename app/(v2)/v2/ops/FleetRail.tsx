import type { AgentOps } from "@/lib/ops/types";

/**
 * THE FLEET RAIL — a slim sticky strip under the city bar, ops room only.
 * One chip per visible agent (state dot + name → #anchor) plus the room's
 * two section jumps, so a landing click that drops you mid-grid never
 * strands you: the fleet is always one glance up. Solid panel background,
 * hairline border, no backdrop-filter (scroll-perf doctrine).
 */
export default function FleetRail({ agents }: { agents: AgentOps[] }) {
  return (
    <nav className="v2-fleetrail" aria-label="The fleet — jump to an agent">
      <a href="#fleet" className="v2-fleetrail-home">
        The fleet
      </a>
      {agents.map((a) => (
        <a key={a.slug} href={`#${a.slug}`} style={{ "--c": a.accent } as React.CSSProperties}>
          <span className="v2-dot" data-state={a.state} aria-hidden />
          {a.title}
        </a>
      ))}
      <span className="v2-fleetrail-spacer" aria-hidden />
      <a href="#shift">Shift log</a>
      <a href="#protocol">Protocol</a>
    </nav>
  );
}
