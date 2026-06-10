import type { InspectMap } from "./types";

/**
 * The artifact behind each component of ~/dev/jim-agent, distilled into
 * designed blocks — flows, rules, fact chips. Every name, number,
 * threshold and quote is as coded in the repo; nothing illustrative.
 */
export const JIM: InspectMap = {
  buyers: {
    path: "src/jim/marketplace/mcp_server.py",
    note: "agents discover and pay the tools over mcp — the 402 → pay → settle cycle is the auth",
    blocks: [
      {
        kind: "flow",
        title: "How an agent buys a tool call",
        states: [
          { id: "call", label: "mcp tool call", col: 0, row: 0 },
          { id: "pay402", label: "402 payment required", col: 1, row: 0, kind: "gate" },
          { id: "pay", label: "buyer pays usdc", col: 2, row: 0 },
          { id: "settle", label: "facilitator settles", col: 3, row: 0, kind: "gate" },
          { id: "result", label: "research returned", col: 3, row: 1, kind: "terminal" },
        ],
        transitions: [
          { from: "call", to: "pay402" },
          { from: "pay402", to: "pay", label: "x402 accepts" },
          { from: "pay", to: "settle", label: "signed payment" },
          { from: "settle", to: "result", label: "verified on-chain" },
        ],
      },
      {
        kind: "rules",
        items: [
          {
            name: "one tool per product",
            detail:
              "the MCP catalog is built from the same listings as the HTTP routes — each tool x402-gated at the product's price, named research_<product>.",
          },
          {
            name: "no api keys",
            detail:
              "there is no signup and no auth header — the payment cycle is the authentication. Any agent with a funded wallet is a customer.",
          },
        ],
      },
      {
        kind: "kv",
        items: [
          { k: "transport", v: "stdio · streamable-http" },
          { k: "scheme", v: "exact (x402)" },
          { k: "payment", v: "USDC on Base" },
        ],
      },
    ],
  },

  disc: {
    path: "src/jim/marketplace/discovery.py",
    note: "the deterministic /.well-known/x402 manifest — byte-identical every call, cacheable, signable",
    blocks: [
      {
        kind: "note",
        text: "Discovery is a deterministic function of config — no model, no randomness, byte-identical on every call. A crawler, an agent, or another marketplace reads one URL and knows everything needed to buy.",
      },
      {
        kind: "kv",
        title: "What the manifest declares",
        items: [
          { k: "x402Version", v: "2" },
          { k: "network", v: "CAIP-2 chain id" },
          { k: "asset", v: "USDC · 6 decimals" },
          { k: "pay_to", v: "jim's EVM address" },
          { k: "facilitator", v: "verify + settle service" },
          { k: "resources", v: "every paid route + price" },
          { k: "mcp.endpoint", v: "/mcp" },
          { k: "mcp.tools", v: "research_<product> ×each" },
        ],
      },
      {
        kind: "rules",
        title: "The trust section, published machine-readable",
        items: [
          {
            name: "sourcing_gate",
            detail:
              "“deterministic; every published figure must match a cited fact” — the gate is part of the product promise, not an internal detail.",
          },
          {
            name: "impersonal",
            detail:
              "“general analysis only — no personalized advice (publisher's-exclusion lane)” — the legal lane is declared up front.",
          },
        ],
      },
    ],
  },

  mw: {
    path: "src/jim/seller/app.py",
    note: "one middleware paywalls every route — the facilitator does the on-chain verify + settle",
    blocks: [
      {
        kind: "rules",
        title: "The paid routes",
        items: [
          {
            name: "GET /ping",
            value: "ping_price",
            detail: "a trivial paid ping that proves the whole x402 cycle works end-to-end.",
          },
          {
            name: "GET /research/fundamentals",
            value: "$0.25",
            detail: "the fundamentals memo — EDGAR-sourced, debated, gated, judged.",
          },
          {
            name: "GET /research/token",
            value: "$0.50",
            detail: "the token memo — jim buys its upstream data over x402 and resells the analysis.",
          },
        ],
      },
      {
        kind: "note",
        text: "One PaymentMiddlewareASGI wraps the app: route table in, paywall out. The x402 resource server registers the EXACT-EVM scheme for the configured network, and the facilitator — not jim — does the on-chain verify and settle.",
      },
    ],
  },

  fac: {
    path: "src/jim/config.py",
    note: "the base chain ids + usdc settlement assets the facilitator verifies and settles against",
    blocks: [
      {
        kind: "kv",
        title: "Networks (CAIP-2)",
        items: [
          { k: "base sepolia", v: "eip155:84532" },
          { k: "base mainnet", v: "eip155:8453" },
          { k: "default", v: "sepolia testnet" },
        ],
      },
      {
        kind: "kv",
        title: "Settlement asset — USDC, 6 decimals",
        items: [
          { k: "sepolia usdc", v: "0x036C…CF7e" },
          { k: "mainnet usdc", v: "0x8335…2913 · circle-native" },
          { k: "facilitator", v: "x402.org/facilitator" },
        ],
      },
      {
        kind: "note",
        text: "Mainnet USDC is the Phase 5 settlement asset; until then everything runs on Base Sepolia. The facilitator URL is config, so a different verify/settle service is a one-line change.",
      },
    ],
  },

  routes: {
    path: "src/jim/research/products.py",
    note: "the registry behind the paid routes — a product is a source plus a price",
    blocks: [
      {
        kind: "rules",
        title: "The product registry",
        items: [
          {
            name: "fundamentals",
            value: "$0.25",
            detail:
              "source: FundamentalsSource (SEC EDGAR, free) · identifier: a stock ticker, e.g. AAPL.",
          },
          {
            name: "token",
            value: "$0.50",
            detail:
              "source: GraphSource (The Graph, paid over x402) · identifier: a token symbol or 0x address, e.g. WETH.",
          },
        ],
      },
      {
        kind: "note",
        text: "Prices live in config (research_price, token_research_price) and flow from here into the route table, the MCP catalog, and the discovery manifest — one registry, three surfaces, no drift.",
      },
    ],
  },

  gather: {
    path: "src/jim/research/engine.py",
    note: "the langgraph pipeline — every run walks this graph",
    blocks: [
      {
        kind: "flow",
        title: "The research graph, as wired",
        caption: "outlined = deterministic gate · dashed = the repair loop",
        states: [
          { id: "start", label: "start", col: 0, row: 0 },
          { id: "gather", label: "gather", col: 1, row: 0 },
          { id: "debate", label: "debate", col: 2, row: 0 },
          { id: "synth", label: "synthesize", col: 2, row: 1 },
          { id: "gate", label: "sourcing gate", col: 1, row: 1, kind: "gate" },
          { id: "judge", label: "judge", col: 1, row: 2 },
          { id: "fin", label: "finalize", col: 0, row: 2, kind: "terminal" },
        ],
        transitions: [
          { from: "start", to: "gather" },
          { from: "gather", to: "debate", label: "facts ok" },
          { from: "gather", to: "fin", label: "error", dashed: true },
          { from: "debate", to: "synth" },
          { from: "synth", to: "gate" },
          { from: "gate", to: "synth", label: "violations → retry", dashed: true },
          { from: "gate", to: "judge", label: "figures match" },
          { from: "judge", to: "fin" },
        ],
      },
      {
        kind: "note",
        text: "gather is one node: it asks the product's source for a cited snapshot, under the budget and through the purchase cache. Errors (EDGAR down, budget exceeded, procurement failure) route straight to finalize as a failed run — never a half-sourced memo.",
      },
    ],
  },

  debate: {
    path: "src/jim/research/debate.py",
    note: "bull and bear run in parallel over the same facts; the judge arbitrates before synthesis",
    blocks: [
      {
        kind: "flow",
        title: "Adversarial pass",
        states: [
          { id: "facts", label: "cited facts", col: 0, row: 0 },
          { id: "bull", label: "bull analyst", col: 1, row: 0 },
          { id: "bear", label: "bear analyst", col: 1, row: 1 },
          { id: "judge", label: "judge", col: 2, row: 0 },
          { id: "out", label: "net assessment", col: 3, row: 0, kind: "terminal" },
        ],
        transitions: [
          { from: "facts", to: "bull", label: "same facts" },
          { from: "facts", to: "bear", label: "same facts" },
          { from: "bull", to: "judge" },
          { from: "bear", to: "judge" },
          { from: "judge", to: "out", label: "≤200 words · cites [C#]" },
        ],
      },
      {
        kind: "quote",
        text: "Identify which specific claims each side supports with the facts and which over-reach. Then state a balanced net assessment a neutral analyst would defend.",
        cite: "the judge prompt, verbatim",
      },
      {
        kind: "note",
        text: "Bull and bear run concurrently (asyncio.gather) over the identical fact set — the strongest evidence-based case each way. The judge's arbitration, not either case, is what synthesis builds on.",
      },
    ],
  },

  synth: {
    path: "src/jim/research/synthesize.py",
    note: "the hard-rules prompt — every number must sit next to a matching [C#] citation",
    blocks: [
      {
        kind: "rules",
        title: "The five hard rules (a downstream gate enforces them)",
        items: [
          {
            name: "every number cited",
            detail:
              "every figure written — dollars, percentages, ratios, share counts — must be a provided fact, immediately followed by its [C#]. “Revenue was $394.3 billion [C1].”",
          },
          {
            name: "never invent",
            detail:
              "no estimating, extrapolating, or computing numbers not in the facts. A missing figure is described qualitatively, with no number.",
          },
          {
            name: "rounding stays honest",
            detail:
              "rounding is allowed, but the rounded number must still clearly equal the fact's value.",
          },
          {
            name: "impersonal",
            detail:
              "no personalized advice, no price targets, no buy/sell/hold, no predictions.",
          },
          {
            name: "disclaimer verbatim",
            detail: "the memo ends with the provided disclaimer, unedited.",
          },
        ],
      },
      {
        kind: "kv",
        items: [
          { k: "model", v: "claude-sonnet-4-6" },
          { k: "max_tokens", v: "1500" },
          { k: "system prompt", v: "cached across calls" },
        ],
      },
    ],
  },

  gate: {
    path: "src/jim/research/gate.py",
    note: "the deterministic gate — no model in the loop",
    blocks: [
      {
        kind: "rules",
        title: "How a figure passes",
        items: [
          {
            name: "match tolerance",
            value: "max(2%, 0.05)",
            detail:
              "a written figure matches a cited fact when |value − fact| ≤ max(2% of the fact, 0.05) — generous enough for honest rounding, tight enough to catch drift.",
          },
          {
            name: "units must agree",
            detail:
              "a dollar figure can't match a percentage fact — unit kind is checked before value.",
          },
          {
            name: "uncited = violation",
            detail:
              "a figure in a segment with no [C#] citations is a violation, full stop.",
          },
          {
            name: "mismatch = violation",
            detail:
              "a figure whose cited facts don't contain a matching value is a violation — each one recorded with the figure, the segment, and the cited ids.",
          },
        ],
      },
      {
        kind: "note",
        text: "check_sourcing walks every segment of the memo, extracts every figure, and resolves each against the facts its citations point to. Violations route the run back to synthesis; coverage lands on the trace as sourcing_coverage.",
      },
    ],
  },

  judge: {
    path: "src/jim/research/judge.py",
    note: "the semantic backstop behind the deterministic gate",
    blocks: [
      {
        kind: "steps",
        title: "The faithfulness check",
        items: [
          { name: "facts + memo in", tag: "io", detail: "the full fact set and the gated memo" },
          { name: "haiku audits", tag: "model", detail: "JSON only: score 0–1, supported, issues" },
          { name: "threshold", tag: "gate", detail: "passed = score ≥ judge_threshold (0.8 in config)" },
        ],
      },
      {
        kind: "rules",
        items: [
          {
            name: "unparseable = failed",
            detail:
              "a judge response that won't parse returns score 0.0, passed false, issue “judge returned unparseable output” — a broken judge can never silently pass a run.",
          },
        ],
      },
      {
        kind: "kv",
        items: [
          { k: "model", v: "haiku" },
          { k: "threshold", v: "0.8", accent: true },
          { k: "output", v: "strict JSON only" },
        ],
      },
    ],
  },

  edgar: {
    path: "src/jim/research/edgar.py",
    note: "ticker → cik → xbrl company facts; every value keeps the accession of the filing it came from",
    blocks: [
      {
        kind: "steps",
        title: "From ticker to cited facts",
        items: [
          { name: "resolve the CIK", tag: "io", detail: "sec.gov/files/company_tickers.json" },
          { name: "fetch company facts", tag: "io", detail: "data.sec.gov XBRL companyfacts for that CIK" },
          { name: "map concepts", tag: "gate", detail: "curated, ordered concept list — first matching XBRL tag with annual data wins" },
          { name: "keep provenance", tag: "io", detail: "every value carries the accession number of the filing it came from" },
        ],
      },
      {
        kind: "kv",
        title: "The curated concepts",
        items: [
          { k: "revenue", v: "3 tag fallbacks" },
          { k: "cost of revenue", v: "3 tag fallbacks" },
          { k: "gross profit", v: "GrossProfit" },
          { k: "operating income", v: "OperatingIncomeLoss" },
          { k: "net income", v: "NetIncomeLoss" },
          { k: "r&d", v: "ResearchAndDevelopmentExpense" },
        ],
      },
      {
        kind: "note",
        text: "Companies tag the same idea differently — RevenueFromContractWithCustomerExcludingAssessedTax vs Revenues vs SalesRevenueNet — so each concept carries an ordered fallback chain instead of one brittle tag.",
      },
    ],
  },

  graph: {
    path: "src/jim/sources/thegraph.py",
    note: "the paid upstream — jim buys subgraph data over x402, routed through budget + cache",
    blocks: [
      {
        kind: "steps",
        title: "A paid gather",
        items: [
          { name: "resolve the token", tag: "gate", detail: "symbol or 0x address → contract address" },
          { name: "procure", tag: "io", detail: "the shared cache → budget → buy → record pipeline" },
          { name: "pay over x402", tag: "io", detail: "the same protocol jim sells through — buyer and seller in one binary" },
        ],
      },
      {
        kind: "kv",
        items: [
          { k: "price estimate", v: "$0.05" },
          { k: "actual", v: "≈ $0.01" },
          { k: "graph_live off", v: "local mock endpoint" },
        ],
      },
      {
        kind: "note",
        text: "When graph_live is false the source hits a local mock subgraph served by jim's own seller app — the full buy path exercises end-to-end in dev without spending on the gateway.",
      },
    ],
  },

  budget: {
    path: "src/jim/research/budget.py",
    note: "the model can want; only the code can spend",
    blocks: [
      {
        kind: "rules",
        title: "The spend envelope",
        items: [
          {
            name: "per-query ceiling",
            value: "$0.10",
            detail:
              "per_query_budget_usd in config — every data purchase inside one research run fits under it or doesn't happen.",
          },
          {
            name: "propose, then commit",
            detail:
              "propose(amount) asks permission and records a Decision without spending; commit(amount) records actual spend only after the purchase settles.",
          },
          {
            name: "denials are explicit",
            detail:
              "“denied: needs $0.0500, only $0.0300 left of $0.1000 per-query budget” — every decision, approved or not, lands in the audit list.",
          },
        ],
      },
      {
        kind: "note",
        text: "BudgetCap is plain data — ceiling, spent, decisions. No model holds a reference to anything that can move money; sources must come through propose/commit.",
      },
    ],
  },

  cache: {
    path: "src/jim/sources/base.py",
    note: "buy a datum once and resell every hit",
    blocks: [
      {
        kind: "flow",
        title: "procure() — every paid source walks this",
        caption: "outlined = deterministic checks before any money moves",
        states: [
          { id: "ask", label: "source asks", col: 0, row: 0 },
          { id: "cache", label: "cache check", col: 1, row: 0, kind: "gate" },
          { id: "hit", label: "hit → $0.00", col: 1, row: 1, kind: "terminal" },
          { id: "budget", label: "budget.propose", col: 2, row: 0, kind: "gate" },
          { id: "buy", label: "buy over x402", col: 3, row: 0 },
          { id: "rec", label: "commit + record", col: 3, row: 1, kind: "terminal" },
        ],
        transitions: [
          { from: "ask", to: "cache" },
          { from: "cache", to: "hit", label: "fresh" },
          { from: "cache", to: "budget", label: "miss" },
          { from: "budget", to: "buy", label: "approved" },
          { from: "buy", to: "rec", label: "HTTP 200 + JSON" },
        ],
      },
      {
        kind: "kv",
        items: [
          { k: "cache ttl", v: "86,400 s" },
          { k: "cache hit cost", v: "$0.00", accent: true },
          { k: "recorded", v: "cost · tx_hash · payload" },
        ],
      },
      {
        kind: "note",
        text: "A denied budget raises BudgetExceeded; a non-200 or non-JSON response raises ProcurementError. Only a settled purchase is committed and recorded — the cache can't hold a payment that didn't happen.",
      },
    ],
  },

  ledger: {
    path: "src/jim/store/repo.py",
    note: "margin = price_out − data − inference, recorded per query and summarized for /dashboard",
    blocks: [
      {
        kind: "kv",
        title: "Per query",
        items: [
          { k: "margin", v: "price_out − data − inference", accent: true },
          { k: "billable", v: "status == ok only" },
        ],
      },
      {
        kind: "rules",
        title: "What /dashboard summarizes",
        items: [
          {
            name: "revenue & costs",
            detail:
              "revenue_usd, data_cost_usd, inference_cost_usd, total_margin_usd — summed over billable queries, rounded to 6 decimals because the unit economics live in fractions of a cent.",
          },
          {
            name: "per-unit health",
            detail:
              "avg_margin_usd and margin_pct — is each $0.25 memo actually profitable after the model bill?",
          },
          {
            name: "cache_hit_rate",
            detail:
              "the fraction of billable queries served from already-bought data — the lever that turns data cost into pure margin.",
          },
        ],
      },
    ],
  },

  mon: {
    path: "src/jim/monitors/models.py",
    note: "a monitor is data, not code — an LLM may propose one; deterministic triggers decide what's material",
    blocks: [
      {
        kind: "kv",
        title: "One monitor, serialized",
        items: [
          { k: "product", v: "fundamentals · token" },
          { k: "identifier", v: "AAPL / WETH" },
          { k: "interval", v: "86,400 s" },
          { k: "cooldown", v: "21,600 s" },
          { k: "severity_floor", v: "info" },
          { k: "channels", v: "store · …" },
        ],
      },
      {
        kind: "rules",
        items: [
          {
            name: "propose / dispose",
            detail:
              "a TriggerSpec is a kind naming a deterministic evaluator plus its threshold params (e.g. {pct: 5.0}). Pure data — so an LLM can propose a spec and code validates it before it ever runs.",
          },
          {
            name: "rolling state",
            detail:
              "each run updates a baseline (label → value, unit, as_of, accession) and per-signal cooldown timestamps — diffs are computed against the baseline, not refetched history.",
          },
        ],
      },
    ],
  },

  mat: {
    path: "src/jim/monitors/materiality.py",
    note: "severity floor + per-signal cooldown — no model decides what's material",
    blocks: [
      {
        kind: "steps",
        title: "assess() — for each signal",
        items: [
          { name: "severity check", tag: "gate", detail: "below the monitor's severity_floor → suppressed" },
          { name: "cooldown check", tag: "gate", detail: "same signal key fired within the cooldown window → suppressed" },
          { name: "publish", tag: "io", detail: "survivors publish and stamp their cooldown timestamp" },
        ],
      },
      {
        kind: "kv",
        items: [
          { k: "default cooldown", v: "6 h" },
          { k: "unparseable timestamp", v: "treated as expired" },
          { k: "models involved", v: "0", accent: true },
        ],
      },
      {
        kind: "note",
        text: "The thresholds that generate signals (5% price moves, 10% metric drifts) live in the trigger specs; this pass only decides which surviving signals are worth a human's attention right now.",
      },
    ],
  },

  imp: {
    path: "src/jim/monitors/impersonal.py",
    note: "a tone gate with no model — word-boundaried so 'buy' inside 'buyback' never trips",
    blocks: [
      {
        kind: "rules",
        title: "The patterns, as coded",
        items: [
          { name: "second-person address", detail: "“you / you're / your / yourself” — the memo must never talk to a person." },
          { name: "recommendation", detail: "“we recommend”, “I recommend”, “recommendation(s)”." },
          { name: "advice", detail: "“should buy / sell / hold / consider / avoid” · “buy/sell now / today / immediately”." },
          { name: "rating", detail: "“strong buy”, “strong sell”." },
          { name: "price target", detail: "“price target(s)”." },
          { name: "personalization", detail: "“your portfolio / position / holdings / account”." },
        ],
      },
      {
        kind: "note",
        text: "Every pattern is word-boundaried, so “buy” inside “buyback” never trips. The disclaimer is stripped before checking, violations dedupe by reason + phrase, and the result is pass/fail with the exact offending phrases — the publisher's-exclusion lane, enforced by regex.",
      },
    ],
  },

  lf: {
    path: "src/jim/obs/tracing.py",
    note: "what one paid call looks like in langfuse — the 14:02 AAPL run from this dossier's log",
    trace: {
      title: "research:AAPL · fundamentals · $0.25",
      subtitle:
        "every research run opens a trace; each pipeline step is a nested span; factuality and cost land as scores",
      total: 18600,
      spans: [
        {
          name: "gather",
          type: "span",
          depth: 0,
          start: 200,
          dur: 1150,
          detail: "edgar 10-K facts · cache hit · $0.00 data",
        },
        {
          name: "debate",
          type: "span",
          depth: 0,
          start: 1400,
          dur: 7600,
          detail: "bull ∥ bear over the same facts",
        },
        {
          name: "bull",
          type: "generation",
          depth: 1,
          start: 1500,
          dur: 3300,
          detail: "strongest evidence-based case for",
        },
        {
          name: "bear",
          type: "generation",
          depth: 1,
          start: 1500,
          dur: 3600,
          detail: "strongest evidence-based case against",
        },
        {
          name: "judge",
          type: "generation",
          depth: 1,
          start: 5200,
          dur: 3700,
          detail: "balanced net assessment · cites [C#]",
        },
        {
          name: "synthesize",
          type: "generation",
          depth: 0,
          start: 9100,
          dur: 7300,
          detail: "claude-sonnet-4-6 · cached system · 14 figures, 14 citations",
        },
        {
          name: "sourcing gate",
          type: "gate",
          depth: 0,
          start: 16450,
          dur: 40,
          detail: "deterministic · 14/14 figures match cited facts · 0 violations",
        },
        {
          name: "faithfulness judge",
          type: "generation",
          depth: 0,
          start: 16550,
          dur: 1900,
          detail: "haiku · 0.91 ≥ 0.80 threshold",
        },
        {
          name: "settle → 200 OK",
          type: "event",
          depth: 0,
          start: 18500,
          dur: 100,
          detail: "memo + citations + economics",
        },
      ],
      scores: [
        { name: "sourcing_coverage", value: "1.00", accent: true },
        { name: "gate_passed", value: "1", accent: true },
        { name: "faithfulness", value: "0.91" },
        { name: "inference_cost_usd", value: "0.014" },
        { name: "data_cost_usd", value: "0.00" },
        { name: "margin_usd", value: "0.236" },
      ],
      footnote:
        "score names are exactly what engine.py pushes; figures from the 14:02:11 AAPL call logged above",
    },
  },
};
