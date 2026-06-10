import { MDXRemote } from "next-mdx-remote/rsc";
import type { MDXComponents } from "mdx/types";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";
import { mdxComponents } from "@/components/mdx-components";

/** Server-rendered MDX with the artifact library in scope. */
export function Mdx({
  source,
  components,
}: {
  source: string;
  components?: MDXComponents;
}) {
  return (
    <MDXRemote
      source={source}
      options={{
        // local, trusted content — keep JSX attribute expressions
        // (v6 strips them by default for untrusted remote MDX)
        blockJS: false,
        mdxOptions: {
          remarkPlugins: [remarkGfm],
          rehypePlugins: [rehypeSlug],
        },
      }}
      components={{ ...mdxComponents, ...components }}
    />
  );
}
