import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import MaskReveal from "@/components/motion/MaskReveal";
import Toc from "@/components/dossier/Toc";
import CrossLinks from "@/components/dossier/CrossLinks";
import { Mdx } from "@/lib/mdx";
import { accentOf, getNode, nodesOf, resolveRef } from "@/lib/content";

interface Props {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return nodesOf("work").map((n) => ({ slug: n.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const node = getNode("work", slug);
  return node ? { title: node.title, description: node.summary } : {};
}

export default async function WorkDossier({ params }: Props) {
  const { slug } = await params;
  const node = getNode("work", slug);
  if (!node) notFound();

  const reflection = node.reflection ? resolveRef(node.reflection) : undefined;
  const sections = node.sections ?? [];
  const tocSections = [...sections, { id: "related", title: "Connected nodes" }];
  const relatedN = String(sections.length).padStart(2, "0");

  const meta: [string, string][] = [
    ["Role", node.role ?? "—"],
    ["Stack", node.stack?.join(" · ") ?? "—"],
    ["Timeline", node.timeline ?? "—"],
    ["Status", node.status],
  ];

  return (
    <article
      className="pt-36 pb-12"
      style={{ "--accent": accentOf(node) } as React.CSSProperties}
    >
      <header className="px-5 md:px-10">
        <p className="font-mono text-label tracking-[0.16em] text-dim uppercase">
          /work/{node.slug} — n°{node.no}
          {node.domain && <span className="text-ash"> — {node.domain}</span>}
          {" — "}
          <span className="text-(--accent)">{node.status}</span>
        </p>
        <h1 className="mt-6 text-hero font-black uppercase stretch-110">
          <MaskReveal lines={[node.title]} delay={0.35} />
        </h1>
        <p className="mt-8 max-w-2xl text-[1.15rem] leading-relaxed text-ash">
          {node.summary}
        </p>
      </header>

      {/* dossier meta */}
      <div className="mt-14 grid border-y border-line font-mono text-mono-sm sm:grid-cols-2 lg:grid-cols-4">
        {meta.map(([k, v], i) => (
          <div
            key={k}
            className={`border-line px-5 py-5 md:px-10 ${
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

      {/* headline metrics */}
      {node.metrics && (
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

      {/* file body + sticky file index */}
      <div className="mt-8 px-5 md:px-10 lg:grid lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-16">
        <aside className="hidden lg:block">
          <div className="sticky top-32">
            <Toc sections={tocSections} />
          </div>
        </aside>
        <div className="min-w-0">
          <Mdx source={node.body} />
          <CrossLinks node={node} n={relatedN} />
        </div>
      </div>

      {/* steer to the reflection — never a dead end */}
      {reflection && (
        <Link
          href={reflection.href}
          className="group mt-12 block border-t border-line px-5 py-16 transition-colors duration-500 ease-(--ease-cine) hover:bg-bone hover:text-void md:px-10"
        >
          <p className="font-mono text-label tracking-[0.2em] text-dim uppercase transition-colors duration-500 group-hover:text-void/60">
            The reflection — read the thinking behind this build
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
