import type { Node } from "@/lib/content";
import { accentOf, KIND_TAG, stamp } from "@/lib/content";
import IndexRow from "./IndexRow";
import Reveal from "@/components/motion/Reveal";

function rowProps(node: Node) {
  const base = {
    no: `N°${node.no}`,
    tag: KIND_TAG[node.kind],
    href: `/${node.path}`,
    title: node.title,
    status: node.status,
    accent: accentOf(node),
    live: node.kind === "lab",
    dashed: node.kind === "lab",
  };

  if (node.kind === "work") {
    return {
      ...base,
      primaryMeta: node.year ?? stamp(node.date),
      thesis: node.thesis ?? node.summary,
      secondary: [
        node.domain,
        node.stack?.slice(0, 3).join(" · "),
        node.metrics?.[0] && `${node.metrics[0].v} ${node.metrics[0].k}`,
      ]
        .filter(Boolean)
        .join(" — "),
    };
  }

  if (node.kind === "lab") {
    return {
      ...base,
      primaryMeta: node.updated ? `UPD ${stamp(node.updated)}` : stamp(node.date),
      thesis: node.question ?? node.summary,
      secondary: [
        node.domain,
        node.started && `on the bench since ${stamp(node.started)}`,
        "raw — updates, open questions, no polish",
      ]
        .filter(Boolean)
        .join(" — "),
    };
  }

  return {
    ...base,
    primaryMeta: stamp(node.date),
    thesis: node.thesis ?? node.summary,
    secondary: `${node.readingTime} min read — reflection`,
  };
}

export default function ArchiveIndex({ nodes }: { nodes: Node[] }) {
  return (
    <div>
      {/* column legend */}
      <div className="hidden grid-cols-[72px_64px_1fr_120px_140px_28px] gap-x-4 px-10 pb-3 font-mono text-label tracking-[0.18em] text-dim uppercase md:grid">
        <span>N°</span>
        <span>Type</span>
        <span>Title</span>
        <span className="text-right">Date</span>
        <span className="text-right">Status</span>
        <span />
      </div>
      <ul>
        {nodes.map((node, i) => (
          <li key={node.path}>
            <Reveal delay={Math.min(i * 0.05, 0.3)}>
              <IndexRow {...rowProps(node)} />
            </Reveal>
          </li>
        ))}
      </ul>
      <div className="border-t border-line" />
    </div>
  );
}
