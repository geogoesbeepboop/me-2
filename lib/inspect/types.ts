/**
 * Click-to-inspect — the real artifact behind a topology component.
 * Shapes, picked per component:
 *   blocks  — a designed, readable view of what the component does:
 *             flow diagrams, rule cards, schema maps, step lists, fact
 *             chips, and the occasional verbatim one-liner. The default
 *             for every agent component — UI, not a code dump;
 *   excerpt — verbatim file content, for components whose text IS the
 *             artifact (the method page's skills, hooks, agent defs);
 *   files   — several verbatim files behind one component (tabbed);
 *   trace   — a designed observability view (what a run looks like in
 *             Langfuse) for components that are about telemetry.
 * Everything is distilled from the source repo — names, thresholds,
 * rules, and quotes are as coded, never illustrative. Trace timings
 * are representative of a documented run. Keyed by the DiagramNode id.
 */
export interface InspectFile {
  /** file path inside the source repo */
  path: string;
  /** language hint, e.g. "python" | "ts" | "md" | "yaml" */
  lang?: string;
  /** one line on why this file matters */
  note?: string;
  /** verbatim excerpt from the file */
  excerpt: string;
}

export interface TraceSpan {
  name: string;
  /** langfuse vocabulary: span = step, generation = model call,
      gate = deterministic check, event = side-effect */
  type: "span" | "generation" | "gate" | "event";
  /** nesting level, 0 = direct child of the trace */
  depth: number;
  /** ms offset from trace start */
  start: number;
  /** ms duration */
  dur: number;
  /** right column: model · tokens · cost · verdict */
  detail?: string;
  status?: "ok" | "fail";
}

export interface TraceData {
  /** trace title, e.g. "research:AAPL · fundamentals" */
  title: string;
  subtitle?: string;
  /** total ms (sets the waterfall scale) */
  total: number;
  spans: TraceSpan[];
  /** scores attached to the trace, real names from the tracing code */
  scores?: { name: string; value: string; accent?: boolean }[];
  footnote?: string;
}

/* ── flow diagrams (shared with the deep dive's state machines) ────── */

export interface FlowState {
  id: string;
  label: string;
  col: number;
  row: number;
  /** gate = accent outline · terminal = dashed, dim */
  kind?: "gate" | "terminal";
}

export interface FlowTransition {
  from: string;
  to: string;
  label?: string;
  dashed?: boolean;
}

export interface StateMachine {
  title: string;
  caption?: string;
  states: FlowState[];
  transitions: FlowTransition[];
}

/* ── sub-graphs — what's actually inside a compressed topology chunk ──
   Structurally identical to the deep dive's DiagramNode/DiagramEdge so a
   clicked chunk (Gather, Eval harness…) can open onto the real internal
   wiring — actual sources, actual context, actual suites — rendered on
   the same layout engine at drawer scale. */

export interface GraphNode {
  id: string;
  label: string;
  sub?: string;
  col: number;
  row: number;
  /** accent outline = the model has no say here (same doctrine as topology) */
  accent?: boolean;
}

export interface GraphEdge {
  from: string;
  to: string;
  label?: string;
  dashed?: boolean;
}

/* ── designed blocks — the UI behind a clicked component ───────────── */

export interface RuleItem {
  /** short name, set in mono caps */
  name: string;
  /** the rule in plain words — thresholds and units spelled out */
  detail: string;
  /** optional value chip, e.g. "≥ 0.70" or "$0.10 / query" */
  value?: string;
  /** a deliberately-failing condition (e.g. a hard stop) — ember value */
  fail?: boolean;
}

export interface StepItem {
  name: string;
  detail?: string;
  /** colors the step marker: model call, deterministic gate, i/o, human */
  tag?: "model" | "gate" | "io" | "human";
}

export interface KvItem {
  k: string;
  v: string;
  accent?: boolean;
}

export interface SchemaColumn {
  name: string;
  type: string;
  key?: "pk" | "fk";
  /** for fk columns — the table it references */
  ref?: string;
}

export interface SchemaTable {
  name: string;
  note?: string;
  columns: SchemaColumn[];
  /** grid placement in the relations diagram */
  col: number;
  row: number;
}

export type InspectBlock =
  | { kind: "note"; text: string }
  /** a verbatim line where the wording itself is the artifact */
  | { kind: "quote"; text: string; cite?: string }
  | {
      kind: "flow";
      title?: string;
      caption?: string;
      states: FlowState[];
      transitions: FlowTransition[];
    }
  | {
      kind: "graph";
      title?: string;
      caption?: string;
      nodes: GraphNode[];
      edges: GraphEdge[];
    }
  | { kind: "rules"; title?: string; items: RuleItem[] }
  | { kind: "steps"; title?: string; items: StepItem[]; ordered?: boolean }
  | { kind: "kv"; title?: string; items: KvItem[] }
  | {
      kind: "schema";
      title?: string;
      caption?: string;
      tables: SchemaTable[];
      relations?: FlowTransition[];
    };

export interface InspectEntry {
  /** primary path inside the source repo, e.g. "app/services/predictor.py" */
  path: string;
  /** one line on why this file is the component */
  note?: string;
  /** language hint for the excerpt, e.g. "python" | "ts" | "md" | "yaml" */
  lang?: string;
  /** designed, readable blocks — the default shape for agent components */
  blocks?: InspectBlock[];
  /** verbatim excerpt from the file (single-file entries) */
  excerpt?: string;
  /** multiple files behind one component — rendered as tabs */
  files?: InspectFile[];
  /** designed observability view instead of code */
  trace?: TraceData;
}

export type InspectMap = Record<string, InspectEntry>;
