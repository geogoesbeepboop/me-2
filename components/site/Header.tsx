"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { n: "01", label: "PROJECTS", href: "/projects" },
  { n: "02", label: "WRITING", href: "/writing" },
  { n: "03", label: "ABOUT", href: "/about" },
] as const;

/**
 * Fixed, transparent, mix-blend-difference — stays legible when inverted
 * bone bands pass beneath it. Monogram only: the name itself is the hero.
 */
export default function Header() {
  const pathname = usePathname();

  return (
    <header className="fixed inset-x-0 top-0 z-50 mix-blend-difference">
      <div className="flex items-baseline justify-between px-5 py-5 md:px-10">
        <Link
          href="/"
          aria-label="George Andrade-Muñoz — home"
          className="font-mono text-label font-bold tracking-[0.22em] text-bone uppercase"
        >
          <span className="hidden sm:inline">George </span>Andrade-Muñoz
        </Link>
        <nav aria-label="Primary">
          <ul className="flex items-baseline gap-5 md:gap-8">
            {NAV.map((item) => {
              const active = pathname.startsWith(item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className="group font-mono text-label text-bone uppercase"
                  >
                    <span className="mr-1 hidden text-dim md:inline">
                      {item.n}
                    </span>
                    <span
                      className={`underline-offset-6 transition-colors duration-300 group-hover:underline ${
                        active ? "underline decoration-ember" : ""
                      }`}
                    >
                      {item.label}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </header>
  );
}
