import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import MaskReveal from "@/components/motion/MaskReveal";
import CrossLinks from "@/components/dossier/CrossLinks";
import { Mdx } from "@/lib/mdx";
import { accentOf, getNode, nodesOf, resolveRef, stamp } from "@/lib/content";

interface Props {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return nodesOf("lab").map((n) => ({ slug: n.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const node = getNode("lab", slug);
  return node ? { title: node.title, description: node.summary } : {};
}

export default async function LabBench({ params }: Props) {
  const { slug } = await params;
  const node = getNode("lab", slug);
  if (!node) notFound();

  const reflection = node.reflection ? resolveRef(node.reflection) : undefined;

  const stamps: [string, string][] = [
    ["On the bench since", node.started ? stamp(node.started) : "—"],
    ["Last update", node.updated ? stamp(node.updated) : "—"],
    ["Status", node.status],
    ["Track", "Lab — raw"],
  ];

  return (
    <article
      className="bench-grid pt-36 pb-12"
      style={{ "--accent": accentOf(node) } as React.CSSProperties}
    >
      <header className="px-5 md:px-10">
        <div className="mx-auto w-full max-w-[880px]">
          <p className="flex items-center gap-3 font-mono text-label tracking-[0.16em] text-dim uppercase">
            <span className="live-dot" aria-hidden />
            /lab/{node.slug} — n°{node.no}
            {node.domain && <span className="text-ash"> — {node.domain}</span>}
          </p>
          <h1 className="mt-6 text-hero font-black uppercase stretch-125">
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
          <p className="mt-5 max-w-2xl text-ash">{node.summary}</p>
        </div>
      </header>

      <div className="mt-14 grid border-y border-dashed border-line-loud bg-void/60 font-mono text-mono-sm sm:grid-cols-2 lg:grid-cols-4">
        {stamps.map(([k, v], i) => (
          <div
            key={k}
            className={`border-dashed border-line-loud px-5 py-5 md:px-10 ${
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

      <div className="mx-auto mt-16 w-full max-w-[880px] px-5 md:px-10">
        <Mdx source={node.body} />
        <CrossLinks node={node} n="--" />
      </div>

      {reflection && (
        <Link
          href={reflection.href}
          className="group mt-12 block border-t border-dashed border-line-loud px-5 py-16 transition-colors duration-500 ease-(--ease-cine) hover:bg-bone hover:text-void md:px-10"
        >
          <p className="font-mono text-label tracking-[0.2em] text-dim uppercase transition-colors duration-500 group-hover:text-void/60">
            The thinking that runs underneath this bench
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
