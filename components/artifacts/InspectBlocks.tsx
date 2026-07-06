import StateFlowSvg from "./StateFlow";
import { DiagramSvg, DiagramLegend, INSPECT_METRICS } from "./ArchitectureDiagram";
import type { InspectBlock, SchemaTable } from "@/lib/inspect/types";

/**
 * The designed view behind a clicked component — what the file does,
 * not a dump of it. Blocks compose per component: flow diagrams on the
 * shared layout engine, rule cards with their real thresholds, schema
 * maps, ordered steps, fact chips, and the occasional verbatim line
 * where the wording itself is the artifact. Same color doctrine as
 * every figure: accent = the model has no say; dashed = failure/repair.
 */

const STEP_TAG: Record<string, { label: string; color: string }> = {
  model: { label: "MODEL", color: "var(--color-cyan)" },
  gate: { label: "GATE", color: "var(--accent)" },
  io: { label: "I/O", color: "var(--color-ash)" },
  human: { label: "HUMAN", color: "var(--color-gold)" },
};

function BlockTitle({ title }: { title?: string }) {
  if (!title) return null;
  return (
    <p className="mb-3 font-mono text-label tracking-[0.2em] text-dim uppercase">
      {title}
    </p>
  );
}

function SchemaCard({ table }: { table: SchemaTable }) {
  return (
    <div className="border border-line bg-panel-2">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5 border-b border-line px-4 py-2.5">
        <span className="font-mono text-label tracking-[0.14em] text-bone uppercase">
          {table.name}
        </span>
        {table.note && (
          <span className="font-mono text-label tracking-[0.04em] text-dim">
            {table.note}
          </span>
        )}
      </div>
      <ul className="px-4 py-2.5 font-mono text-mono-sm">
        {table.columns.map((c) => (
          <li key={c.name} className="flex items-baseline gap-3 py-0.5">
            <span className={c.key ? "text-bone" : "text-ash"}>{c.name}</span>
            <span className="text-dim">{c.type}</span>
            {c.key === "pk" && (
              <span className="ml-auto shrink-0 text-label tracking-[0.14em] text-(--accent)">
                PK
              </span>
            )}
            {c.key === "fk" && (
              <span className="ml-auto shrink-0 text-label tracking-[0.14em] text-cyan">
                FK{c.ref ? ` → ${c.ref}` : ""}
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function InspectBlocks({ blocks }: { blocks: InspectBlock[] }) {
  return (
    <div className="space-y-7 px-5 py-5">
      {blocks.map((b, i) => {
        switch (b.kind) {
          case "note":
            return (
              <p
                key={i}
                className="max-w-[60ch] text-[0.95rem] leading-relaxed text-ash"
              >
                {b.text}
              </p>
            );

          case "quote":
            return (
              <figure key={i} className="border-l-2 border-(--accent) pl-4">
                <blockquote className="font-mono text-mono-sm text-bone/90">
                  “{b.text}”
                </blockquote>
                {b.cite && (
                  <figcaption className="mt-1.5 font-mono text-label tracking-[0.1em] text-dim uppercase">
                    {b.cite}
                  </figcaption>
                )}
              </figure>
            );

          case "flow": {
            const hasGate = b.states.some((s) => s.kind === "gate");
            const hasEnd = b.states.some((s) => s.kind === "terminal");
            const hasRepair = b.transitions.some((t) => t.dashed);
            const flowLegend = [
              hasGate && (
                <span key="g">
                  <span className="text-(--accent)">outlined</span> = a gate —
                  the run stops here unless it passes
                </span>
              ),
              hasEnd && (
                <span key="e">
                  <span className="text-ash">dashed box</span> = end state
                </span>
              ),
              hasRepair && (
                <span key="r">
                  <span className="text-ash">dashed path</span> = retry / repair
                </span>
              ),
            ].filter(Boolean);
            return (
              <figure key={i} className="border border-line bg-panel-2/40">
                {(b.title || b.caption) && (
                  <figcaption className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5 border-b border-line px-4 py-2.5">
                    {b.title && (
                      <span className="font-mono text-label tracking-[0.18em] text-bone uppercase">
                        {b.title}
                      </span>
                    )}
                    {b.caption && (
                      <span className="font-mono text-label tracking-[0.06em] text-dim">
                        {b.caption}
                      </span>
                    )}
                  </figcaption>
                )}
                <div className="overflow-x-auto p-4">
                  <StateFlowSvg
                    machine={{
                      title: b.title ?? "flow",
                      states: b.states,
                      transitions: b.transitions,
                    }}
                    markerId={`insp-flow-${i}`}
                  />
                </div>
                {flowLegend.length > 0 && (
                  <p className="border-t border-line px-4 py-2 font-mono text-label tracking-[0.12em] text-dim uppercase">
                    {flowLegend.map((el, j) => (
                      <span key={j}>
                        {j > 0 && " · "}
                        {el}
                      </span>
                    ))}
                  </p>
                )}
              </figure>
            );
          }

          case "graph": {
            const hasLegend =
              b.nodes.some((n) => n.accent) || b.edges.some((e) => e.dashed);
            return (
              <figure key={i} className="border border-line bg-panel-2/40">
                {(b.title || b.caption) && (
                  <figcaption className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5 border-b border-line px-4 py-2.5">
                    {b.title && (
                      <span className="font-mono text-label tracking-[0.18em] text-bone uppercase">
                        {b.title}
                      </span>
                    )}
                    {b.caption && (
                      <span className="font-mono text-label tracking-[0.06em] text-dim">
                        {b.caption}
                      </span>
                    )}
                  </figcaption>
                )}
                <div className="overflow-x-auto p-4">
                  <DiagramSvg
                    nodes={b.nodes}
                    edges={b.edges}
                    ariaLabel={b.title ?? "internal wiring"}
                    fluid
                    markerId={`insp-graph-${i}`}
                    metrics={INSPECT_METRICS}
                  />
                </div>
                {hasLegend && (
                  <div className="border-t border-line px-4 py-2">
                    <DiagramLegend nodes={b.nodes} edges={b.edges} />
                  </div>
                )}
              </figure>
            );
          }

          case "rules":
            return (
              <div key={i}>
                <BlockTitle title={b.title} />
                <ul className="grid gap-px border border-line bg-line">
                  {b.items.map((r) => (
                    <li key={r.name} className="bg-panel px-4 py-3">
                      <p className="flex flex-wrap items-baseline gap-x-3 gap-y-1 font-mono text-label tracking-[0.16em] uppercase">
                        <span className={r.fail ? "text-ember" : "text-bone"}>
                          <span aria-hidden className="mr-2 text-(--accent)">
                            ▸
                          </span>
                          {r.name}
                        </span>
                        {r.value && (
                          <span
                            className={`border border-line bg-panel-2 px-2 py-0.5 tracking-[0.08em] ${
                              r.fail ? "text-ember" : "text-(--accent)"
                            }`}
                          >
                            {r.value}
                          </span>
                        )}
                      </p>
                      <p className="mt-1.5 font-mono text-mono-sm text-ash">
                        {r.detail}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            );

          case "steps":
            return (
              <div key={i}>
                <BlockTitle title={b.title} />
                <ol className="space-y-0 border border-line bg-panel-2/40">
                  {b.items.map((s, j) => {
                    const tag = s.tag ? STEP_TAG[s.tag] : undefined;
                    return (
                      <li
                        key={j}
                        className="flex items-baseline gap-3 border-b border-line px-4 py-2.5 last:border-b-0"
                      >
                        <span className="w-6 shrink-0 font-mono text-label text-dim">
                          {b.ordered === false ? "·" : String(j + 1).padStart(2, "0")}
                        </span>
                        {tag && (
                          <span
                            className="w-12 shrink-0 font-mono text-[10px] tracking-[0.14em]"
                            style={{ color: tag.color }}
                          >
                            {tag.label}
                          </span>
                        )}
                        <span className="font-mono text-mono-sm text-bone">
                          {s.name}
                          {s.detail && (
                            <span className="text-ash"> — {s.detail}</span>
                          )}
                        </span>
                      </li>
                    );
                  })}
                </ol>
              </div>
            );

          case "kv":
            return (
              <div key={i}>
                <BlockTitle title={b.title} />
                <div className="flex flex-wrap gap-2">
                  {b.items.map((kv) => (
                    <span
                      key={kv.k}
                      className="border border-line bg-panel-2 px-2.5 py-1 font-mono text-label tracking-[0.06em]"
                    >
                      <span className="text-dim">{kv.k}</span>{" "}
                      <span className={kv.accent ? "text-(--accent)" : "text-bone"}>
                        {kv.v}
                      </span>
                    </span>
                  ))}
                </div>
              </div>
            );

          case "schema": {
            const hasGrid = b.relations && b.relations.length > 0;
            return (
              <div key={i}>
                <BlockTitle title={b.title} />
                {hasGrid && (
                  <figure className="mb-4 border border-line bg-panel-2/40">
                    <div className="overflow-x-auto p-4">
                      <StateFlowSvg
                        machine={{
                          title: b.title ?? "schema",
                          states: b.tables.map((t) => ({
                            id: t.name,
                            label: t.name,
                            col: t.col,
                            row: t.row,
                          })),
                          transitions: b.relations ?? [],
                        }}
                        markerId={`insp-schema-${i}`}
                      />
                    </div>
                    {b.caption && (
                      <figcaption className="border-t border-line px-4 py-2 font-mono text-label tracking-[0.08em] text-dim">
                        {b.caption}
                      </figcaption>
                    )}
                  </figure>
                )}
                <div className="grid gap-3 md:grid-cols-2">
                  {b.tables.map((t) => (
                    <SchemaCard key={t.name} table={t} />
                  ))}
                </div>
              </div>
            );
          }

          default:
            return null;
        }
      })}
    </div>
  );
}
