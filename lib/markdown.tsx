import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";

/**
 * MirroredDoc — plain-markdown renderer for library mirrors.
 * Mirrored docs are foreign text: raw `<`, pseudo-JSX, tables, emoji.
 * They never go through MDX (lib/mdx.tsx is trusted-content-only with
 * blockJS off) — react-markdown renders server-side with no raw-HTML
 * pass, so HTML-shaped text stays literal text. Typography borrows the
 * editorial element map so the stacks read like the rest of the archive.
 */

/** mirrors open with their own H1; the page header already shows the
 *  title, so the duplicate leading heading is dropped at render time */
export function stripLeadingH1(body: string): string {
  return body.replace(/^# .+\n+/, "");
}

const components: Components = {
  h1: (props) => (
    <h2 className="mt-14 mb-5 scroll-mt-32 text-title font-bold text-bone uppercase stretch-110" {...props} />
  ),
  h2: (props) => (
    <h2 className="mt-14 mb-5 scroll-mt-32 text-title font-bold text-bone uppercase stretch-110" {...props} />
  ),
  h3: (props) => (
    <h3 className="mt-10 mb-4 scroll-mt-32 text-[1.15rem] font-bold text-bone uppercase stretch-110" {...props} />
  ),
  h4: (props) => (
    <h4 className="mt-8 mb-3 scroll-mt-32 font-mono text-label tracking-[0.16em] text-bone uppercase" {...props} />
  ),
  p: (props) => <p className="my-4 max-w-[72ch] text-body leading-[1.8] text-bone/80" {...props} />,
  a: ({ href, children }) => {
    // a mirror's relative links point at files on the operator's disk —
    // meaningless on the site, so they render as plain text
    if (href && (/^https?:\/\//.test(href) || href.startsWith("#"))) {
      return (
        <a
          href={href}
          className="text-bone underline decoration-line-loud underline-offset-4 transition-colors duration-300 hover:decoration-ember"
        >
          {children}
        </a>
      );
    }
    return <span className="text-bone/80">{children}</span>;
  },
  ul: (props) => (
    <ul
      className="my-4 max-w-[72ch] list-none space-y-2 text-bone/80 [&>li]:relative [&>li]:pl-6 [&>li]:before:absolute [&>li]:before:left-0 [&>li]:before:content-['—'] [&>li]:before:text-dim"
      {...props}
    />
  ),
  ol: (props) => (
    <ol
      className="my-4 max-w-[72ch] list-decimal space-y-2 pl-5 text-bone/80 marker:font-mono marker:text-mono-sm marker:text-dim"
      {...props}
    />
  ),
  blockquote: (props) => (
    <blockquote className="my-6 max-w-[72ch] border-l border-bone/25 pl-6 text-bone/65 italic" {...props} />
  ),
  code: (props) => (
    <code className="border border-line bg-panel px-1.5 py-0.5 font-mono text-[0.85em] text-bone" {...props} />
  ),
  pre: (props) => (
    <pre
      className="my-8 overflow-x-auto border border-line bg-panel p-5 font-mono text-mono-sm leading-[1.8] text-ash [&>code]:border-0 [&>code]:bg-transparent [&>code]:p-0"
      {...props}
    />
  ),
  hr: () => <hr className="my-12 border-line" />,
  strong: (props) => <strong className="font-semibold text-bone" {...props} />,
  // tables scroll inside their own strip — the page never scrolls sideways
  table: (props) => (
    <div className="my-8 overflow-x-auto">
      <table className="w-full border-collapse text-[0.92rem] leading-relaxed" {...props} />
    </div>
  ),
  th: (props) => (
    <th
      className="border border-line bg-panel px-3 py-2 text-left font-mono text-label tracking-[0.12em] text-dim uppercase"
      {...props}
    />
  ),
  td: (props) => <td className="border border-line px-3 py-2 align-top text-bone/80" {...props} />,
};

export function MirroredDoc({ source }: { source: string }) {
  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSlug]} components={components}>
      {source}
    </ReactMarkdown>
  );
}
