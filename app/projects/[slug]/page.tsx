import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import MaskReveal from "@/components/motion/MaskReveal";
import Toc from "@/components/dossier/Toc";
import CrossLinks from "@/components/dossier/CrossLinks";
import { Mdx } from "@/lib/mdx";
import { accentOf, getNode, nodesOf, resolveRef, stamp } from "@/lib/content";

interface Props {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return nodesOf("projects").map((n) => ({ slug: n.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const node = getNode("projects", slug);
  return node ? { title: node.title, description: node.summary } : {};
}

/**
 * One dossier page, two postures. SHIP entries read as finished files —
 * solid hairlines, role/stack/timeline, metrics, a sticky section index.
 * BENCH entries keep the workbench: grid texture, dashed hairlines,
 * started/updated stamps, the open question up top, related links at the
 * bottom. Same URL space either way — projects change stage, not address.
 */
export default async function ProjectDossier({ params }: Props) {
  const { slug } = await params;
  const node = getNode("projects", slug);
  if (!node) notFound();

  const bench = node.stage === "bench";
  const live = node.status === "LIVE";
  const reflection = node.reflection ? resolveRef(node.reflection) : undefined;
  const sections = node.sections ?? [];

  const meta: [string, string][] = bench
    ? [
        ["On the bench since", node.started ? stamp(node.started) : "—"],
        ["Last update", node.updated ? stamp(node.updated) : "—"],
        ["Status", node.status],
        ["Stage", "Bench — raw, still moving"],
      ]
    : [
        ["Role", node.role ?? "—"],
        ["Stack", node.stack?.join(" · ") ?? "—"],
        ["Timeline", node.timeline ?? "—"],
        ["Status", node.status],
      ];

  const hairline = bench ? "border-dashed border-line-loud" : "border-line";

  return (
    <article
      className={`${bench ? "bench-grid" : ""} pt-36 pb-12`}
      style={{ "--accent": accentOf(node) } as React.CSSProperties}
    >
      <header className="px-5 md:px-10">
        <div className={bench ? "mx-auto w-full max-w-[880px]" : undefined}>
          <p className="flex items-center gap-3 font-mono text-label tracking-[0.16em] text-dim uppercase">
            {live && <span className="live-dot" aria-hidden />}
            /projects/{node.slug} — n°{node.no}
            {node.domain && <span className="text-ash"> — {node.domain}</span>}
            {" — "}
            <span className="text-(--accent)">{node.status}</span>
          </p>
          <h1
            className={`mt-6 text-hero font-black uppercase ${
              bench ? "stretch-125" : "stretch-110"
            }`}
          >
            <MaskReveal lines={[node.title]} delay={0.35} />
          </h1>
          {node.question && (
            <p className="mt-8 max-w-2xl text-title font-semibold">
              <span className="mr-4 align-middle font-mono text-label tracking-[0.2em] text-(--accent) uppercase">
                Q:
              </span>
              {node.question}
            </p>
          )}
          <p
            className={`${node.question ? "mt-5" : "mt-8"} max-w-2xl ${
              bench ? "text-ash" : "text-[1.15rem] leading-relaxed text-ash"
            }`}
          >
            {node.summary}
          </p>
        </div>
      </header>

      {/* dossier meta / bench stamps */}
      <div
        className={`mt-14 grid border-y font-mono text-mono-sm sm:grid-cols-2 lg:grid-cols-4 ${hairline} ${
          bench ? "bg-void/60" : ""
        }`}
      >
        {meta.map(([k, v], i) => (
          <div
            key={k}
            className={`px-5 py-5 md:px-10 ${hairline} ${
              i > 0 ? "border-t sm:border-t-0 sm:border-l" : ""
            }`}
          >
            <p className="mb-1 text-label tracking-[0.2em] text-dim uppercase">
              {k}
            </p>
            <p className="text-bone">{v}</p>
          </div>
        ))}
      </div>

      {/* headline metrics — ship entries lead with the numbers */}
      {!bench && node.metrics && (
        <div className="grid border-b border-line sm:grid-cols-3">
          {node.metrics.map((m, i) => (
            <div
              key={m.k}
              className={`border-line px-5 py-10 md:px-10 ${
                i > 0 ? "border-t sm:border-t-0 sm:border-l" : ""
              }`}
            >
              <p className="text-display font-black stretch-110">{m.v}</p>
              <p className="mt-2 font-mono text-label tracking-[0.2em] text-dim uppercase">
                {m.k}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* body — ship gets the sticky file index, bench gets the centered column */}
      {bench ? (
        <div className="mx-auto mt-16 w-full max-w-[880px] px-5 md:px-10">
          <Mdx source={node.body} />
          <CrossLinks node={node} n="--" />
        </div>
      ) : (
        <div className="mt-8 px-5 md:px-10 lg:grid lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-16">
          <aside className="hidden lg:block">
            <div className="sticky top-32">
              <Toc sections={sections} />
            </div>
          </aside>
          <div className="min-w-0">
            <Mdx source={node.body} />
          </div>
        </div>
      )}

      {/* steer to the reflection — never a dead end */}
      {reflection && (
        <Link
          href={reflection.href}
          className={`group mt-12 block border-t px-5 py-16 transition-colors duration-500 ease-(--ease-cine) hover:bg-bone hover:text-void md:px-10 ${hairline}`}
        >
          <p className="font-mono text-label tracking-[0.2em] text-dim uppercase transition-colors duration-500 group-hover:text-void/60">
            {bench
              ? "The thinking that runs underneath this bench"
              : "The reflection — read the thinking behind this build"}
          </p>
          <p className="mt-5 text-display font-black uppercase stretch-110">
            {reflection.title}{" "}
            <span
              aria-hidden
              className="inline-block transition-transform duration-500 ease-(--ease-cine) group-hover:translate-x-3"
            >
              →
            </span>
          </p>
        </Link>
      )}
    </article>
  );
}
