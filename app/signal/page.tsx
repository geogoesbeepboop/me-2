import type { Metadata } from "next";
import { Mdx } from "@/lib/mdx";
import { getSignal, fullStamp } from "@/lib/content";

export const metadata: Metadata = {
  title: "Signal",
  description: "What's occupying the mind right now. Terse on purpose.",
};

export default function SignalPage() {
  const { body, updated } = getSignal();

  return (
    <div className="px-5 pt-36 pb-28 md:px-10">
      <header>
        <p className="flex items-center gap-3 font-mono text-label tracking-[0.16em] text-dim uppercase">
          <span className="live-dot" aria-hidden />
          /signal — updated {fullStamp(updated)}
        </p>
        <h1 className="mt-4 text-display font-black uppercase stretch-125">
          Signal
        </h1>
        <p className="mt-5 max-w-md font-mono text-mono-sm text-ash">
          What&apos;s occupying the mind right now. Terse on purpose.
          Rewritten whenever it changes, not on a schedule.
        </p>
      </header>

      <div className="mt-16 max-w-3xl">
        <Mdx
          source={body}
          components={{
            ol: (props) => <ol className="space-y-0" {...props} />,
            li: (props) => (
              <li
                className="flex items-baseline gap-5 border-t border-line py-5 font-mono text-mono-sm text-bone/85 last:border-b"
                {...props}
              />
            ),
            p: (props) => (
              <p className="font-mono text-mono-sm text-bone/85" {...props} />
            ),
          }}
        />
        <p className="mt-10 font-mono text-mono-sm text-dim">
          — end of transmission <span className="caret" aria-hidden />
        </p>
      </div>
    </div>
  );
}
