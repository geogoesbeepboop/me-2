/**
 * The lane board — one conductor, parallel executor lanes, each pane a
 * still frame of a real session. No animation on purpose (scroll-perf
 * doctrine): this is a photograph of the working shape, not a demo.
 */
export interface LaneLine {
  t?: string;
  k?: "cmd" | "agent" | "out" | "sys";
  s: string;
}

export interface LanePane {
  /** e.g. "conductor" or "lane: grocery-buddy" */
  name: string;
  role: "conductor" | "executor" | "background";
  /** e.g. "this session" · "background agent · own context" */
  sub?: string;
  lines: LaneLine[];
}

export interface LaneContractItem {
  name: string;
  detail: string;
}

const LINE_CLASS: Record<NonNullable<LaneLine["k"]>, string> = {
  cmd: "text-bone",
  agent: "text-bone",
  out: "text-ash",
  sys: "text-dim italic",
};

const ROLE_CLASS: Record<LanePane["role"], string> = {
  conductor: "text-bone border-bone/40",
  executor: "text-ash border-line-loud",
  background: "text-dim border-line",
};

export default function LaneBoard({
  title,
  caption,
  lanes,
  contract,
}: {
  title: string;
  caption?: string;
  lanes: LanePane[];
  /** the lane contract — what every brief must carry */
  contract?: LaneContractItem[];
}) {
  return (
    <figure className="my-10 border border-line bg-panel">
      <figcaption className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-line px-5 py-3">
        <span className="font-mono text-label tracking-[0.18em] text-dim uppercase">
          {title}
        </span>
        {caption && (
          <span className="font-mono text-label tracking-[0.06em] text-dim">
            {caption}
          </span>
        )}
      </figcaption>
      <div className="grid gap-px bg-line md:grid-cols-3">
        {lanes.map((lane) => (
          <div key={lane.name} className="bg-panel px-4 py-4">
            <p className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <span
                className={`border px-1.5 py-0.5 font-mono text-[10px] tracking-[0.16em] uppercase ${ROLE_CLASS[lane.role]}`}
              >
                {lane.role}
              </span>
              <span className="font-mono text-label tracking-[0.14em] text-bone uppercase">
                {lane.name}
              </span>
              {lane.sub && (
                <span className="font-mono text-label tracking-[0.06em] text-dim">
                  {lane.sub}
                </span>
              )}
            </p>
            <pre className="mt-3 overflow-x-auto font-mono text-[12px] leading-[1.9]">
              {lane.lines.map((line, i) => (
                <span key={i} className="block whitespace-pre-wrap">
                  {line.t && <span className="mr-3 text-dim">{line.t}</span>}
                  {line.k === "cmd" && <span className="mr-2 text-dim">$</span>}
                  <span className={LINE_CLASS[line.k ?? "out"]}>{line.s}</span>
                </span>
              ))}
            </pre>
          </div>
        ))}
      </div>
      {contract && contract.length > 0 && (
        <div className="border-t border-line">
          <p className="px-5 pt-3 font-mono text-label tracking-[0.2em] text-dim uppercase">
            The lane contract — no lane starts without all of it
          </p>
          <ul className="grid gap-px bg-line p-px pt-3 sm:grid-cols-2 lg:grid-cols-5">
            {contract.map((c) => (
              <li key={c.name} className="bg-panel px-4 py-3">
                <p className="font-mono text-label tracking-[0.16em] text-bone uppercase">
                  <span aria-hidden className="mr-2 text-dim">
                    ▸
                  </span>
                  {c.name}
                </p>
                <p className="mt-1 font-mono text-[12px] leading-relaxed text-ash">
                  {c.detail}
                </p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </figure>
  );
}
