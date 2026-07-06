"use client";

import {
  ConsoleShell,
  fade,
  usePlayback,
  type ConsolePhase,
} from "./console/harness";

/**
 * ────────────────────────────────────────────────────────────────────
 * PANTRY CONSOLE — one replenishment run, end to end.
 *
 * The online-shopping experience with the automation made visible:
 * the cron tick, the one-line prediction, Playwright pricing, the
 * cart assembling toward free shipping, the Telegram briefing, the
 * staged cart — and the handoff to your phone, where the only
 * checkout lives.
 *
 * The RULES are the repo's, verbatim: the prediction arithmetic
 * (days_left = qty ÷ rate, low at ≤ lead + buffer) runs right here on
 * the pantry shown; the cron spec, activity names, durable waits,
 * message templates and the hardcoded checkout_verified=False hard
 * stop are quoted from the code. The pantry and prices are
 * representative.
 * ────────────────────────────────────────────────────────────────────
 */

/* ── the real rules, ported 1:1 from the repo ─────────────────────── */

// src/grocery_buddy/predictor.py — days_left() and is_low(), verbatim:
// low when qty/rate ≤ lead_time_days (2.0) + buffer_days (1.0)
const LEAD_DAYS = 2.0;
const BUFFER_DAYS = 1.0;
const daysLeft = (qty: number, rate: number) =>
  rate <= 0 ? Infinity : qty / rate;
const isLow = (qty: number, rate: number) =>
  daysLeft(qty, rate) <= LEAD_DAYS + BUFFER_DAYS;

// activities.py — assemble_run_cart fills toward the free-shipping bar
const FREE_SHIPPING_USD = 25;

/* ── the representative pantry ────────────────────────────────────── */

interface Item {
  name: string;
  qty: number;
  unit: string;
  rate: number; // effective daily rate (declared ⊕ observed)
  price?: number; // staged price, must-buys + filler only
  refill?: number; // what the order adds when it lands
  filler?: boolean;
}

const PANTRY: Item[] = [
  { name: "eggs", qty: 3, unit: "eggs", rate: 1.0, price: 4.29, refill: 12 },
  { name: "whole milk", qty: 0.5, unit: "gal", rate: 0.25, price: 3.89, refill: 1 },
  { name: "coffee", qty: 0.15, unit: "lb", rate: 0.06, price: 11.99, refill: 0.75 },
  { name: "rice", qty: 8, unit: "cups", rate: 0.4 },
  { name: "paper towels", qty: 6, unit: "rolls", rate: 0.5 },
  { name: "granola", qty: 2.5, unit: "cups", rate: 0.3, price: 5.49, filler: true },
];

const MUST_BUYS = PANTRY.filter((i) => !i.filler && isLow(i.qty, i.rate));
const CART = [...MUST_BUYS, ...PANTRY.filter((i) => i.filler)];
const CART_TOTAL = CART.reduce((s, i) => s + (i.price ?? 0), 0);

const PHASES: readonly ConsolePhase[] = [
  { id: "cron", label: "CRON", ms: 3000, who: "code",
    note: "a Temporal schedule fires GroceryRunWorkflow — trigger=schedule honors a 3-hour cooldown and stays silent when nothing's low" },
  { id: "predict", label: "PREDICT", ms: 4400, who: "code",
    note: "one line of arithmetic per item: days_left = qty ÷ rate, low at ≤ 3 days (2-day lead + 1-day buffer). the rate blends my declared habits with observed consumption, observed capped at 80%" },
  { id: "price", label: "PRICE", ms: 3800, who: "model",
    note: "playwright searches amazon for each low item; haiku picks the brand among the results — pennies of model per item" },
  { id: "cart", label: "CART", ms: 3800, who: "code",
    note: "assemble_run_cart keeps every must-buy and adds fillers until the $25 free-shipping bar — deterministic list math, no model" },
  { id: "brief", label: "BRIEF", ms: 4200, who: "model",
    note: "haiku writes the briefing in plain language; telegram shows ✅ / ❌ and the workflow parks in a durable 24-hour wait for the answer" },
  { id: "approve", label: "APPROVE", ms: 3200, who: "human",
    note: "a tap. nothing touches the real cart until a human says so" },
  { id: "stage", label: "STAGE", ms: 5000, who: "code",
    note: "clear the real cart first — then add each approved item by ASIN, confirmed against the cart-mutation response. the checkout page is never visited" },
  { id: "handoff", label: "HANDOFF", ms: 4600, who: "human",
    note: "“nothing's been bought yet” — the cart opens in your own amazon app; you place the order. checkout_verified is hardcoded False, so auto-buy structurally cannot arm" },
  { id: "restock", label: "RESTOCK", ms: 4200, who: "code",
    note: "a 72-hour confirm window, items marked in-transit with an ETA, a durable sleep until arrival — then the pantry tops itself back up" },
  { id: "steady", label: "STEADY", ms: 4000, who: "code",
    note: "the loop closes — the bars are full again, and tomorrow at 13:00 utc it looks again, silent unless something's low" },
];

// scale a days-left value onto the bar (14-day window)
const barPct = (d: number) => Math.min(d / 14, 1) * 100;
const THRESH_PCT = barPct(LEAD_DAYS + BUFFER_DAYS);

function Bubble({
  from,
  on,
  children,
}: {
  from: "bot" | "user";
  on: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`max-w-[92%] border px-3 py-2 font-mono text-[0.7rem] leading-relaxed ${
        from === "bot"
          ? "self-start border-line bg-void/40 text-ash"
          : "self-end border-(--accent)/60 bg-(--accent)/10 text-bone"
      }`}
      style={fade(on)}
    >
      {children}
    </div>
  );
}

// the road already written into the repo — schema columns, event tables,
// and the cross-project authority design (see NextUp in the entry)
const ROADMAP: [string, string][] = [
  ["today", "predicts, prices, stages — you tap Place order. running my household since jun 2026"],
  ["budget envelopes", "monthly_budget_usd is already in the schema; carts warn before they spend it"],
  ["learned rates", "consumption learned from confirmed orders — the cadence sits in the events table"],
  ["delivery tracking", "gmail arrival dates land restocks on the real day; the “did you order it?” tap disappears"],
  ["tiered auto-buy", "procurement agent's authority design, reimplemented locally — cheap staples self-approve, novel or expensive stays human"],
];

export default function PantryConsole({ title }: { title?: string }) {
  const playback = usePlayback(PHASES);
  const { at, past, reduced } = playback;

  return (
    <ConsoleShell
      title={title ?? "One run, while you sleep"}
      ariaLabel="Animated playback of one grocery replenishment run"
      phases={PHASES}
      playback={playback}
      legend={
        <>
          <span className="text-(--accent)">green</span> = operating ·{" "}
          <span className="border border-(--accent) px-1">outline</span> = the
          model has no say — code or a human decides
        </>
      }
      footnote={
        <>
          The arithmetic is real and running: days_left = qty ÷ rate with the
          repo&apos;s 2-day lead + 1-day buffer executes on this pantry in your
          browser. The cron spec, activity sequence, durable waits, message
          templates and the hardcoded checkout_verified=False hard stop are
          quoted from the code; the roadmap is the repo&apos;s own — the
          monthly_budget_usd column already exists. The pantry contents,
          prices and the staging scene are representative.
        </>
      }
    >
      {/* cron strip — the run's trigger */}
      <div
        className="border-b border-line px-4 py-3 font-mono text-mono-sm md:px-5"
        style={fade(past("cron"))}
      >
        <span className="text-dim">schedule </span>
        <span className="text-bone">&quot;0 13 * * *&quot;</span>
        <span className="text-dim"> utc → </span>
        <span className="text-(--accent)">GroceryRunWorkflow</span>
        <span className="text-dim"> · trigger=schedule · cooldown 3 h</span>
      </div>

      {/* pantry + chat, side by side */}
      <div className="grid md:grid-cols-2">
        {/* the pantry — prediction made visible */}
        <div className="border-b border-line p-4 md:border-r md:border-b-0 md:p-5">
          <p className="mb-3 font-mono text-label tracking-[0.2em] text-dim uppercase">
            pantry — days_left = qty ÷ rate
          </p>
          <div className="space-y-2.5">
            {PANTRY.filter((i) => !i.filler).map((item) => {
              // once the order lands, the delivered qty rejoins the math
              const landed = past("restock") && item.refill !== undefined;
              const qty = landed ? item.qty + item.refill! : item.qty;
              const d = daysLeft(qty, item.rate);
              const low = isLow(qty, item.rate);
              const flagged = low && past("predict");
              return (
                <div key={item.name} className="font-mono text-[0.7rem]">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className={flagged ? "text-bone" : "text-ash"}>
                      {item.name}
                      {flagged && (
                        <span className="ml-2 text-(--accent)">low</span>
                      )}
                      {flagged && past("cart") && item.price && (
                        <span className="text-dim"> → cart ${item.price.toFixed(2)}</span>
                      )}
                      {landed && (
                        <span className="ml-2 text-(--accent)">
                          +{item.refill} landed
                        </span>
                      )}
                    </span>
                    <span className="text-dim">
                      {qty} {item.unit} ÷ {item.rate}/d ={" "}
                      <span className={flagged ? "text-(--accent)" : ""}>
                        {d.toFixed(1)} d
                      </span>
                    </span>
                  </div>
                  {/* days-left bar with the 3-day threshold tick */}
                  <div className="relative mt-1 h-[5px] bg-void/60">
                    <div
                      className="h-full transition-all duration-1000 ease-(--ease-cine)"
                      style={{
                        width: `${barPct(d)}%`,
                        background: flagged
                          ? "var(--accent)"
                          : landed
                            ? "color-mix(in srgb, var(--accent) 55%, var(--color-line-loud))"
                            : "var(--color-line-loud)",
                      }}
                    />
                    <span
                      aria-hidden
                      className="absolute top-[-2px] bottom-[-2px] w-px bg-bone/40"
                      style={{ left: `${THRESH_PCT}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
          <p className="mt-2 flex items-baseline justify-between font-mono text-[0.6rem] tracking-[0.1em] text-dim uppercase">
            <span>| = the 3-day line — lead 2 d + buffer 1 d</span>
            <span
              className="flex items-center gap-1.5 normal-case tracking-normal"
              style={fade(past("steady"))}
            >
              <span className="relative flex h-1.5 w-1.5" aria-hidden>
                {past("steady") && !reduced && (
                  <span className="pc-ping absolute inline-flex h-full w-full rounded-full bg-(--accent) opacity-60" />
                )}
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-(--accent)" />
              </span>
              <span className="text-(--accent)">watching</span> · next tick 13:00 utc
            </span>
          </p>

          {/* the cart assembling toward free shipping */}
          <div className="mt-4 border-t border-line pt-3" style={fade(past("cart"))}>
            <div className="flex items-baseline justify-between font-mono text-[0.7rem]">
              <span className="text-dim uppercase tracking-[0.1em]">
                cart — {MUST_BUYS.length} must-buy + 1 filler
              </span>
              <span className="text-bone">
                ${CART_TOTAL.toFixed(2)}{" "}
                <span className="text-(--accent)">≥ ${FREE_SHIPPING_USD} ✓</span>
              </span>
            </div>
            <div className="relative mt-1.5 h-[5px] bg-void/60">
              <div
                className="h-full bg-(--accent) transition-all duration-1000 ease-(--ease-cine)"
                style={{ width: past("cart") ? `${Math.min(CART_TOTAL / 30, 1) * 100}%` : "0%" }}
              />
              <span
                aria-hidden
                className="absolute top-[-2px] bottom-[-2px] w-px bg-bone/40"
                style={{ left: `${(FREE_SHIPPING_USD / 30) * 100}%` }}
              />
            </div>
            <p className="mt-1.5 font-mono text-[0.65rem] text-dim" style={fade(past("price"))}>
              granola <span className="text-dim/70">(filler — rides along for free shipping)</span>{" "}
              $5.49
            </p>
          </div>
        </div>

        {/* the telegram side — what the human actually sees */}
        <div className="flex flex-col gap-2 p-4 md:p-5">
          <p className="mb-1 font-mono text-label tracking-[0.2em] text-dim uppercase">
            telegram
          </p>
          <Bubble from="bot" on={past("brief")}>
            Looking at your pantry, I&apos;d grab:
            <br />
            {MUST_BUYS.map((i) => (
              <span key={i.name}>
                • {i.name}
                <br />
              </span>
            ))}
            Cart total: ${CART_TOTAL.toFixed(2)}
            <div className="mt-2 flex gap-2">
              <span
                className={`border px-2 py-0.5 transition-colors duration-500 ${
                  past("approve")
                    ? "border-(--accent) text-(--accent)"
                    : "border-line-loud text-ash"
                }`}
              >
                ✅ Looks good
              </span>
              <span className="border border-line-loud px-2 py-0.5 text-dim">
                ❌ Skip
              </span>
            </div>
          </Bubble>
          <p
            className="self-center font-mono text-[0.6rem] tracking-[0.12em] text-dim uppercase"
            style={fade(past("brief") && !past("approve"))}
          >
            — durable wait · up to 24 h —
          </p>
          <Bubble from="bot" on={past("handoff")}>
            🛒 <span className="text-bone">Your cart&apos;s ready — ${CART_TOTAL.toFixed(2)}</span>
            <br />
            <span className="text-bone">Nothing&apos;s been bought yet</span> — tap{" "}
            <span className="text-bone">Open my Amazon cart</span> and finish
            checkout.
            <div className="mt-2 flex flex-wrap gap-2">
              <span className="border border-(--accent) px-2 py-0.5 text-(--accent)">
                🧾 Open my Amazon cart
              </span>
              <span className="border border-line-loud px-2 py-0.5 text-ash">
                ✅ I placed the order
              </span>
            </div>
          </Bubble>
          <Bubble from="user" on={past("restock")}>ordered</Bubble>
          <Bubble from="bot" on={past("restock")}>
            📦 in-transit → eta set → pantry topped up on arrival
          </Bubble>
        </div>
      </div>

      {/* the staging scene + where this goes next */}
      <div className="grid border-t border-line md:grid-cols-2">
        {/* playwright, drawn — items land in the cart; the cart hands
            off to your phone */}
        <div
          className="border-b border-line p-4 md:border-r md:border-b-0 md:p-5"
          style={fade(past("stage"))}
        >
          <p className="mb-1 font-mono text-label tracking-[0.2em] text-dim uppercase">
            staging — the real cart, item by item
          </p>
          <svg viewBox="0 0 340 170" className="block w-full" aria-hidden>
            {/* manifest — each approved item, confirmed as it lands */}
            {CART.map((item, i) => {
              const y = 26 + i * 32;
              // where this item's parcel settles inside the basket
              const tx = [150, 165, 180, 158][i] ?? 160;
              const ty = [92, 86, 92, 76][i] ?? 88;
              const landed = past("stage");
              return (
                <g key={item.name} fontFamily="var(--font-mono)">
                  <text x={8} y={y} fontSize="9" fill="var(--color-ash)">
                    {item.name}
                  </text>
                  <text
                    x={8}
                    y={y + 11}
                    fontSize="7"
                    fill="var(--color-dim)"
                    style={{
                      ...fade(landed),
                      transitionDelay: at("stage") ? `${i * 500 + 700}ms` : "0ms",
                    }}
                  >
                    ✓ added by ASIN · confirmed
                  </text>
                  {/* the parcel, flying into the basket */}
                  <rect
                    width={9}
                    height={9}
                    x={86}
                    y={y - 8}
                    fill="color-mix(in srgb, var(--accent) 35%, transparent)"
                    stroke="var(--accent)"
                    strokeWidth="1"
                    style={{
                      transform: landed
                        ? `translate(${tx - 86}px, ${ty - (y - 8)}px)`
                        : "translate(0px, 0px)",
                      transition: `transform 900ms var(--ease-cine) ${landed && at("stage") ? i * 500 : 0}ms`,
                    }}
                  />
                </g>
              );
            })}

            {/* the cart */}
            <g stroke="var(--accent)" strokeWidth="1.3" fill="none">
              <path d="M 132 58 h 10 l 9 44 h 52 l 11 -32 H 156" />
              <circle cx={158} cy={112} r={4.5} />
              <circle cx={192} cy={112} r={4.5} />
            </g>
            <text
              x={170}
              y={154}
              fontSize="7"
              fontFamily="var(--font-mono)"
              fill="var(--color-dim)"
              textAnchor="middle"
              style={fade(past("stage"))}
            >
              clear_cart() ran first
            </text>
            {/* badge — the count playwright reads back off the page */}
            <g
              style={{
                ...fade(past("stage")),
                transitionDelay: at("stage") ? "2400ms" : "0ms",
              }}
            >
              <circle cx={212} cy={52} r={9} fill="var(--color-void)" stroke="var(--accent)" strokeWidth="1.2" />
              <text x={212} y={55.5} fontSize="9" fontFamily="var(--font-mono)" fill="var(--accent)" textAnchor="middle">
                {CART.length}
              </text>
            </g>

            {/* the handoff: the staged cart travels to your phone — the
                same items, the same total, your tap */}
            <g style={fade(past("handoff"))} fontFamily="var(--font-mono)">
              <path
                d="M 224 92 C 254 92 256 116 284 116"
                stroke="var(--accent)"
                strokeWidth="1.3"
                fill="none"
              />
              <path d="M 288 116 l -7 -4 v 8 z" fill="var(--accent)" />
              {/* your phone — the cart again, ready for one tap */}
              <rect x={292} y={84} width={34} height={66} rx={6} fill="var(--color-void)" stroke="var(--accent)" strokeWidth="1.3" />
              <text x={309} y={100} fontSize="7" fill="var(--color-ash)" textAnchor="middle">
                cart · {CART.length}
              </text>
              <text x={309} y={111} fontSize="7.5" fill="var(--color-bone)" textAnchor="middle">
                ${CART_TOTAL.toFixed(2)}
              </text>
              {/* outline only — this button is the one thing the system
                  structurally cannot press */}
              <rect x={297} y={119} width={24} height={10} fill="none" stroke="var(--accent)" strokeWidth="0.8" />
              <text x={309} y={126} fontSize="5.5" fill="var(--accent)" textAnchor="middle">
                place order
              </text>
              <line x1={303} y1={143} x2={315} y2={143} stroke="var(--accent)" strokeWidth="1.2" />
              <text x={309} y={163} fontSize="6.5" fill="var(--accent)" textAnchor="middle">
                your phone
              </text>
            </g>
          </svg>
          <p className="mt-1 font-mono text-[0.6rem] tracking-[0.1em] text-dim uppercase">
            the cart fills itself · checkout is{" "}
            <span className="text-ash">your phone, your tap, your card</span>
          </p>
        </div>

        {/* the road ahead — what the repo is already reaching for */}
        <div className="p-4 md:p-5" style={fade(past("handoff"))}>
          <div className="flex h-full flex-col border border-line-loud p-3">
            <p className="mb-2.5 flex items-baseline justify-between font-mono text-label tracking-[0.2em] uppercase">
              <span className="text-bone">where this goes next</span>
              <span className="text-(--accent)">v1.0 — live</span>
            </p>
            <div className="relative space-y-2.5 font-mono text-[0.66rem] leading-relaxed">
              <span
                aria-hidden
                className="absolute top-2 bottom-2 left-[3px] w-px bg-line-loud"
              />
              {ROADMAP.map(([k, d], i) => (
                <div
                  key={k}
                  className="relative flex gap-2.5"
                  style={{
                    ...fade(past("handoff")),
                    transitionDelay: at("handoff") ? `${i * 320}ms` : "0ms",
                  }}
                >
                  <span className="relative mt-[3px] flex h-[7px] w-[7px] shrink-0">
                    {i === 0 ? (
                      <>
                        {past("handoff") && !reduced && (
                          <span className="pc-ping absolute inline-flex h-full w-full rounded-full bg-(--accent) opacity-60" />
                        )}
                        <span className="relative inline-flex h-full w-full rounded-full bg-(--accent)" />
                      </>
                    ) : (
                      <span className="h-full w-full rounded-full border border-line-loud bg-void" />
                    )}
                  </span>
                  <p className="text-ash">
                    <span className={i === 0 ? "text-(--accent)" : "text-bone"}>
                      {k}
                    </span>{" "}
                    <span className="text-dim">— {d}</span>
                  </p>
                </div>
              ))}
            </div>
            <p className="mt-auto pt-2.5 font-mono text-[0.62rem] leading-relaxed text-dim">
              every rung still ends at a human tap until the five-condition
              money-live gate — precision ≥ 0.70, cost ceiling, scraper green —
              says otherwise. autonomy is earned with evals, not vibes.
            </p>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes pc-ping-k {
          0% { scale: 1; opacity: 0.6; }
          80%, 100% { scale: 2.6; opacity: 0; }
        }
        .pc-ping { animation: pc-ping-k 1.8s cubic-bezier(0, 0, 0.2, 1) infinite; }
        @media (prefers-reduced-motion: reduce) {
          .pc-ping { animation: none; }
        }
      `}</style>
    </ConsoleShell>
  );
}
