import type { InspectMap } from "./types";

/**
 * The artifact behind each component of ~/dev/grocery-buddy, distilled
 * into designed blocks — sub-graphs, flows, rules, schema maps. The
 * topology shows 11 chunks; clicking one opens the real wiring inside
 * it. Every name, number, threshold and quote is as coded in the repo;
 * nothing illustrative.
 */
export const GROCERY_BUDDY: InspectMap = {
  wh: {
    path: "src/grocery_buddy/webhook.py",
    note: "every message walks this ladder before any model is asked",
    blocks: [
      {
        kind: "flow",
        title: "The top-level decision tree",
        caption: "the cheap checks run first — a model is asked only at the bottom of the ladder",
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

  llm: {
    path: "src/grocery_buddy/agents/assistant.py",
    note: "eight call-sites; seven priced into the ledger — names below are llm_usage labels, verbatim",
    blocks: [
      {
        kind: "rules",
        title: "Every model call, with exactly what it sees",
        items: [
          {
            name: "parse_request",
            value: "haiku",
            detail:
              "free text + a plain-text pantry snapshot in the system prompt → one of five tools (request_purchase, restock_low_items, update_pantry_quantity, report_not_arrived, update_schedule) or plain chat. 512 tokens.",
          },
          {
            name: "briefing_reply",
            value: "haiku",
            detail:
              "the user's reply + the pending cart's exact lines and total, riding the user turn so the system-plus-tools prefix stays byte-stable → approve · buy_items · reject · reject_and_restart · fix stock · reschedule.",
          },
          {
            name: "briefing",
            value: "haiku",
            detail:
              "compose_briefing — the exact item lines and total as ground truth, plus the free-shipping note. Only called when there IS a note to phrase; the exact total must survive in the output or the deterministic render ships instead.",
          },
          {
            name: "brand_select",
            value: "haiku",
            detail:
              "the product, the preferred brand, and the numbered live listings → {index, reason} JSON. Skipped entirely when there's no preference or only one candidate — the common path costs $0.",
          },
          {
            name: "import_synthesis",
            value: "sonnet",
            detail:
              "two years of aggregated orders — title, times ordered, units, dates, days-since-last — forced onto the propose_pantry tool and streamed; the token budget scales with the product count so a long history can't truncate mid-JSON.",
          },
          {
            name: "import_review",
            value: "haiku",
            detail:
              "the staged pantry proposal + the user's conversational edits (“drop the donuts”). The live pantry is written only on explicit confirm.",
          },
          {
            name: "onboarding",
            value: "haiku",
            detail:
              "the interview tool loop — a free-form pantry dump becomes saved inventory and consumption habits.",
          },
        ],
      },
      {
        kind: "quote",
        text: "If it's small talk or the intent is unclear, chat — don't trigger a purchase or a run on a guess.",
        cite: "the parse_request system prompt, verbatim",
      },
      {
        kind: "note",
        text: "The eighth call-site is selector repair (Sonnet over the accessibility tree, only ever on a deterministic 0-match) — the one call that runs on its own client outside the llm_usage ledger. Everything above goes through llm.record_usage and is priced per run.",
      },
    ],
  },

  tmp: {
    path: "src/grocery_buddy/workflows/",
    note: "three durable workflows, twenty activities — temporal owns time, retries, and the money path",
    blocks: [
      {
        kind: "flow",
        title: "GroceryRunWorkflow — friday 05:00, or on demand",
        caption: "grocery_run.py, step by step",
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
        kind: "steps",
        title: "One scheduled run, activity by activity",
        items: [
          { name: "reconcile_arrivals", tag: "io", detail: "in-transit orders whose ETA passed become on-hand stock" },
          { name: "apply_estimated_depletion", tag: "io", detail: "estimates tick down by rate × days since last look" },
          { name: "load_user_data", tag: "io", detail: "pantry, profiles, and the guardrail reads" },
          { name: "select_run_candidates", tag: "gate", detail: "buckets every item and files the prediction snapshot" },
          { name: "lookup_amazon_prices", tag: "io", detail: "one browser session — must-buys + capped fillers" },
          { name: "assemble_run_cart", tag: "io", detail: "fillers in only until the $25 free-shipping bar" },
          { name: "build_draft_cart", tag: "io", detail: "carts + cart_items rows written" },
          { name: "send_approval_notification", tag: "model", detail: "compose_briefing (haiku) + the telegram buttons" },
          { name: "prepare_checkout", tag: "io", detail: "clear first · stage by ASIN — the one no-retry activity" },
          { name: "run_evals", tag: "io", detail: "precision / recall snapshot + the run's cost vs the alert" },
          { name: "record_replenishments", tag: "human", detail: "on “I placed the order” — items go in-transit" },
        ],
      },
      {
        kind: "kv",
        items: [
          { k: "approval wait", v: "24h · quick-buy 6h" },
          { k: "“i placed the order” ear", v: "72h" },
          { k: "scheduled cooldown", v: "180 min" },
          { k: "retries", v: "≤ 3 · backoff ×2" },
          { k: "prepare_checkout retries", v: "1 — never auto-retried", accent: true },
        ],
      },
      {
        kind: "note",
        text: "Why Temporal at all: every step above survives a crash — workflows replay from history, which is exactly why they must stay pure and why all twenty side-effecting activities live outside them. The money edge is the exception to retries: prepare_checkout runs at most once per attempt, and its idempotency key makes even a manual re-run safe. The other activities cover the import pipeline, onboarding, the Amazon re-login state machine and the health probe.",
      },
    ],
  },

  pred: {
    path: "src/grocery_buddy/predictor.py",
    note: "the actual pipeline, table to cart — one line of arithmetic per box, no model near any of it",
    blocks: [
      {
        kind: "graph",
        title: "Inside the prediction engine",
        caption: "predictor.py · depletion.py · runlist.py — every box is arithmetic; models are never asked",
        nodes: [
          { id: "inv", label: "inventory_items", sub: "qty + incoming on the way", col: 0, row: 0 },
          { id: "prof", label: "consumption_profile", sub: "declared_rate × household", col: 0, row: 1 },
          { id: "ev", label: "consumption_events", sub: "user_update only · 30d", col: 0, row: 2 },
          { id: "decay", label: "depletion decay", sub: "qty − rate × days", col: 1, row: 0 },
          { id: "rate", label: "effective_daily_rate", sub: "observed ≤ 80% · declared ≥ 20%", col: 1, row: 1 },
          { id: "days", label: "days_remaining", sub: "(qty + incoming) ÷ rate", col: 2, row: 1 },
          { id: "buckets", label: "the buckets", sub: "low ≤ 3d · medium ≤ 14d", col: 2, row: 2, accent: true },
          { id: "split", label: "split_run_candidates", sub: "must-buy + fillers ≤ 6", col: 3, row: 2 },
          { id: "ship", label: "free-shipping assembly", sub: "fillers in until ≥ $25", col: 3, row: 1 },
        ],
        edges: [
          { from: "inv", to: "decay" },
          { from: "prof", to: "rate", label: "the prior" },
          { from: "ev", to: "rate", label: "the posterior" },
          { from: "rate", to: "decay", label: "assumed consumption" },
          { from: "decay", to: "days", label: "fresh estimate" },
          { from: "rate", to: "days" },
          { from: "days", to: "buckets" },
          { from: "buckets", to: "split", label: "low = must-buy" },
          { from: "split", to: "ship", label: "priced on amazon first" },
        ],
      },
      {
        kind: "rules",
        title: "How an item gets flagged",
        items: [
          {
            name: "the blend",
            value: "min(events ÷ 14, 0.8)",
            detail:
              "observed consumption earns trust as events accumulate — at 14+ events it carries 80% of the weight, never more. Declared habits always keep a 20% say.",
          },
          {
            name: "no feedback loop",
            detail:
              "only genuine user_update events inform the observed rate — the agent's own inferred depletion and one-off corrections are excluded, so the arithmetic can never feed back on the rate it was derived from.",
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
              "LOW when days_left ≤ lead_time_days (2.0) + buffer_days (1.0) — order when it'll run out before a delivery could land, plus a day of slack. MEDIUM up to 14 days is the filler pool; LARGE a scheduled run safely skips.",
          },
          {
            name: "the round-out",
            value: "≥ $25",
            detail:
              "every must-buy line is always kept; the soonest-to-deplete mediums are added — at most 6 — only until the cart clears Amazon's free next-day-shipping minimum, and the briefing says why they're there.",
          },
        ],
      },
      {
        kind: "kv",
        items: [
          { k: "lead time", v: "2.0 days" },
          { k: "buffer", v: "1.0 day" },
          { k: "lookback", v: "30 days" },
          { k: "medium bucket", v: "≤ 14 days" },
          { k: "models involved", v: "0", accent: true },
        ],
      },
      {
        kind: "note",
        text: "Deliberately boring math, debuggable in one line. Every run snapshots what this engine decided for every item — flagged or not — into prediction_snapshots, and the predictor's graded precision is what the money-live gate measures.",
      },
    ],
  },

  amz: {
    path: "src/grocery_buddy/automation/amazon.py",
    note: "a persistent browser profile, because Amazon has no consumer API — staging only, never checkout",
    blocks: [
      {
        kind: "graph",
        title: "From a search to a staged cart",
        caption: "outlined = the two boxes where the code refuses to proceed on doubt — nothing here places an order",
        nodes: [
          { id: "srch", label: "search_grocery_price", sub: "layered selector chain", col: 0, row: 0 },
          { id: "cand", label: "candidates", sub: "{product, price_usd, asin}", col: 1, row: 0 },
          { id: "brand", label: "brand_select", sub: "haiku · only on a preference", col: 2, row: 0 },
          { id: "line", label: "priced lines", sub: "the real listing · buy to par", col: 3, row: 0 },
          { id: "clear", label: "clear_cart first", sub: "refuse if not verifiably empty", col: 3, row: 1, accent: true },
          { id: "add", label: "add_to_cart_by_asin", sub: "purchases row · idempotent", col: 2, row: 1 },
          { id: "url", label: "the cart url", sub: "account-scoped · never checkout", col: 1, row: 1, accent: true },
        ],
        edges: [
          { from: "srch", to: "cand", label: "price + asin extracted" },
          { from: "cand", to: "brand", label: "2+ listings + a preference" },
          { from: "brand", to: "line", label: "{index, reason}" },
          { from: "line", to: "clear", label: "only after human approval" },
          { from: "clear", to: "add" },
          { from: "add", to: "url", label: "one tap from checkout" },
        ],
      },
      {
        kind: "flow",
        title: "Selector self-repair",
        caption: "resilience.py · dashed = the repair path — taken only when determinism comes up empty",
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
        kind: "flow",
        title: "The 2FA mailbox",
        caption: "tools/auth.py · outlined = a human holds the secret, not the model",
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
        text: "One persistent signed-in Chromium profile (launch_persistent_context) survives runs and restarts — headless by default, forced visible when a login needs a human hand. When Amazon asks for a one-time code mid-login, the worker opens a challenge row and asks over Telegram; the webhook writes the reply back and the flip to consumed is atomic — UPDATE … SET status='consumed' WHERE status='answered' — so a code can never be replayed. A healed selector is cached only after it's confirmed to still match; a dud can't poison the next run.",
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
          { k: "“i placed the order” ear", v: "72h" },
          { k: "auto-buy", v: "never", accent: true },
        ],
      },
      {
        kind: "note",
        text: "The wait is durable: kill the worker mid-wait and Temporal replays the workflow into exactly this state, timer intact. Silence is a safe default — an unanswered briefing expires and nothing is staged; an unconfirmed checkout is never assumed to have happened.",
      },
    ],
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

  lf: {
    path: "src/grocery_buddy/tracing.py",
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
          name: "select_run_candidates",
          type: "gate",
          depth: 0,
          start: 400,
          dur: 80,
          detail: "rule-based buckets — no model · snapshot filed",
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
          type: "span",
          depth: 0,
          start: 47100,
          dur: 200,
          detail: "carts + cart_items rows written",
        },
        {
          name: "send_approval_notification",
          type: "span",
          depth: 0,
          start: 47500,
          dur: 2500,
          detail: "telegram briefing + approve / adjust / reject",
        },
        {
          name: "compose_briefing",
          type: "generation",
          depth: 1,
          start: 47600,
          dur: 1900,
          detail: "haiku 4.5 · only because fillers need explaining",
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
          detail: "playwright clears then stages the amazon cart",
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

  meas: {
    path: "src/grocery_buddy/evals.py",
    note: "the agent grades itself with the same tables it works from — and a nightly suite grades the prompts",
    blocks: [
      {
        kind: "graph",
        title: "The measurement surface",
        caption: "everything the money-live gate reads is measured here — none of it is self-reported",
        nodes: [
          { id: "snap", label: "prediction_snapshots", sub: "every item, every run", col: 0, row: 0 },
          { id: "acc", label: "prediction accuracy", sub: "14d window · 7d horizon", col: 1, row: 0 },
          { id: "scores", label: "langfuse scores", sub: "precision · recall per run", col: 2, row: 0 },
          { id: "ledger", label: "llm_usage ledger", sub: "every call priced", col: 0, row: 1 },
          { id: "cost", label: "cost per workflow", sub: "alert fires > $1.00", col: 1, row: 1 },
          { id: "mlg", label: "money-live gate", sub: "reads all three lanes", col: 2, row: 1, accent: true },
          { id: "probe", label: "scraper probe", sub: "milk · eggs · paper towels", col: 1, row: 2 },
        ],
        edges: [
          { from: "snap", to: "acc", label: "graded vs purchased carts" },
          { from: "acc", to: "scores" },
          { from: "acc", to: "mlg", label: "floor ≥ 0.70" },
          { from: "ledger", to: "cost", label: "SUM per workflow_id" },
          { from: "cost", to: "mlg", label: "max run ≤ $0.50 · 14d" },
          { from: "probe", to: "mlg", label: "green required" },
        ],
      },
      {
        kind: "rules",
        title: "The nightly prompt-regression suites — evals/run.py",
        items: [
          {
            name: "intents",
            value: "gates ≥ 0.8",
            detail: "parse_request / parse_briefing_reply routing accuracy — exact action match against labeled messages.",
          },
          {
            name: "briefings",
            value: "gates ≥ 0.8",
            detail: "compose_briefing groundedness via deterministic checks — no judge in the loop.",
          },
          {
            name: "synthesis",
            value: "gates ≥ 0.8",
            detail: "synthesize_grocery_history product-set recall + exclusion against known order histories.",
          },
          {
            name: "onboarding",
            value: "gates ≥ 0.8",
            detail: "onboarding extraction tool-call recall.",
          },
          {
            name: "briefing_quality",
            value: "report-only",
            detail: "tone and groundedness by LLM-as-judge — reported for the trend, never gates.",
          },
        ],
      },
      {
        kind: "kv",
        items: [
          { k: "precision", v: "flagged ∩ bought ÷ flagged" },
          { k: "recall", v: "flagged ∩ bought ÷ bought" },
          { k: "nightly run", v: "07:00 UTC · github actions" },
          { k: "gating verdict", v: "any suite < 0.8 → exit 1", accent: true },
        ],
      },
      {
        kind: "note",
        text: "Precision is honest because the snapshot records the predictor's decision for every item — not cart membership — so buying something it never flagged lowers recall, as it should. The $1.00 figure is the per-run cost alert; the money-live gate holds the stricter $0.50 ceiling. Snapshots are best-effort: a telemetry failure never blocks a grocery run.",
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
            name: "scraper_green",
            detail:
              "the synthetic probe must be green — extraction works, so the RIGHT item would be added.",
          },
          {
            name: "cost_under_ceiling",
            value: "≤ $0.50 / run",
            detail:
              "the costliest run of the last 14 days — summed per workflow from the llm_usage ledger — must sit under the ceiling. Catches a runaway loop before it could spend real money.",
          },
          {
            name: "checkout_verified",
            value: "hard stop",
            fail: true,
            detail:
              "“execution verification (staged cart == approved cart) not yet implemented — hard stop.” A signed approval bounds intent, not execution; until what actually landed in the cart is verified, this condition returns false on purpose.",
          },
        ],
      },
      {
        kind: "note",
        text: "ready = all(conditions) — the gate is evaluated and logged per user, and the fifth condition keeps it shut regardless of how good the other four look. The agent stages carts; it does not spend.",
      },
    ],
  },
};
