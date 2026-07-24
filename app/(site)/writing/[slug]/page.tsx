import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import CrossLinks from "@/components/dossier/CrossLinks";
import { Mdx } from "@/lib/mdx";
import { getNode, nodesOf, fullStamp } from "@/lib/content";

interface Props {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return nodesOf("writing").map((n) => ({ slug: n.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const node = getNode("writing", slug);
  return node ? { title: node.title, description: node.summary } : {};
}

export default async function WritingPost({ params }: Props) {
  const { slug } = await params;
  const node = getNode("writing", slug);
  if (!node) notFound();

  return (
    <article
      className="px-5 pt-36 pb-24 md:px-10"
      style={{ "--accent": "var(--color-post)" } as React.CSSProperties}
    >
      <div className="mx-auto max-w-[780px]">
        <header>
          <p className="font-mono text-label tracking-[0.16em] text-dim uppercase">
            Post n°{node.no} — {fullStamp(node.date)} — {node.readingTime} min
          </p>
          <h1 className="mt-6 text-display font-black uppercase stretch-110">
            {node.title}
          </h1>
          <p className="mt-6 text-[1.15rem] leading-relaxed text-ash">
            {node.summary}
          </p>
        </header>

        <div className="mt-12 space-y-5 border-t border-line pt-12">
          <Mdx source={node.body} />
        </div>

        <CrossLinks node={node} n="∞" />

        <Link
          href="/library"
          className="mt-10 inline-block font-mono text-mono-sm text-ash underline-offset-4 hover:underline"
        >
          ← All notes, in the library
        </Link>
      </div>
    </article>
  );
}
