import type { InspectMap } from "./types";

/**
 * The artifact behind each component of ~/dev/grocery-buddy, distilled
 * into designed blocks — flows, rules, schema maps. Every name, number,
 * threshold and quote is as coded in the repo; nothing illustrative.
 */
export const GROCERY_BUDDY: InspectMap = {
  wh: {
    path: "src/grocery_buddy/webhook.py",
    note: "every message walks this ladder before any model is asked",
    blocks: [
      {
        kind: "flow",
        title: "The top-level decision tree",
        caption: "outlined = deterministic check — code decides, not a model",
        states: [
          { id: "upd", label: "telegram update", col: 0, row: 0 },
          { id: "c1", label: "/import command?", col: 0, row: 1, kind: "gate" },
          { id: "h1", label: "import pantry", col: 1, row: 1, kind: "terminal" },
          { id: "c2", label: "amazon_2fa mode?", col: 0, row: 2, kind: "gate" },
          { id: "h2", label: "2fa relay", col: 1, row: 2, kind: "terminal" },
          { id: "c3", label: "onboarding mode?", col: 0, row: 3, kind: "gate" },
          { id: "h3", label: "interview turn", col: 1, row: 3, kind: "terminal" },
          { id: "c4", label: "first contact?", col: 0, row: 4, kind: "gate" },
          { id: "h4", label: "start interview", col: 1, row: 4, kind: "terminal" },
          { id: "c5", label: "cart pending?", col: 0, row: 5, kind: "gate" },
          { id: "h5", label: "briefing reply", col: 1, row: 5, kind: "terminal" },
          { id: "h6", label: "fresh request", col: 0, row: 6, kind: "terminal" },
        ],
        transitions: [
          { from: "upd", to: "c1" },
          { from: "c1", to: "h1", label: "yes" },
          { from: "c1", to: "c2", label: "no" },
          { from: "c2", to: "h2", label: "reply is the code" },
          { from: "c2", to: "c3", label: "no" },
          { from: "c3", to: "h3", label: "yes" },
          { from: "c3", to: "c4", label: "no" },
          { from: "c4", to: "h4", label: "yes" },
          { from: "c4", to: "c5", label: "no" },
          { from: "c5", to: "h5", label: "yes" },
          { from: "c5", to: "h6", label: "no → intent parser" },
        ],
      },
      {
        kind: "note",
        text: "Slash commands, conversation modes and pending carts are all resolved from Postgres rows before a model sees anything. Only the last branch — a returning user with no cart pending — reaches the Haiku intent parser.",
      },
    ],
  },

  intent: {
    path: "src/grocery_buddy/agents/assistant.py",
    note: "one of six haiku call-sites — free text becomes a tool call, never a guess",
    blocks: [
      {
        kind: "rules",
        title: "The four routes the prompt allows",
        items: [
          {
            name: "request_purchase",
            detail:
              "They named item(s) to buy — “milk”, “we need paper towels”. A bare noun = qty 1; just buy it, don't ask how much.",
          },
          {
            name: "restock_low_items",
            detail:
              "They want to restock EVERYTHING low without naming items — “buy all items running low”, “do a grocery run”. The pantry snapshot is in the prompt; the model never says it can't see inventory.",
          },
          {
            name: "update_pantry_quantity",
            detail:
              "They're telling you how much they CURRENTLY have, not buying — “we still have plenty of eggs”, “the kids finished the bread”. Corrects the estimate; buys nothing.",
          },
          {
            name: "just reply",
            detail:
              "Pantry questions (“what am I low on?”) answered from the snapshot. Small talk stays chat.",
          },
        ],
      },
      {
        kind: "quote",
        text: "If it's small talk or the intent is unclear, chat — don't trigger a purchase or a run on a guess.",
        cite: "the system prompt, verbatim",
      },
      {
        kind: "kv",
        items: [
          { k: "model", v: "haiku (model_fast)" },
          { k: "max_tokens", v: "512" },
          { k: "tools", v: "_FRESH_TOOLS" },
          { k: "usage label", v: "parse_request" },
        ],
      },
    ],
  },

  relay: {
    path: "src/grocery_buddy/tools/auth.py",
    note: "two processes, one db table as the channel — the code is read exactly once",
    blocks: [
      {
        kind: "flow",
        title: "The 2FA mailbox",
        caption: "outlined = a human holds the secret, not the model",
        states: [
          { id: "otp", label: "amazon asks otp", col: 0, row: 0 },
          { id: "open", label: "challenge: pending", col: 1, row: 0 },
          { id: "ask", label: "telegram asks me", col: 2, row: 0, kind: "gate" },
          { id: "ans", label: "challenge: answered", col: 2, row: 1 },
          { id: "wr", label: "webhook writes code", col: 1, row: 1 },
          { id: "done", label: "consumed → login", col: 0, row: 1, kind: "terminal" },
        ],
        transitions: [
          { from: "otp", to: "open", label: "worker opens row" },
          { from: "open", to: "ask" },
          { from: "ask", to: "ans", label: "i reply the code" },
          { from: "ans", to: "wr" },
          { from: "wr", to: "done", label: "worker polls · read-once" },
        ],
      },
      {
        kind: "note",
        text: "The worker activity holds the browser open on the OTP page but can't read my authenticator — so it opens a challenge row and asks over Telegram. The webhook writes my reply back to the same row; the worker polls until it appears.",
      },
      {
        kind: "rules",
        items: [
          {
            name: "read exactly once",
            detail:
              "UPDATE … SET status='consumed' WHERE status='answered' RETURNING code — the flip is atomic, so a code can never be replayed.",
          },
          {
            name: "one table, two processes",
            detail:
              "amazon_auth_challenges is the whole channel: webhook (user → DB) and worker activity (DB → Amazon).",
          },
        ],
      },
    ],
  },

  tmp: {
    path: "src/grocery_buddy/workflows/",
    note: "the three durable workflows — temporal owns time, retries, and the money path",
    blocks: [
      {
        kind: "flow",
        title: "GroceryRunWorkflow — friday 05:00, or on demand",
        caption: "grocery_run.py · outlined = code or a human decides",
        states: [
          { id: "trig", label: "schedule · signal", col: 0, row: 0 },
          { id: "guard", label: "run guardrails", col: 1, row: 0, kind: "gate" },
          { id: "skip", label: "skipped", col: 1, row: 1, kind: "terminal" },
          { id: "pantry", label: "pantry math", col: 2, row: 0 },
          { id: "cart", label: "price + assemble", col: 3, row: 0 },
          { id: "brief", label: "briefing → telegram", col: 3, row: 1 },
          { id: "wait", label: "approval · 24h", col: 2, row: 1, kind: "gate" },
          { id: "stage", label: "stage + link", col: 2, row: 2 },
          { id: "conf", label: "human confirms", col: 1, row: 2, kind: "gate" },
          { id: "done", label: "pantry in-transit", col: 0, row: 2, kind: "terminal" },
          { id: "out", label: "expired · rejected", col: 3, row: 2, kind: "terminal" },
        ],
        transitions: [
          { from: "trig", to: "guard" },
          { from: "guard", to: "skip", label: "pending cart · cooldown", dashed: true },
          { from: "guard", to: "pantry", label: "clear" },
          { from: "pantry", to: "cart", label: "low items" },
          { from: "cart", to: "brief" },
          { from: "brief", to: "wait" },
          { from: "wait", to: "stage", label: "approve" },
          { from: "wait", to: "out", label: "timeout · reject", dashed: true },
          { from: "stage", to: "conf", label: "checkout link" },
          { from: "conf", to: "done", label: "“i placed the order”" },
        ],
      },
      {
        kind: "flow",
        title: "QuickBuyWorkflow — “buy milk”",
        caption: "quick_buy.py · the same approval gate, at 6h",
        states: [
          { id: "req", label: "named item(s)", col: 0, row: 0 },
          { id: "price", label: "price lookup", col: 1, row: 0 },
          { id: "brief", label: "briefing", col: 2, row: 0 },
          { id: "wait", label: "approval · 6h", col: 3, row: 0, kind: "gate" },
          { id: "stage", label: "stage + link", col: 3, row: 1, kind: "terminal" },
          { id: "out", label: "expired · rejected", col: 2, row: 1, kind: "terminal" },
        ],
        transitions: [
          { from: "req", to: "price" },
          { from: "price", to: "brief" },
          { from: "brief", to: "wait" },
          { from: "wait", to: "stage", label: "approve" },
          { from: "wait", to: "out", label: "timeout · reject", dashed: true },
        ],
      },
      {
        kind: "flow",
        title: "Import workflow — /import",
        caption: "two years of orders → a confirmed pantry",
        states: [
          { id: "scrape", label: "scrape orders", col: 0, row: 0 },
          { id: "agg", label: "aggregate", col: 1, row: 0 },
          { id: "syn", label: "sonnet synthesis", col: 2, row: 0 },
          { id: "rev", label: "i edit in chat", col: 3, row: 0, kind: "gate" },
          { id: "wr", label: "pantry written", col: 3, row: 1, kind: "terminal" },
        ],
        transitions: [
          { from: "scrape", to: "agg", label: "playwright" },
          { from: "agg", to: "syn", label: "pure python" },
          { from: "syn", to: "rev", label: "staged proposal" },
          { from: "rev", to: "wr", label: "only on confirm" },
        ],
      },
      {
        kind: "note",
        text: "Why Temporal at all: every step above survives a crash. Workflows are replayed from history — which is exactly why they must stay pure, and why all twenty side-effecting steps live in activities.",
      },
    ],
  },

  act: {
    path: "src/grocery_buddy/workflows/activities.py",
    note: "what “Activities ×20” means: every side-effect lives here so workflows can replay",
    blocks: [
      {
        kind: "note",
        text: "A Temporal activity is one retryable unit of real-world work. The workflow that calls it must stay pure — no I/O, no clocks, no randomness — so Temporal can kill it, replay its history after a crash, and land in exactly the same state. Everything that touches the world gets pushed down into an activity.",
      },
      {
        kind: "quote",
        text: "Temporal activities — all I/O and side-effects live here (workflows stay pure).",
        cite: "activities.py, line one",
      },
      {
        kind: "steps",
        title: "The eleven a scheduled grocery run calls, in order",
        items: [
          { name: "reconcile_arrivals", tag: "io", detail: "landed orders top the pantry up" },
          { name: "apply_estimated_depletion", tag: "io", detail: "the consumption model ticks on-hand down" },
          { name: "predict_low_items", tag: "gate", detail: "rule-based predictor — no model in the loop" },
          { name: "select_run_candidates", tag: "io", detail: "must-buys + fillers to clear free shipping" },
          { name: "lookup_amazon_prices", tag: "io", detail: "live Playwright search, deterministic selectors" },
          { name: "assemble_run_cart", tag: "io", detail: "totals the cart, trims fillers at the threshold" },
          { name: "build_draft_cart", tag: "model", detail: "haiku composes the briefing copy" },
          { name: "send_approval_notification", tag: "human", detail: "telegram briefing — approve · adjust · reject" },
          { name: "prepare_checkout", tag: "io", detail: "clears the Amazon cart, stages by ASIN" },
          { name: "send_checkout_link", tag: "human", detail: "“nothing's been bought yet” — I place the order" },
          { name: "run_evals", tag: "io", detail: "precision / recall snapshot + cost ledger sum" },
        ],
      },
      {
        kind: "note",
        text: "The other nine cover the import pipeline, onboarding, the Amazon re-login state machine and the health probe. Each activity wraps a pure function in I/O — predict_low_items_activity, for instance, only fetches inputs and calls the same predictor function the tests call.",
      },
    ],
  },

  pred: {
    path: "src/grocery_buddy/predictor.py",
    note: "the actual rules — one line of arithmetic, no model near it",
    blocks: [
      {
        kind: "rules",
        title: "How an item gets flagged",
        items: [
          {
            name: "declared rate",
            value: "rate × household",
            detail:
              "base_rate = declared_rate × household_factor — the habit I described at onboarding, scaled to the household.",
          },
          {
            name: "observed rate",
            value: "30-day lookback",
            detail:
              "units actually consumed over the last 30 days ÷ 30 — measured from pantry events, not from what I claimed.",
          },
          {
            name: "the blend",
            value: "min(events ÷ 14, 0.8)",
            detail:
              "observed consumption earns trust as events accumulate — at 14+ events it carries 80% of the weight, never more. Declared habits always keep a 20% say.",
          },
          {
            name: "days left",
            value: "(qty + incoming) ÷ rate",
            detail:
              "on-the-way stock counts as covered — eggs already in a van don't get re-suggested. A rate of zero means infinite days; never flagged.",
          },
          {
            name: "the flag",
            value: "≤ lead + buffer",
            detail:
              "flagged when days_left ≤ lead_time_days (2.0) + buffer_days (1.0) — order when it'll run out before a delivery could land, plus a day of slack.",
          },
        ],
      },
      {
        kind: "kv",
        items: [
          { k: "lead time", v: "2.0 days" },
          { k: "buffer", v: "1.0 day" },
          { k: "lookback", v: "30 days" },
          { k: "max observed weight", v: "0.8" },
          { k: "models involved", v: "0", accent: true },
        ],
      },
      {
        kind: "note",
        text: "Deliberately boring math, debuggable in one line. The models never guess at arithmetic — and the predictor's precision is what the money-live gate measures.",
      },
    ],
  },

  synth: {
    path: "src/grocery_buddy/agents/order_history.py",
    note: "the only sonnet call on the happy path — forced tool_choice, streamed",
    blocks: [
      {
        kind: "steps",
        title: "Two years of orders → a clean pantry",
        items: [
          { name: "scrape order history", tag: "io", detail: "Playwright walks the Amazon order pages" },
          { name: "aggregate", tag: "io", detail: "pure Python folds repeat purchases into per-product history" },
          { name: "synthesize_grocery_history", tag: "model", detail: "Sonnet turns the pile into a proposed pantry — habits learned from every order, on-hand estimated honestly" },
          { name: "conversational review", tag: "human", detail: "I edit the staged proposal in chat" },
          { name: "confirm", tag: "gate", detail: "the live pantry is written only on explicit confirm" },
        ],
      },
      {
        kind: "kv",
        items: [
          { k: "model", v: "sonnet (model_smart)" },
          { k: "tool_choice", v: "forced · propose_pantry" },
          { k: "response", v: "streamed" },
          { k: "system prompt", v: "cached across retries" },
        ],
      },
      {
        kind: "note",
        text: "Returns an empty proposal instead of raising — any failure degrades to manual onboarding, never a crash. Streaming matters because a large proposal can run past the non-streaming request window.",
      },
    ],
  },

  amz: {
    path: "src/grocery_buddy/automation/amazon.py",
    note: "a persistent browser profile, because Amazon has no consumer API",
    blocks: [
      {
        kind: "rules",
        items: [
          {
            name: "persistent profile",
            detail:
              "launch_persistent_context on a saved user_data_dir — the signed-in session survives across runs and restarts; no re-login per run.",
          },
          {
            name: "visible when it matters",
            detail:
              "headless by default (AMAZON_HEADLESS), but the self-healing re-login forces a visible window when it needs a human to sign in by hand.",
          },
          {
            name: "no password manager",
            detail:
              "Chromium's password-manager prompts are disabled in the profile prefs — a popup mid-form-fill is a silent failure mode.",
          },
          {
            name: "watchable",
            detail:
              "set AMAZON_HEADLESS=false and the log tells you so — every launch logs the profile path and mode.",
          },
        ],
      },
    ],
  },

  repair: {
    path: "src/grocery_buddy/automation/resilience.py",
    note: "the deterministic chain goes first; the llm is reached only on a total 0-match",
    blocks: [
      {
        kind: "flow",
        title: "Selector self-repair",
        caption: "dashed = the repair path — taken only when determinism comes up empty",
        states: [
          { id: "need", label: "selector intent", col: 0, row: 0 },
          { id: "chain", label: "deterministic chain", col: 1, row: 0, kind: "gate" },
          { id: "hit", label: "matched", col: 2, row: 0, kind: "terminal" },
          { id: "llm", label: "llm re-find", col: 1, row: 1 },
          { id: "verify", label: "still matches?", col: 2, row: 1, kind: "gate" },
          { id: "cache", label: "cache + return", col: 3, row: 1, kind: "terminal" },
          { id: "fail", label: "0 matches recorded", col: 1, row: 2, kind: "terminal" },
        ],
        transitions: [
          { from: "need", to: "chain" },
          { from: "chain", to: "hit", label: "match" },
          { from: "chain", to: "llm", label: "0-match", dashed: true },
          { from: "llm", to: "verify", label: "new descriptor" },
          { from: "verify", to: "cache", label: "confirmed" },
          { from: "verify", to: "fail", label: "dud", dashed: true },
          { from: "llm", to: "fail", label: "repair failed", dashed: true },
        ],
      },
      {
        kind: "rules",
        items: [
          {
            name: "verify before caching",
            detail:
              "a healed descriptor is persisted only after it's confirmed to still match — a dud can never poison the cache for the next run.",
          },
          {
            name: "everything recorded",
            detail:
              "every lookup records matched / repaired / critical, so selector drift shows up in telemetry before it becomes a broken run.",
          },
        ],
      },
    ],
  },

  db: {
    path: "migrations/001_initial.sql",
    note: "18 tables across 11 migrations — these six are the run path",
    blocks: [
      {
        kind: "schema",
        title: "How the run-path tables connect",
        caption:
          "6 of the 18 tables — the ones a grocery run reads and writes. Migrations 002–011 add carts, in-transit orders, and the rest.",
        tables: [
          {
            name: "users",
            note: "every table hangs off it · ON DELETE CASCADE",
            col: 1,
            row: 0,
            columns: [{ name: "id", type: "UUID", key: "pk" }],
          },
          {
            name: "inventory_items",
            note: "the pantry — UNIQUE (user_id, product)",
            col: 0,
            row: 1,
            columns: [
              { name: "id", type: "UUID", key: "pk" },
              { name: "user_id", type: "UUID", key: "fk", ref: "users" },
              { name: "product", type: "TEXT" },
              { name: "qty", type: "FLOAT" },
              { name: "unit", type: "TEXT" },
              { name: "par_level", type: "FLOAT" },
              { name: "updated_at", type: "TIMESTAMPTZ" },
            ],
          },
          {
            name: "consumption_profile",
            note: "declared habits — what feeds the predictor",
            col: 1,
            row: 1,
            columns: [
              { name: "id", type: "UUID", key: "pk" },
              { name: "user_id", type: "UUID", key: "fk", ref: "users" },
              { name: "product", type: "TEXT" },
              { name: "declared_rate", type: "FLOAT · units/day" },
              { name: "household_factor", type: "FLOAT" },
              { name: "notes", type: "TEXT" },
            ],
          },
          {
            name: "prediction_snapshots",
            note: "every prediction saved, so it can be graded later",
            col: 2,
            row: 1,
            columns: [
              { name: "user_id", type: "UUID", key: "fk", ref: "users" },
              { name: "predicted items", type: "graded → precision · recall" },
            ],
          },
          {
            name: "amazon_auth_challenges",
            note: "the 2FA mailbox between webhook and worker",
            col: 0,
            row: 2,
            columns: [
              { name: "id", type: "UUID", key: "pk" },
              { name: "status", type: "pending · answered · consumed" },
              { name: "code", type: "TEXT · read exactly once" },
            ],
          },
          {
            name: "llm_usage",
            note: "every model call priced — the cost ledger",
            col: 1,
            row: 2,
            columns: [
              { name: "model", type: "TEXT" },
              { name: "label", type: "TEXT · e.g. parse_request" },
              { name: "cost", type: "summed per run · alert > $1.00" },
            ],
          },
        ],
        relations: [
          { from: "inventory_items", to: "users", label: "user_id" },
          { from: "consumption_profile", to: "users", label: "user_id" },
          { from: "prediction_snapshots", to: "users", label: "user_id" },
          { from: "amazon_auth_challenges", to: "users", label: "user_id" },
          { from: "llm_usage", to: "users", label: "user_id" },
          {
            from: "inventory_items",
            to: "consumption_profile",
            label: "joined on (user_id, product)",
            dashed: true,
          },
        ],
      },
      {
        kind: "kv",
        items: [
          { k: "tables", v: "18" },
          { k: "migrations", v: "11" },
          { k: "in 001", v: "12 of 18" },
        ],
      },
    ],
  },

  evals: {
    path: "src/grocery_buddy/evals.py",
    note: "one grocery run in langfuse — the human approval is the longest span on purpose",
    trace: {
      title: "grocery_run · pantry → staged cart",
      subtitle:
        "activities as spans, model calls as generations, gates outlined — run_evals closes every run with scores",
      total: 232000,
      spans: [
        {
          name: "apply_estimated_depletion",
          type: "span",
          depth: 0,
          start: 0,
          dur: 300,
          detail: "consumption model ticks the pantry down",
        },
        {
          name: "predict_low_items",
          type: "gate",
          depth: 0,
          start: 400,
          dur: 80,
          detail: "rule-based predictor — no model in the loop",
        },
        {
          name: "lookup_amazon_prices",
          type: "span",
          depth: 0,
          start: 600,
          dur: 46000,
          detail: "playwright · live search · deterministic selector chain",
        },
        {
          name: "assemble_run_cart",
          type: "span",
          depth: 0,
          start: 46800,
          dur: 150,
        },
        {
          name: "build_draft_cart",
          type: "generation",
          depth: 0,
          start: 47100,
          dur: 1900,
          detail: "haiku 4.5 · itemized briefing copy",
        },
        {
          name: "send_approval_notification",
          type: "event",
          depth: 0,
          start: 49100,
          dur: 600,
          detail: "telegram briefing + approve / adjust / reject",
        },
        {
          name: "approval gate",
          type: "gate",
          depth: 0,
          start: 50000,
          dur: 141000,
          detail: "durable wait_condition · human approved · 24h timeout",
        },
        {
          name: "prepare_checkout",
          type: "span",
          depth: 0,
          start: 191500,
          dur: 38000,
          detail: "playwright stages the amazon cart",
        },
        {
          name: "send_checkout_link",
          type: "event",
          depth: 0,
          start: 230000,
          dur: 500,
          detail: "“nothing's been bought yet” — the human taps place order",
        },
        {
          name: "run_evals",
          type: "span",
          depth: 0,
          start: 231000,
          dur: 900,
          detail: "precision/recall snapshot + llm_usage ledger sum",
        },
      ],
      scores: [
        { name: "prediction_precision", value: "0.86", accent: true },
        { name: "prediction_recall", value: "0.81" },
      ],
      footnote:
        "score names are exactly what run_evals pushes; money-live needs precision ≥ 0.70 · this run cost $0.21 of the $0.15–0.40 band",
    },
  },

  link: {
    path: "src/grocery_buddy/notifications.py",
    note: "'nothing's been bought yet' is literal — the agent stops at the doorstep",
    blocks: [
      {
        kind: "quote",
        text: "I've added everything to your Amazon cart. Nothing's been bought yet — tap Open my Amazon cart (it opens right in your Amazon app where you're already signed in) and finish checkout.",
        cite: "the telegram message, verbatim",
      },
      {
        kind: "steps",
        title: "Closing the loop",
        items: [
          { name: "cart staged", tag: "io", detail: "approved items added to my Amazon cart — nothing purchased" },
          { name: "link sent", tag: "io", detail: "“🧾 Open my Amazon cart” + the run's total" },
          { name: "i place the order", tag: "human", detail: "checkout happens in my Amazon app, signed in as me" },
          { name: "“✅ I placed the order”", tag: "human", detail: "button tap — or just replying “ordered” / “done”" },
          { name: "pantry updated", tag: "io", detail: "items marked in-transit; not re-suggested until they arrive" },
        ],
      },
      {
        kind: "note",
        text: "The confirm step is what powers in-transit replenishment: confirmed items count as covered stock, so the Friday run won't double-suggest eggs that are already in a van.",
      },
    ],
  },

  gate: {
    path: "src/grocery_buddy/workflows/grocery_run.py",
    note: "wait_condition survives worker crashes; quick_buy.py runs the same gate at 6h",
    blocks: [
      {
        kind: "flow",
        title: "The durable approval gate",
        caption: "outlined = the workflow stops here unless a human signals",
        states: [
          { id: "brief", label: "briefing sent", col: 0, row: 0 },
          { id: "wait", label: "wait_condition", col: 1, row: 0, kind: "gate" },
          { id: "appr", label: "approved", col: 2, row: 0 },
          { id: "stage", label: "cart staged + link", col: 3, row: 0, kind: "terminal" },
          { id: "rej", label: "rejected", col: 1, row: 1, kind: "terminal" },
          { id: "exp", label: "expired", col: 2, row: 1, kind: "terminal" },
        ],
        transitions: [
          { from: "brief", to: "wait" },
          { from: "wait", to: "appr", label: "approve signal" },
          { from: "appr", to: "stage", label: "prepare_checkout" },
          { from: "wait", to: "rej", label: "reject signal", dashed: true },
          { from: "wait", to: "exp", label: "timeout", dashed: true },
        ],
      },
      {
        kind: "kv",
        items: [
          { k: "grocery run timer", v: "24h" },
          { k: "quick-buy timer", v: "6h" },
          { k: "auto-buy", v: "never", accent: true },
        ],
      },
      {
        kind: "note",
        text: "The wait is durable: kill the worker mid-wait and Temporal replays the workflow into exactly this state, timer intact. Silence is a safe default — an unanswered briefing expires and nothing is staged.",
      },
    ],
  },

  mlg: {
    path: "src/grocery_buddy/gating.py",
    note: "ready = all(conditions) — one false keeps money off",
    blocks: [
      {
        kind: "rules",
        title: "The five money-live preconditions",
        items: [
          {
            name: "flags_enabled",
            detail:
              "auto_buy_enabled AND money_live, both explicitly true — two flags so one fat-fingered toggle can't open the path.",
          },
          {
            name: "predictor_precision",
            value: "≥ 0.70",
            detail:
              "measured precision from graded prediction snapshots must clear the floor — don't auto-buy off a bad predictor.",
          },
          {
            name: "scraper_health",
            detail:
              "the synthetic probe must be green — extraction works, so the RIGHT item would be added.",
          },
          {
            name: "llm_cost",
            value: "≤ $1.00 / run",
            detail:
              "recent per-run model spend under the ceiling — catches runaway loops before they spend real money.",
          },
          {
            name: "checkout_verified",
            value: "hard stop",
            fail: true,
            detail:
              "staged cart == approved cart verification is not yet implemented — and fails on purpose. A signed approval bounds intent, not execution; until what landed in the cart is verified, this condition returns false.",
          },
        ],
      },
      {
        kind: "note",
        text: "ready = all(conditions) — the gate is evaluated and logged per user, and the fifth condition keeps it shut regardless of how good the other four look.",
      },
    ],
  },

  probe: {
    path: "src/grocery_buddy/monitoring.py",
    note: "known staples must still yield price + asin — silent breakage pages the user",
    blocks: [
      {
        kind: "steps",
        title: "The synthetic health check",
        items: [
          { name: "launch the real browser", tag: "io", detail: "same persistent context the runs use" },
          { name: "search each staple", tag: "io", detail: "milk · eggs · paper towels — queries that should always return grocery results" },
          { name: "assert extraction", tag: "gate", detail: "every probe must yield a price AND an ASIN" },
          { name: "any miss → red", tag: "gate", detail: "status flips red and a notification pages me" },
        ],
      },
      {
        kind: "kv",
        items: [
          { k: "probe queries", v: "milk · eggs · paper towels" },
          { k: "green requires", v: "price + ASIN extract" },
          { k: "feeds", v: "money-live gate", accent: true },
        ],
      },
      {
        kind: "note",
        text: "Best-effort by design: a thrown error becomes a red status, never an exception to the caller — silent breakage is exactly the failure mode being hunted.",
      },
    ],
  },
};
