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
 * staged checkout — and the place where it stops dead, by design.
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
  filler?: boolean;
}

const PANTRY: Item[] = [
  { name: "eggs", qty: 3, unit: "eggs", rate: 1.0, price: 4.29 },
  { name: "whole milk", qty: 0.5, unit: "gal", rate: 0.25, price: 3.89 },
  { name: "coffee", qty: 0.15, unit: "lb", rate: 0.06, price: 11.99 },
  { name: "rice", qty: 8, unit: "cups", rate: 0.4 },
  { name: "paper towels", qty: 6, unit: "rolls", rate: 0.5 },
  { name: "granola", qty: 2.5, unit: "cups", rate: 0.3, price: 5.49, filler: true },
];

const MUST_BUYS = PANTRY.filter((i) => !i.filler && isLow(i.qty, i.rate));
const CART = [...MUST_BUYS, ...PANTRY.filter((i) => i.filler)];
const CART_TOTAL = CART.reduce((s, i) => s + (i.price ?? 0), 0);

const PHASES: readonly ConsolePhase[] = [
  { id: "cron", label: "CRON", ms: 2000, who: "code",
    note: "a Temporal schedule fires GroceryRunWorkflow — trigger=schedule honors a 3-hour cooldown and stays silent when nothing's low" },
  { id: "predict", label: "PREDICT", ms: 2800, who: "code",
    note: "one line of arithmetic per item: days_left = qty ÷ rate, low at ≤ 3 days (2-day lead + 1-day buffer). the rate blends my declared habits with observed consumption, observed capped at 80%" },
  { id: "price", label: "PRICE", ms: 2400, who: "model",
    note: "playwright searches amazon for each low item; haiku picks the brand among the results — pennies of model per item" },
  { id: "cart", label: "CART", ms: 2400, who: "code",
    note: "assemble_run_cart keeps every must-buy and adds fillers until the $25 free-shipping bar — deterministic list math, no model" },
  { id: "brief", label: "BRIEF", ms: 2600, who: "model",
    note: "haiku writes the briefing in plain language; telegram shows ✅ / ❌ and the workflow parks in a durable 24-hour wait for the answer" },
  { id: "approve", label: "APPROVE", ms: 2000, who: "human",
    note: "a tap. nothing touches the real cart until a human says so" },
  { id: "stage", label: "STAGE", ms: 3000, who: "code",
    note: "clear the real cart first — then add each approved item by ASIN, confirmed against the cart-mutation response. the checkout page is never visited" },
  { id: "handoff", label: "HANDOFF", ms: 3000, who: "human",
    note: "“nothing's been bought yet” — the cart opens in your own amazon app; you place the order. checkout_verified is hardcoded False, so auto-buy structurally cannot arm" },
  { id: "restock", label: "RESTOCK", ms: 2800, who: "code",
    note: "a 72-hour confirm window, items marked in-transit with an ETA, a durable sleep until arrival — then the pantry tops itself back up" },
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

export default function PantryConsole({ title }: { title?: string }) {
  const playback = usePlayback(PHASES);
  const { at, past } = playback;

  const gateRows: [string, string, boolean][] = [
    ["flags_enabled", "auto_buy_enabled=False · money_live=False", false],
    ["predictor_precision", "≥ 0.70 floor", true],
    ["scraper_green", "selector health", true],
    ["cost_under_ceiling", "≤ $0.50 / run", true],
  ];

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
          model has no say — code or a human decides ·{" "}
          <span className="text-ember">ember</span> = where spending would
          start, and doesn&apos;t
        </>
      }
      footnote={
        <>
          The arithmetic is real and running: days_left = qty ÷ rate with the
          repo&apos;s 2-day lead + 1-day buffer executes on this pantry in your
          browser. The cron spec, activity sequence, durable waits, message
          templates and the hardcoded checkout_verified=False hard stop are
          quoted from the code. The pantry contents and prices are
          representative.
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
              const d = daysLeft(item.qty, item.rate);
              const low = isLow(item.qty, item.rate);
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
                    </span>
                    <span className="text-dim">
                      {item.qty} {item.unit} ÷ {item.rate}/d ={" "}
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
          <p className="mt-2 font-mono text-[0.6rem] tracking-[0.1em] text-dim uppercase">
            | = the 3-day line — lead 2 d + buffer 1 d
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

      {/* the automation lane + the hard stop */}
      <div className="grid border-t border-line md:grid-cols-2">
        <div
          className="border-b border-line p-4 md:border-r md:border-b-0 md:p-5"
          style={fade(past("stage"))}
        >
          <p className="mb-2 font-mono text-label tracking-[0.2em] text-dim uppercase">
            playwright — the staged checkout
          </p>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5 font-mono text-[0.68rem]">
            {[
              "clear_cart()",
              ...CART.map((i) => `/dp/{${i.name.split(" ")[0]}-asin}`),
              "cart badge +4",
              "→ gp/cart/view.html",
            ].map((s, i) => (
              <span
                key={s}
                className="border border-line bg-void/40 px-1.5 py-0.5 text-ash transition-all duration-500"
                style={{
                  ...fade(past("stage")),
                  transitionDelay: at("stage") ? `${i * 220}ms` : "0ms",
                }}
              >
                {s}
              </span>
            ))}
            <span
              className="border border-ember/60 px-1.5 py-0.5 text-ember line-through decoration-2"
              style={fade(past("handoff"))}
            >
              /gp/buy/spc — place order
            </span>
            <span className="text-dim" style={fade(past("handoff"))}>
              ← never visited
            </span>
          </div>
        </div>

        {/* the money gate — outlined: the model has no say here */}
        <div className="p-4 md:p-5" style={fade(past("handoff"))}>
          <div className="border border-(--accent) p-3">
            <p className="mb-2 flex items-baseline justify-between font-mono text-label tracking-[0.2em] uppercase">
              <span className="text-(--accent)">money_live_ready — deterministic</span>
              <span className="text-ember">blocked</span>
            </p>
            <div className="space-y-1 font-mono text-[0.68rem]">
              {gateRows.map(([k, d, ok]) => (
                <div key={k} className="flex items-baseline justify-between gap-3">
                  <span className="text-ash">{k}</span>
                  <span className={ok ? "text-dim" : "text-ember"}>
                    {ok ? "✓" : "✗"} {d}
                  </span>
                </div>
              ))}
              <div className="flex items-baseline justify-between gap-3 border-t border-line/60 pt-1">
                <span className="text-bone">checkout_verified</span>
                <span className="text-ember">✗ hardcoded False — hard stop</span>
              </div>
            </div>
            <p className="mt-2 font-mono text-[0.65rem] leading-relaxed text-dim">
              every auto-buy path must pass this gate; the last condition
              cannot pass. it does everything except spend your money —
              that&apos;s the feature.
            </p>
          </div>
        </div>
      </div>
    </ConsoleShell>
  );
}
