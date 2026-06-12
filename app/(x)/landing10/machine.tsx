"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { ReactNode } from "react";

export interface Slot {
  code: string;
  title: string;
  tagline: string;
  net: string;
  href: string;
  accent: string;
  line: string;
  no: string;
  status: string;
  kind: string;
}

interface MethodFacts {
  title: string;
  thesis: string;
  metrics: { k: string; v: string }[];
}

type Phase = "idle" | "keyed" | "vending" | "dispensed";

export default function Machine({
  slots,
  methodFacts,
}: {
  slots: Slot[];
  methodFacts: MethodFacts;
}) {
  const [display, setDisplay] = useState<ReactNode>("READY — PUNCH A CODE");
  const [keyed, setKeyed] = useState("");
  const [phase, setPhase] = useState<Phase>("idle");
  const [vended, setVended] = useState<Slot | null>(null);
  const [shaking, setShaking] = useState<string | null>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  const later = (fn: () => void, ms: number) => {
    timers.current.push(setTimeout(fn, ms));
  };

  const vend = useCallback(
    (code: string) => {
      const slot = slots.find((s) => s.code === code);
      if (!slot) {
        setDisplay(`NO SLOT ${code} — TRY ${slots[0].code}–${slots.at(-1)!.code}`);
        setKeyed("");
        setPhase("idle");
        return;
      }
      setPhase("vending");
      setDisplay(`VENDING ${code} — ${slot.title.toUpperCase()}…`);
      setShaking(code);
      later(() => {
        setShaking(null);
        setVended(slot);
        setPhase("dispensed");
        setDisplay(
          <span>
            DISPENSED — CHECK THE TRAY. <b>NO CHARGE.</b>
          </span>
        );
        setKeyed("");
      }, 1100);
    },
    [slots]
  );

  const press = useCallback(
    (k: string) => {
      if (phase === "vending") return;
      if (k === "CLR") {
        setKeyed("");
        setPhase("idle");
        setDisplay("READY — PUNCH A CODE");
        return;
      }
      const next = (keyed + k).slice(0, 2);
      setKeyed(next);
      setPhase("keyed");
      setDisplay(`CODE: ${next}${next.length < 2 ? "_" : ""}`);
      if (next.length === 2) vend(next);
    },
    [keyed, phase, vend]
  );

  /* physical keyboard works too */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const k = e.key.toUpperCase();
      if (["A", "B"].includes(k) || /^[1-9]$/.test(k)) press(k);
      if (k === "ESCAPE") press("CLR");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [press]);

  const coin = () => {
    setDisplay("THIS MACHINE TAKES ATTENTION, NOT MONEY.");
    later(() => phase === "idle" && setDisplay("READY — PUNCH A CODE"), 2600);
  };

  const rows = [slots.filter((s) => s.code.startsWith("A")), slots.filter((s) => s.code.startsWith("B"))];

  return (
    <div className="l10-street">
      <p className="l10-sign" aria-hidden>
        OPEN ALL NIGHT
      </p>

      <div className="l10-machine">
        {/* ── glass side ───────────────────────────────── */}
        <div className="l10-glass">
          <p className="l10-marquee">GAM GOODS — SELF SERVICE</p>

          {rows.map((row, ri) => (
            <div key={ri} className="l10-shelf">
              {row.map((s) => (
                <button
                  key={s.code}
                  className={`l10-item ${shaking === s.code ? "is-shaking" : ""} ${
                    vended?.code === s.code ? "is-gone" : ""
                  }`}
                  style={{ "--c": s.accent } as React.CSSProperties}
                  onClick={() => phase !== "vending" && vend(s.code)}
                  aria-label={`Vend ${s.code} — ${s.title}`}
                >
                  <span className="l10-item-band" aria-hidden />
                  <span className="l10-item-title">{s.title}</span>
                  <span className="l10-item-net">{s.net}</span>
                  <span className="l10-coil" aria-hidden />
                  <span className="l10-pricetag">
                    {s.code} · 1 ATTN
                  </span>
                </button>
              ))}
            </div>
          ))}

          {/* nutrition label on the glass — the method */}
          <Link href="/method" className="l10-label">
            <span className="l10-label-head">NUTRITION FACTS</span>
            <span className="l10-label-title">{methodFacts.title.toUpperCase()}</span>
            {methodFacts.metrics.map((m) => (
              <span key={m.k} className="l10-label-row">
                <i>{m.k}</i>
                <b>{m.v}</b>
              </span>
            ))}
            <span className="l10-label-foot">{methodFacts.thesis}</span>
          </Link>
        </div>

        {/* ── control side ─────────────────────────────── */}
        <div className="l10-controls">
          <div className="l10-display" aria-live="polite">
            {display}
          </div>

          <div className="l10-keypad">
            {["A", "B", "1", "2", "3", "4", "CLR"].map((k) => (
              <button key={k} className="l10-key" onClick={() => press(k)}>
                {k}
              </button>
            ))}
          </div>

          <button className="l10-coinslot" onClick={coin} aria-label="Coin slot">
            <span className="l10-slot-cut" aria-hidden />
            COIN RETURN
          </button>

          <div className="l10-reader">
            <p>CARD READER</p>
            <p className="l10-reader-x">DISABLED BY POLICY</p>
            <p className="l10-reader-note">the model never holds the card</p>
          </div>

          <p className="l10-sticker">
            ★ DOES EVERYTHING EXCEPT SPEND YOUR MONEY — THAT&#39;S THE FEATURE
          </p>
        </div>

        {/* ── tray ─────────────────────────────────────── */}
        <div className={`l10-tray ${vended ? "is-full" : ""}`}>
          {vended ? (
            <div
              className="l10-dispensed"
              style={{ "--c": vended.accent } as React.CSSProperties}
            >
              <p className="l10-d-tag">
                {vended.code} · N°{vended.no} · {vended.kind} · {vended.status}
              </p>
              <p className="l10-d-title">{vended.title}</p>
              <p className="l10-d-line">{vended.line}</p>
              <div className="l10-d-row">
                <Link href={vended.href} className="l10-d-open">
                  TAKE IT →
                </Link>
                <button
                  className="l10-d-again"
                  onClick={() => {
                    setVended(null);
                    setPhase("idle");
                    setDisplay("READY — PUNCH A CODE");
                  }}
                >
                  LEAVE IT, PICK ANOTHER
                </button>
              </div>
            </div>
          ) : (
            <p className="l10-tray-hint">PUSH ▾ — THE TRAY IS EMPTY</p>
          )}
        </div>
      </div>

      <footer className="l10-curb">
        <Link href="/projects">FULL SHELF — PROJECTS</Link>
        <Link href="/writing">ZINE RACK — WRITING</Link>
        <Link href="/about">THE STOCKIST — ABOUT</Link>
        <Link href="/" className="l10-walk">
          WALK HOME →
        </Link>
      </footer>
    </div>
  );
}
