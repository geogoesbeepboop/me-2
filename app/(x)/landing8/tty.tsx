"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { SlimNode } from "../data";

interface MethodLine {
  title: string;
  thesis: string;
  status: string;
}

interface OutLine {
  key: string;
  node: ReactNode;
}

const BANNER = String.raw`
 ██████   █████  ███    ███
██       ██   ██ ████  ████
██   ███ ███████ ██ ████ ██
██    ██ ██   ██ ██  ██  ██
 ██████  ██   ██ ██      ██`;

function pad(s: string, n: number) {
  if (s.length >= n - 2) return s + " … ";
  return s + " " + ".".repeat(n - s.length - 2) + " ";
}

export default function Tty({
  nodes,
  liveCount,
  who,
  method,
}: {
  nodes: SlimNode[];
  liveCount: number;
  who: string;
  method: MethodLine;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [lines, setLines] = useState<OutLine[]>([]);
  const [booted, setBooted] = useState(false);
  const [value, setValue] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [histIdx, setHistIdx] = useState(-1);
  const keyCounter = useRef(0);

  const print = useCallback((node: ReactNode) => {
    setLines((prev) => [...prev, { key: `l${keyCounter.current++}`, node }]);
  }, []);

  /* ── boot script — every status line is real frontmatter ── */
  const bootScript = useMemo(() => {
    const sys = nodes.filter((n) => n.kind === "projects");
    const tx = nodes.filter((n) => n.kind === "writing");
    const script: { t: number; node: ReactNode }[] = [
      { t: 0, node: <pre className="l8-banner">{BANNER}</pre> },
      { t: 120, node: "GAM SYSTEMS BIOS v2.6 — SAN FRANCISCO" },
      { t: 80, node: "COPYRIGHT (C) 2026 GEORGE ANDRADE-MUÑOZ" },
      { t: 320, node: " " },
      { t: 240, node: `${pad("MEMORY CHECK", 28)}OK` },
      { t: 260, node: `${pad("MOUNTING /ARCHIVE", 28)}OK` },
      { t: 200, node: " " },
      { t: 160, node: "DETECTING SYSTEMS:" },
      ...sys.map((p) => ({
        t: 230,
        node: (
          <span>
            {"  "}
            {pad(`N°${p.no} ${p.slug.toUpperCase()}`, 34)}
            <b className={p.live ? "l8-live" : ""}>{p.status}</b>
          </span>
        ),
      })),
      { t: 200, node: "DETECTING TRANSMISSIONS:" },
      ...tx.map((w) => ({
        t: 180,
        node: (
          <span>
            {"  "}
            {pad(`N°${w.no} ${w.slug.toUpperCase()}`, 34)}
            <b>{w.readingTime} MIN</b>
          </span>
        ),
      })),
      { t: 300, node: " " },
      { t: 160, node: "DOCTRINE ............. BUILD FAST, ADAPT FASTER" },
      { t: 380, node: " " },
      {
        t: 200,
        node: (
          <span>
            BOOT COMPLETE. TYPE <b>help</b> FOR COMMANDS.
          </span>
        ),
      },
    ];
    return script;
  }, [nodes]);

  /* run the boot — skippable with any key/click */
  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let cancelled = false;
    const timers: ReturnType<typeof setTimeout>[] = [];

    const finishInstantly = () => {
      if (cancelled) return;
      cancelled = true;
      timers.forEach(clearTimeout);
      setLines(
        bootScript.map((s) => ({ key: `b${keyCounter.current++}`, node: s.node }))
      );
      setBooted(true);
    };

    if (reduced) {
      finishInstantly();
      return;
    }

    let acc = 0;
    bootScript.forEach((s, i) => {
      acc += s.t;
      timers.push(
        setTimeout(() => {
          if (cancelled) return;
          setLines((prev) => [
            ...prev,
            { key: `b${keyCounter.current++}`, node: s.node },
          ]);
          if (i === bootScript.length - 1) {
            cancelled = true;
            setBooted(true);
          }
        }, acc)
      );
    });

    const skip = () => finishInstantly();
    window.addEventListener("keydown", skip, { once: true });
    window.addEventListener("pointerdown", skip, { once: true });
    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
      window.removeEventListener("keydown", skip);
      window.removeEventListener("pointerdown", skip);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* keep the tail in view, keep the input focused */
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [lines, booted]);
  useEffect(() => {
    if (booted) inputRef.current?.focus();
  }, [booted]);

  /* ── the shell ─────────────────────────────────────── */
  const resolve = useCallback(
    (arg: string) => {
      const q = arg.toLowerCase();
      return (
        nodes.find((n) => n.slug === q) ??
        nodes.filter((n) => n.slug.startsWith(q)).reduce<SlimNode | null>(
          (acc, n, _, arr) => (arr.length === 1 ? n : acc),
          null
        )
      );
    },
    [nodes]
  );

  const lsLines = useCallback(
    (kind?: "projects" | "writing") =>
      nodes
        .filter((n) => !kind || n.kind === kind)
        .map((n) => (
          <span key={n.slug}>
            {pad(`N°${n.no}`, 8)}
            {pad(n.tag, 8)}
            <Link href={n.href} className="l8-a">
              {n.slug}
            </Link>
            {"  "}
            <i className="l8-dim">{n.status || `${n.readingTime} min`}</i>
          </span>
        )),
    [nodes]
  );

  const run = useCallback(
    (raw: string) => {
      const cmd = raw.trim();
      print(
        <span>
          <b className="l8-prompt-echo">guest@gam:~$</b> {cmd}
        </span>
      );
      if (!cmd) return;
      const [verb, ...args] = cmd.toLowerCase().split(/\s+/);
      const arg = args.join(" ");

      switch (verb) {
        case "help":
          [
            "COMMANDS:",
            "  ls [projects|writing]   list the archive",
            "  cat <slug>              print a file's summary here",
            "  open <slug>             open the file (leaves the tty)",
            "  status                  systems report",
            "  whoami                  the operator",
            "  method                  the standing method",
            "  clear                   wipe the screen",
            "  exit                    back to the designed site",
            "TAB completes slugs. ARROWS recall history.",
          ].forEach((l) => print(l));
          break;
        case "ls":
          if (arg && arg !== "projects" && arg !== "writing") {
            print(`ls: ${arg}: not a directory — try ls, ls projects, ls writing`);
          } else {
            lsLines(arg as "projects" | "writing" | undefined).forEach((l) =>
              print(l)
            );
          }
          break;
        case "cat": {
          if (!arg) {
            print("cat: which file? try cat dj-agent");
            break;
          }
          const n = resolve(arg);
          if (!n) {
            print(`cat: ${arg}: no such file`);
            break;
          }
          print(
            <span>
              <b>
                N°{n.no} {n.title.toUpperCase()}
              </b>{" "}
              <i className="l8-dim">
                [{n.tag}
                {n.domain ? ` · ${n.domain}` : ""} · {n.status || n.date}]
              </i>
            </span>
          );
          print(n.summary);
          print(
            <span>
              follow:{" "}
              <Link href={n.href} className="l8-a">
                {n.href}
              </Link>
            </span>
          );
          break;
        }
        case "open": {
          const n = resolve(arg);
          if (!n) {
            print(`open: ${arg || "(nothing)"}: no such file`);
            break;
          }
          print(`opening ${n.href} ...`);
          setTimeout(() => router.push(n.href), 350);
          break;
        }
        case "status":
          print(
            `${nodes.filter((n) => n.kind === "projects").length} SYSTEMS ON FILE — ${liveCount} REPORTING LIVE`
          );
          nodes
            .filter((n) => n.kind === "projects")
            .forEach((p) =>
              print(
                <span>
                  {"  "}
                  {pad(p.slug.toUpperCase(), 24)}
                  <b className={p.live ? "l8-live" : ""}>{p.status}</b>
                </span>
              )
            );
          break;
        case "whoami":
          print(`george andrade-muñoz — ${who}`);
          print("doctrine: build fast, adapt faster. the how gets published.");
          break;
        case "method":
          print(`${method.title.toUpperCase()} — ${method.status}`);
          print(method.thesis);
          print(
            <span>
              follow:{" "}
              <Link href="/method" className="l8-a">
                /method
              </Link>
            </span>
          );
          break;
        case "clear":
          setLines([]);
          break;
        case "exit":
          print("logging out ...");
          setTimeout(() => router.push("/"), 350);
          break;
        case "sudo":
          print("guest is not in the sudoers file. this incident will be archived.");
          break;
        default:
          print(`command not found: ${verb} — try help`);
      }
    },
    [print, lsLines, resolve, router, nodes, liveCount, who, method]
  );

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      const v = value;
      setValue("");
      setHistIdx(-1);
      if (v.trim()) setHistory((h) => [v, ...h].slice(0, 50));
      run(v);
    } else if (e.key === "Tab") {
      e.preventDefault();
      const parts = value.split(/\s+/);
      const last = parts.at(-1) ?? "";
      if (!last) return;
      const hits = nodes.filter((n) => n.slug.startsWith(last.toLowerCase()));
      if (hits.length === 1) {
        parts[parts.length - 1] = hits[0].slug;
        setValue(parts.join(" ") + " ");
      } else if (hits.length > 1) {
        print(hits.map((h) => h.slug).join("   "));
      }
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      const i = Math.min(histIdx + 1, history.length - 1);
      if (history[i]) {
        setHistIdx(i);
        setValue(history[i]);
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      const i = histIdx - 1;
      setHistIdx(Math.max(i, -1));
      setValue(i >= 0 ? history[i] : "");
    }
  };

  const fkeys: [string, string][] = [
    ["F1", "help"],
    ["F2", "ls"],
    ["F3", "status"],
    ["F10", "exit"],
  ];

  return (
    <div className="l8-room" onClick={() => inputRef.current?.focus()}>
      <div className="l8-bezel">
        <div className="l8-screen">
          <div className="l8-scan" aria-hidden />
          <div className="l8-roll" aria-hidden />
          <div className="l8-content" ref={scrollRef}>
            {lines.map((l) => (
              <div key={l.key} className="l8-line">
                {l.node}
              </div>
            ))}
            {booted && (
              <div className="l8-line l8-inputline">
                <b className="l8-prompt-echo">guest@gam:~$</b>
                <span className="l8-typed">{value}</span>
                <span className="l8-cursor" aria-hidden />
                <input
                  ref={inputRef}
                  className="l8-real-input"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  onKeyDown={onKeyDown}
                  aria-label="Terminal input"
                  autoCapitalize="off"
                  autoComplete="off"
                  autoCorrect="off"
                  spellCheck={false}
                />
              </div>
            )}
            {!booted && (
              <p className="l8-skip l8-dim">— any key skips the boot —</p>
            )}
          </div>
        </div>
        <div className="l8-fkeys">
          {fkeys.map(([k, c]) => (
            <button key={k} className="l8-fkey" onClick={() => run(c)}>
              <b>{k}</b> {c.toUpperCase()}
            </button>
          ))}
          <span className="l8-badge">80×24 · P1 PHOSPHOR · NO BLINK</span>
        </div>
      </div>
    </div>
  );
}
