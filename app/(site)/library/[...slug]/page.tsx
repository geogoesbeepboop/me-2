import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import VisibilityChip from "@/components/library/VisibilityChip";
import { MirroredDoc, stripLeadingH1 } from "@/lib/markdown";
import { allLibraryDocs, getLibraryDoc } from "@/lib/library";
import { fullStamp } from "@/lib/content";

interface Props {
  params: Promise<{ slug: string[] }>;
}

export function generateStaticParams() {
  return allLibraryDocs().map((d) => ({ slug: d.urlPath.split("/") }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const doc = getLibraryDoc(slug);
  return doc ? { title: doc.title, description: doc.summary } : {};
}

export default async function LibraryDoc({ params }: Props) {
  const { slug } = await params;
  const doc = getLibraryDoc(slug);
  if (!doc) notFound();

  return (
    <article className="px-5 pt-36 pb-24 md:px-10">
      <div className="mx-auto max-w-[860px]">
        <header>
          <p className="font-mono text-label tracking-[0.16em] text-dim uppercase">
            /library/{doc.collection}
          </p>
          <h1 className="mt-6 text-display font-black uppercase stretch-110">{doc.title}</h1>
          {doc.summary && (
            <p className="mt-6 max-w-2xl text-[1.05rem] leading-relaxed text-ash">{doc.summary}</p>
          )}
          <p className="mt-6 font-mono text-mono-sm text-dim">
            mirrored from <span className="text-ash">{doc.source}</span>
            {doc.sourceCommit && (
              <>
                {" · commit "}
                <span className="text-ash">{doc.sourceCommit}</span>
              </>
            )}
            {" · synced "}
            {fullStamp(doc.syncedAt)}
            {doc.status && (
              <span className="ml-4 border border-line px-2 py-0.5 text-label tracking-[0.14em] text-bone uppercase">
                {doc.status}
              </span>
            )}
            {/* operator-only takedown — invisible off this machine */}
            <span className="ml-4">
              <VisibilityChip source={doc.source} />
            </span>
          </p>
        </header>

        <div className="mt-12 border-t border-line pt-8">
          <MirroredDoc source={stripLeadingH1(doc.body)} />
        </div>

        <Link
          href="/library"
          className="mt-14 inline-block font-mono text-mono-sm text-ash underline-offset-4 hover:underline"
        >
          ← The library
        </Link>
      </div>
    </article>
  );
}
