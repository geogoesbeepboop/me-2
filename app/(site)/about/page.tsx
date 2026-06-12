import type { Metadata } from "next";
import Link from "next/link";
import { Mdx } from "@/lib/mdx";
import { getAbout } from "@/lib/content";

export const metadata: Metadata = {
  title: "About",
  description:
    "George Andrade-Muñoz — engineer in San Francisco. Build fast, adapt faster.",
};

export default function AboutPage() {
  const about = getAbout();

  return (
    <div className="px-5 pt-36 pb-28 md:px-10">
      <header>
        <p className="font-mono text-label tracking-[0.16em] text-dim uppercase">
          /about — the person behind the archive
        </p>
        <h1 className="mt-4 text-display font-black uppercase stretch-125">
          About
        </h1>
      </header>

      <div className="mt-16 grid gap-12 lg:grid-cols-[340px_minmax(0,1fr)] lg:gap-20">
        {/* the facts — portrait, station, schooling, the rest of life */}
        <aside>
          {/* portrait — drop a file in /public and set `photo:` in content/about.mdx */}
          <div className="relative aspect-4/5 overflow-hidden border border-line bg-panel">
            {about.photo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={about.photo}
                alt="George Andrade-Muñoz"
                className="absolute inset-0 h-full w-full object-cover"
              />
            ) : (
              <>
                <div
                  aria-hidden
                  className="absolute inset-0"
                  style={{
                    background:
                      "repeating-linear-gradient(135deg, transparent, transparent 9px, color-mix(in srgb, var(--color-bone) 5%, transparent) 9px, color-mix(in srgb, var(--color-bone) 5%, transparent) 10px)",
                  }}
                />
                <p className="absolute inset-x-0 top-1/2 -translate-y-1/2 text-center font-mono text-label tracking-[0.24em] text-dim uppercase">
                  portrait — en route
                </p>
              </>
            )}
          </div>

          <dl className="mt-8 divide-y divide-line border-y border-line font-mono text-mono-sm">
            <div className="py-4">
              <dt className="mb-1 text-label tracking-[0.2em] text-dim uppercase">
                Based in
              </dt>
              <dd className="text-bone">{about.location}</dd>
            </div>
            {about.work.map((w) => (
              <div key={w.org} className="py-4">
                <dt className="mb-1 text-label tracking-[0.2em] text-dim uppercase">
                  Day job{w.span ? ` — ${w.span}` : ""}
                </dt>
                <dd className="text-bone">
                  {w.role} · {w.org}
                </dd>
              </div>
            ))}
            {about.education.map((e) => (
              <div key={e.school} className="py-4">
                <dt className="mb-1 text-label tracking-[0.2em] text-dim uppercase">
                  Education
                </dt>
                <dd className="text-bone">{e.school}</dd>
                <dd className="mt-0.5 text-ash">{e.degrees.join(" · ")}</dd>
              </div>
            ))}
          </dl>

          <p className="mt-8 mb-3 font-mono text-label tracking-[0.2em] text-dim uppercase">
            Off the clock
          </p>
          <ul className="flex flex-wrap gap-2">
            {about.interests.map((i) => (
              <li
                key={i}
                className="border border-line bg-panel px-2.5 py-1 font-mono text-label tracking-[0.08em] text-ash uppercase"
              >
                {i}
              </li>
            ))}
          </ul>
        </aside>

        {/* the beliefs — motto first, then the small thoughts */}
        <div className="max-w-2xl">
          <Mdx
            source={about.body}
            components={{
              p: (props) => (
                <p
                  className="mb-7 text-[1.15rem] leading-relaxed text-ash [&>strong]:text-bone"
                  {...props}
                />
              ),
            }}
          />
          <p className="mt-12 border-t border-line pt-6 font-mono text-mono-sm text-dim">
            how I build is its own file —{" "}
            <Link
              href="/method"
              className="text-bone underline decoration-(--accent) underline-offset-4 transition-colors hover:text-(--accent)"
            >
              n°000, the method
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
