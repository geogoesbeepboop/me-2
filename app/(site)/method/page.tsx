import type { Metadata } from "next";
import Link from "next/link";
import MaskReveal from "@/components/motion/MaskReveal";
import Toc from "@/components/dossier/Toc";
import { Mdx } from "@/lib/mdx";
import { getMethod } from "@/lib/content";

export const metadata: Metadata = {
  title: "The Method",
  description:
    "The harness around Claude Code — a standing contract, 17 skills, a rim of hooks, specialist subagents, and a token meter. How everything else here gets built.",
};

/**
 * N°000 — the meta-dossier. Same anatomy as a work dossier, but the
 * subject is the machine that builds the machines. Ember on purpose:
 * the forge itself.
 */
export default function MethodPage() {
  const doc = getMethod();

  return (
    <article
      className="pt-36 pb-12"
      style={{ "--accent": "var(--color-ember)" } as React.CSSProperties}
    >
      <header className="px-5 md:px-10">
        <p className="font-mono text-label tracking-[0.16em] text-dim uppercase">
          /method — n°000 — meta —{" "}
          <span className="text-(--accent)">{doc.status}</span>
        </p>
        <h1 className="mt-6 text-hero font-black uppercase stretch-110">
          <MaskReveal lines={["The Method"]} delay={0.35} />
        </h1>
        <p className="mt-8 max-w-2xl text-[1.15rem] leading-relaxed text-ash">
          {doc.summary}
        </p>
      </header>

      {/* headline numbers */}
      {doc.metrics.length > 0 && (
        <div className="mt-14 grid border-y border-line sm:grid-cols-3">
          {doc.metrics.map((m, i) => (
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

      <div className="mt-8 px-5 md:px-10 lg:grid lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-16">
        <aside className="hidden lg:block">
          <div className="sticky top-32">
            <Toc sections={doc.sections} />
          </div>
        </aside>
        <div className="min-w-0">
          <Mdx source={doc.body} />
        </div>
      </div>

      {/* never a dead end — steer into the archive it explains */}
      <Link
        href="/projects"
        className="group mt-12 block border-t border-line px-5 py-16 transition-colors duration-500 ease-(--ease-cine) hover:bg-bone hover:text-void md:px-10"
      >
        <p className="font-mono text-label tracking-[0.2em] text-dim uppercase transition-colors duration-500 group-hover:text-void/60">
          The method is the claim — the work is the evidence
        </p>
        <p className="mt-5 text-display font-black uppercase stretch-110">
          See what it built{" "}
          <span
            aria-hidden
            className="inline-block transition-transform duration-500 ease-(--ease-cine) group-hover:translate-x-3"
          >
            →
          </span>
        </p>
      </Link>
    </article>
  );
}
