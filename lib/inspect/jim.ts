import type { InspectMap } from "./types";

/**
 * The artifact behind each component of ~/dev/jim-agent, distilled into
 * designed blocks — sub-graphs, flows, rules, fact chips. The topology
 * shows ~14 chunks; clicking one opens the real wiring inside it. Every
 * name, number, threshold and quote is as coded in the repo; nothing
 * illustrative.
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
          {
            id: "pay402",
            label: "402 payment required",
            col: 1,
            row: 0,
            kind: "gate",
          },
          { id: "pay", label: "buyer pays usdc", col: 2, row: 0 },
          {
            id: "settle",
            label: "facilitator settles",
            col: 3,
            row: 0,
            kind: "gate",
          },
          {
            id: "result",
            label: "research returned",
            col: 3,
            row: 1,
            kind: "terminal",
          },
        ],
        transitions: [
          { from: "call", to: "pay402" },
          { from: "pay402", to: "pay", label: "x402 accepts" },
          { from: "pay", to: "settle", label: "signed payment" },
          { from: "settle", to: "result", label: "verified on-chain" },
        ],
      },
      {
        kind: "kv",
        title: "What /.well-known/x402 declares — byte-identical every call",
        items: [
          { k: "x402Version", v: "2" },
          { k: "asset", v: "USDC · 6 decimals" },
          { k: "pay_to", v: "jim's EVM address" },
          { k: "resources", v: "every paid route + price" },
          { k: "mcp.tools", v: "research_<product> ×each" },
          { k: "trust section", v: "the gate, machine-readable" },
        ],
      },
      {
        kind: "rules",
        items: [
          {
            name: "no api keys",
            detail:
              "there is no signup and no auth header — the payment cycle is the authentication. Any agent with a funded wallet is a customer.",
          },
          {
            name: "discovery is deterministic",
            detail:
              "the manifest is a pure function of config — no model, no randomness — so a crawler, an agent, or the Bazaar reads one URL and knows everything needed to buy.",
          },
        ],
      },
    ],
  },

  counter: {
    path: "src/jim/seller/app.py",
    note: "one middleware paywalls every route; the facilitator — not jim — verifies and settles on-chain",
    blocks: [
      {
        kind: "flow",
        title: "The counter, per request",
        caption:
          "the chain guard refuses before payment; the facilitator verifies before the engine runs",
        states: [
          { id: "req", label: "request", col: 0, row: 0 },
          {
            id: "chain",
            label: "call-chain guard",
            col: 1,
            row: 0,
            kind: "gate",
          },
          { id: "px", label: "402 challenge", col: 2, row: 0 },
          {
            id: "verify",
            label: "facilitator verify",
            col: 3,
            row: 0,
            kind: "gate",
          },
          { id: "run", label: "route runs", col: 4, row: 0 },
          {
            id: "settle",
            label: "settle → receipt",
            col: 4,
            row: 1,
            kind: "terminal",
          },
          {
            id: "refuse",
            label: "409 · unpaid",
            col: 1,
            row: 1,
            kind: "terminal",
          },
        ],
        transitions: [
          { from: "req", to: "chain" },
          {
            from: "chain",
            to: "refuse",
            label: "loop or depth > 4",
            dashed: true,
          },
          { from: "chain", to: "px", label: "clean chain" },
          { from: "px", to: "verify", label: "signed payment" },
          { from: "verify", to: "run", label: "verified" },
          { from: "run", to: "settle", label: "result ready" },
        ],
      },
      {
        kind: "rules",
        title: "Composition safety — refused before the 402 ever fires",
        items: [
          {
            name: "loop refused",
            detail:
              "if jim's own address already appears in the inbound X-Jim-Call-Chain header, the request is refused with a 409 — before payment, so a cycle can't bill anyone.",
            fail: true,
          },
          {
            name: "depth capped",
            value: "≤ 4",
            detail:
              "four hops is the ceiling; the sell side refuses deeper chains, the buy side refuses to extend past it.",
          },
        ],
      },
      {
        kind: "kv",
        title: "Settlement",
        items: [
          { k: "networks", v: "base sepolia · base mainnet (CAIP-2)" },
          { k: "asset", v: "USDC, 6 decimals · circle-native on mainnet" },
          { k: "facilitator", v: "verify + settle service — a config URL" },
        ],
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
              "source: FundamentalsSource (SEC EDGAR + market data, free) · identifier: a stock ticker, e.g. AAPL.",
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

  proof: {
    path: "src/jim/marketplace/proof.py",
    note: "the public receipt drawer — settlements, refusals and trust scores, plus offline-verifiable signed attestations",
    blocks: [
      {
        kind: "kv",
        title: "what GET /proof shows",
        items: [
          {
            k: "settlements",
            v: "count · total USDC · 15 most recent receipts",
          },
          {
            k: "verification",
            v: "gate pass-rate · refused runs · refused-not-billed $",
          },
          { k: "refusals", v: "recent gate rejections, last 500 runs" },
          { k: "trust", v: "per-source laplace scores, sorted" },
        ],
      },
      {
        kind: "rules",
        items: [
          {
            name: "receipts come from the facilitator",
            detail:
              "the x402 PAYMENT-RESPONSE header the facilitator emits after settlement is decoded and persisted verbatim — jim reports settlements, it doesn't author them.",
          },
          {
            name: "attestations verify offline",
            detail:
              "each signed receipt covers memo sha256 + snapshot fingerprint + gate verdict + settlement tx, EIP-191-signed with jim's key — any EVM stack can recover the signer with no server in the loop.",
          },
        ],
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
          detail:
            "claude-sonnet-4-6 · cached system · 14 figures, 14 citations",
        },
        {
          name: "sourcing gate",
          type: "gate",
          depth: 0,
          start: 16450,
          dur: 40,
          detail:
            "deterministic · 14/14 figures match cited facts · 0 violations",
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

  gather: {
    path: "src/jim/sources/",
    note: "four sources and the peer lane, one cited snapshot — paid data only through procure()",
    blocks: [
      {
        kind: "graph",
        title: "Where the facts actually come from",
        caption:
          "every value keeps its provenance — free sources go straight to facts; money moves only through procure()",
        nodes: [
          {
            id: "edgar",
            label: "SEC EDGAR",
            sub: "xbrl companyfacts · 15 concepts",
            col: 0,
            row: 0,
          },
          {
            id: "yahoo",
            label: "Yahoo Finance",
            sub: "price · sma · rsi · macd",
            col: 1,
            row: 0,
          },
          {
            id: "macro",
            label: "US macro",
            sub: "effr · cpi · 2y/10y treasuries",
            col: 2,
            row: 0,
          },
          {
            id: "thegraph",
            label: "The Graph",
            sub: "uniswap v3 · 4 chains · paid",
            col: 3,
            row: 0,
          },
          {
            id: "peers",
            label: "Peer agents",
            sub: "x402 · trust ≥ 0.4",
            col: 4,
            row: 0,
          },
          {
            id: "procure",
            label: "procure()",
            sub: "cache → budget → buy",
            col: 3,
            row: 1,
            accent: true,
          },
          {
            id: "facts",
            label: "Fact objects",
            sub: "value · unit · [C#] · source_url",
            col: 1,
            row: 2,
          },
          {
            id: "derived",
            label: "compute_derived",
            sub: "margins · roe · ebitda — 7 formulas",
            col: 2,
            row: 2,
          },
          {
            id: "snapshot",
            label: "Snapshot",
            sub: "sha256 fingerprint",
            col: 3,
            row: 2,
          },
        ],
        edges: [
          { from: "edgar", to: "facts", label: "10-K values + accession" },
          { from: "yahoo", to: "facts", label: "market data" },
          { from: "macro", to: "facts", label: "gov primary series" },
          { from: "thegraph", to: "procure", label: "propose $" },
          { from: "peers", to: "procure", label: "propose $" },
          { from: "procure", to: "facts", label: "settled payload" },
          { from: "facts", to: "derived" },
          { from: "derived", to: "snapshot", label: "facts + formulas" },
        ],
      },
      {
        kind: "rules",
        title: "The spend envelope — the model can want; only code can spend",
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
        kind: "kv",
        items: [
          { k: "purchase cache ttl", v: "86,400 s" },
          { k: "cache hit cost", v: "$0.00", accent: true },
          {
            k: "derived facts",
            v: "carry formula + parent [C#]s, never a source",
          },
        ],
      },
      {
        kind: "note",
        text: "EDGAR values keep the accession number of the filing they came from; derived metrics carry their formula and input facts instead. Errors — EDGAR down, budget exceeded, procurement failure — fail the run closed: never a half-sourced memo. The snapshot's SHA256 fingerprint is the memo cache's identity, so any real data move invalidates the cache.",
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
          {
            id: "out",
            label: "net assessment",
            col: 3,
            row: 0,
            kind: "terminal",
          },
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
        kind: "kv",
        items: [
          { k: "bull · bear", v: "≤ 180 words each · asyncio.gather" },
          { k: "judge", v: "≤ 200 words" },
          { k: "rule", v: "only provided FACTS · every number [C#]-tagged" },
        ],
      },
      {
        kind: "note",
        text: "The judge's arbitration — not either case — is what synthesis builds on. Debate is optional luxury: ENABLE_DEBATE off still produces a memo, because the deterministic spine doesn't need the theater.",
      },
    ],
  },

  synth: {
    path: "src/jim/research/synthesize.py",
    note: "exactly what the synthesizer is fed — and the five hard rules a downstream gate enforces",
    blocks: [
      {
        kind: "graph",
        title: "The context, as assembled",
        caption:
          "five inputs, one call — the gate-feedback lane exists only on a retry",
        nodes: [
          {
            id: "facts",
            label: "facts_block",
            sub: "every fact, [C#]-tagged",
            col: 0,
            row: 0,
          },
          {
            id: "debate",
            label: "debate verdict",
            sub: "the judge's net assessment",
            col: 1,
            row: 0,
          },
          {
            id: "feedback",
            label: "gate feedback",
            sub: "violations from attempt n−1",
            col: 2,
            row: 0,
          },
          {
            id: "mode",
            label: "mode directive",
            sub: "human · agent",
            col: 3,
            row: 0,
          },
          {
            id: "system",
            label: "hard-rules prompt",
            sub: "5 rules · cached",
            col: 1,
            row: 1,
            accent: true,
          },
          {
            id: "model",
            label: "claude-sonnet-4-6",
            sub: "max 1500 tokens",
            col: 2,
            row: 1,
          },
          {
            id: "memo",
            label: "the memo",
            sub: "prose · every figure cited",
            col: 2,
            row: 2,
          },
        ],
        edges: [
          { from: "facts", to: "model", label: "verbatim, never summarized" },
          { from: "debate", to: "model" },
          {
            from: "feedback",
            to: "model",
            label: "retry ≤ 2 only",
            dashed: true,
          },
          { from: "mode", to: "model" },
          { from: "system", to: "model", label: "cached across calls" },
          { from: "model", to: "memo" },
        ],
      },
      {
        kind: "rules",
        title: "The five hard rules (the sourcing gate enforces them)",
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
          { k: "human mode", v: "~300–450 words · sections" },
          { k: "agent mode", v: "metric-dense “label: value [C#]” lines" },
        ],
      },
    ],
  },

  gate: {
    path: "src/jim/research/gate.py",
    note: "the deterministic gate — no model in the loop",
    blocks: [
      {
        kind: "steps",
        title: "check_sourcing — per memo segment",
        items: [
          {
            name: "extract ranges",
            tag: "gate",
            detail: "“$1.2–1.4 billion” → both endpoints",
          },
          {
            name: "extract marked figures",
            tag: "gate",
            detail:
              "$ · % · × · word scales (“five billion”) · 5B suffixes · scientific notation",
          },
          {
            name: "extract anchored decimals",
            tag: "gate",
            detail: "bare decimals sitting before a [C#] — RSI, ratios",
          },
          {
            name: "check units",
            tag: "gate",
            detail: "a dollar figure can never match a percentage fact",
          },
          {
            name: "match values",
            tag: "gate",
            detail: "against the facts the segment's citations point to",
          },
        ],
      },
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
            name: "uncited = violation",
            detail:
              "a figure in a segment with no [C#] citations is a violation, full stop.",
            fail: true,
          },
          {
            name: "mismatch = violation",
            detail:
              "a figure whose cited facts don't contain a matching value is a violation — each one recorded with the figure, the segment, and the cited ids.",
            fail: true,
          },
          {
            name: "phantom citation = violation",
            detail:
              "a [C#] pointing at a fact that doesn't exist is itself a violation.",
            fail: true,
          },
        ],
      },
      {
        kind: "note",
        text: "Violations route the run back to synthesis with the exact failures as feedback; retries exhausted, the run is rejected and never billed. Coverage lands on the trace as sourcing_coverage.",
      },
    ],
  },

  judge: {
    path: "src/jim/research/judge.py",
    note: "the semantic backstop behind the deterministic gate — its bar was measured, not guessed",
    blocks: [
      {
        kind: "steps",
        title: "The faithfulness check",
        items: [
          {
            name: "facts + memo in",
            tag: "io",
            detail: "the full fact set and the gated memo",
          },
          {
            name: "haiku audits",
            tag: "model",
            detail: "JSON only: score 0–1, supported, issues",
          },
          {
            name: "threshold",
            tag: "gate",
            detail: "passed = score ≥ judge_threshold (0.55 in config, provisional)",
          },
        ],
      },
      {
        kind: "quote",
        text: "Faithfulness score below this fails the run. Set from the `jim-eval judge-calibrate` threshold sweep (docs/EVAL_LADDER.md, Phase E2) — calibration run 20260715T003647Z-dea5b09 (subscription mode, 40 labeled cases × 3 repeats) chose 0.55: balanced accuracy 0.96, false-rejects 0/15. The 5% false-reject cap binds here — 0.70–0.75 scored ba 0.9667 with 100% lie recall but 6.7% false-rejects. Provisional until the operator signs off the corpus labels (EVAL_LADDER Phase E2, remaining item).",
        cite: "src/jim/config.py — judge_threshold: float = 0.55",
      },
      {
        kind: "kv",
        title: "The sweep that chose it — 120 real judge calls",
        items: [
          { k: "0.80 (old default)", v: "ba 0.9333 · lies 25/25 · false-rejects 2/15" },
          { k: "0.70–0.75", v: "ba 0.9667 · lies 25/25 · false-rejects 1/15" },
          {
            k: "0.55–0.60 (chosen)",
            v: "ba 0.9600 · lies 23/25 · false-rejects 0/15",
          },
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
          {
            name: "both or nothing",
            detail:
              "status is ok only if the sourcing gate passed AND the judge passed — one line in the engine, and the only place revenue is decided.",
          },
        ],
      },
      {
        kind: "kv",
        items: [
          { k: "model", v: "haiku" },
          { k: "threshold", v: "0.55 — measured, provisional", accent: true },
          { k: "floor to qualify", v: "ba ≥ 0.85 · false-rejects ≤ 5%" },
          { k: "output", v: "strict JSON only" },
        ],
      },
    ],
  },

  peers: {
    path: "src/jim/sources/peer.py",
    note: "buying research inputs from other agents over the same x402 rails jim sells on — trust checked before money moves",
    blocks: [
      {
        kind: "flow",
        title: "One peer purchase",
        caption:
          "identical pipeline to The Graph — trust checked before any money moves",
        states: [
          { id: "want", label: "gather wants a fact", col: 0, row: 0 },
          { id: "trust", label: "trust ≥ 0.4?", col: 1, row: 0, kind: "gate" },
          {
            id: "budget",
            label: "budget propose",
            col: 2,
            row: 0,
            kind: "gate",
          },
          { id: "cache", label: "cache?", col: 3, row: 0 },
          { id: "buy", label: "resilient x402 buy", col: 4, row: 0 },
          { id: "record", label: "recorded", col: 4, row: 1, kind: "terminal" },
          {
            id: "refused",
            label: "refused · $0",
            col: 1,
            row: 1,
            kind: "terminal",
          },
        ],
        transitions: [
          { from: "want", to: "trust" },
          { from: "trust", to: "refused", label: "below floor" },
          { from: "trust", to: "budget", label: "ok" },
          { from: "budget", to: "cache", label: "approved" },
          { from: "cache", to: "buy", label: "miss" },
          { from: "cache", to: "record", label: "hit — $0" },
          { from: "buy", to: "record" },
        ],
      },
      {
        kind: "quote",
        text: "Smoothed pass-rate: (ok+1)/(ok+fail+2). A new source starts at 0.5.",
        cite: "src/jim/interop/trust.py — laplace_score",
      },
      {
        kind: "rules",
        items: [
          {
            name: "credit on pass",
            detail:
              "when the sourcing gate passes a memo, every source that contributed a fact is credited ok=true.",
          },
          {
            name: "debit only the guilty",
            detail:
              "when the gate fails, only sources actually cited in the violations are debited — a synthesizer hallucination with no citation punishes no source.",
            fail: true,
          },
          {
            name: "degrade, don't die",
            detail:
              "a failing peer is skipped with a note — jim gates what it could verify instead of failing the run. An unusable payload debits that peer's trust before the error surfaces.",
          },
        ],
      },
      {
        kind: "kv",
        items: [
          { k: "trust floor", v: "0.4 after ≥3 events", accent: true },
          { k: "timeout / attempt", v: "20s · 2 retries" },
          { k: "breaker", v: "5 transport fails → open 30s" },
        ],
      },
    ],
  },

  economy: {
    path: "src/jim/store/repo.py",
    note: "margin = price_out − data − inference, recorded per query — and the memo cache that makes the second sale nearly pure margin",
    blocks: [
      {
        kind: "flow",
        title: "The memo cache short-circuit",
        caption:
          "a cached memo is re-gated before it's served — never trusted on age alone",
        states: [
          { id: "req", label: "paid request", col: 0, row: 0 },
          { id: "cache", label: "memo cache", col: 1, row: 0, kind: "gate" },
          {
            id: "recheck",
            label: "gate re-check",
            col: 2,
            row: 0,
            kind: "gate",
          },
          {
            id: "serve",
            label: "served · $0 inference",
            col: 3,
            row: 0,
            kind: "terminal",
          },
          { id: "run", label: "full pipeline", col: 1, row: 1 },
          {
            id: "store",
            label: "stored · ttl",
            col: 2,
            row: 1,
            kind: "terminal",
          },
        ],
        transitions: [
          { from: "req", to: "cache" },
          { from: "cache", to: "recheck", label: "fingerprint match" },
          { from: "recheck", to: "serve", label: "still passes" },
          { from: "cache", to: "run", label: "miss" },
          { from: "recheck", to: "run", label: "stale", dashed: true },
          { from: "run", to: "store", label: "gate-passed memo" },
        ],
      },
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
    path: "src/jim/monitors/materiality.py",
    note: "monitors are data, materiality is code, tone is regex — the model speaks only on material news",
    blocks: [
      {
        kind: "kv",
        title: "One monitor, serialized",
        items: [
          { k: "interval", v: "86,400 s" },
          { k: "cooldown", v: "21,600 s per signal" },
          {
            k: "triggers",
            v: "{pct: 5.0} price · {pct: 10.0} metric · rsi 70/30",
          },
          { k: "models involved in detection", v: "0", accent: true },
        ],
      },
      {
        kind: "steps",
        title: "assess() — for each signal",
        items: [
          {
            name: "severity check",
            tag: "gate",
            detail: "below the monitor's severity_floor → suppressed",
          },
          {
            name: "cooldown check",
            tag: "gate",
            detail: "same signal key fired within 6h → suppressed",
          },
          {
            name: "synthesize",
            tag: "model",
            detail:
              "survivors earn a written update — through the sourcing gate again",
          },
          {
            name: "tone gate",
            tag: "gate",
            detail: "the impersonal guard, before anything publishes",
          },
        ],
      },
      {
        kind: "rules",
        title:
          "The impersonal guard — the publisher's-exclusion lane, as regex",
        items: [
          {
            name: "second person",
            detail:
              "“you / your / yourself” — the memo must never talk to a person.",
          },
          {
            name: "advice & ratings",
            detail:
              "“should buy / sell / hold” · “strong buy” · “we recommend” · “price target(s)”.",
          },
          {
            name: "personalization",
            detail: "“your portfolio / position / holdings / account”.",
          },
        ],
      },
      {
        kind: "note",
        text: "Every pattern is word-boundaried, so “buy” inside “buyback” never trips. A TriggerSpec is pure data — an LLM may propose one; code validates it before it ever runs. A quiet poll costs $0 of inference.",
      },
    ],
  },

  evals: {
    path: "src/jim/eval/runner.py",
    note: "ADR-0009 — tiered suites, persisted runs, thresholded regression verdicts; offline is the merge gate, live is the trend, and the judge corpus is its own deliberate spend",
    blocks: [
      {
        kind: "graph",
        title: "The harness, end to end",
        caption:
          "99 offline cases · ~2s · $0 — the run the 06:17 night watch executes. The judge corpus sits outside it: a separate command that needs a key and spends real money.",
        nodes: [
          {
            id: "gatecases",
            label: "gate suite",
            sub: "48 memos · truths, planted lies + injection",
            col: 0,
            row: 0,
          },
          {
            id: "guards",
            label: "guard suite",
            sub: "40 cases · 5 categories",
            col: 1,
            row: 0,
          },
          {
            id: "scen",
            label: "scenarios",
            sub: "11 full-engine runs, scripted i/o",
            col: 2,
            row: 0,
          },
          {
            id: "live",
            label: "live suite",
            sub: "8 held-out tickers × 2 variants",
            col: 3,
            row: 0,
          },
          {
            id: "judgecal",
            label: "judge corpus",
            sub: "40 labeled memos · 15 faithful, 25 not",
            col: 4,
            row: 0,
          },
          {
            id: "calrun",
            label: "jim-eval judge-calibrate",
            sub: "its own command · needs a key · costs money",
            col: 4,
            row: 1,
          },
          {
            id: "runner",
            label: "jim-eval run",
            sub: "offline: no keys · no network",
            col: 1,
            row: 1,
          },
          {
            id: "runjson",
            label: "run document",
            sub: "eval_runs/<id>.json · git sha",
            col: 2,
            row: 1,
          },
          {
            id: "baseline",
            label: "BASELINE diff",
            sub: "case-by-case + thresholds",
            col: 2,
            row: 2,
            accent: true,
          },
          {
            id: "verdict",
            label: "verdict",
            sub: "pass · regressed → exit 1",
            col: 3,
            row: 2,
          },
          {
            id: "night",
            label: "nightly digest",
            sub: "launchd 06:17 · morning banner",
            col: 4,
            row: 2,
          },
        ],
        edges: [
          { from: "gatecases", to: "runner" },
          { from: "guards", to: "runner" },
          { from: "scen", to: "runner" },
          { from: "live", to: "runner", label: "opt-in · real spend" },
          {
            from: "judgecal",
            to: "calrun",
            label: "never part of the nightly run",
          },
          { from: "runner", to: "runjson", label: "aggregates + every case" },
          { from: "runjson", to: "baseline", label: "compare" },
          { from: "baseline", to: "verdict" },
          { from: "verdict", to: "night", label: "filed while I sleep" },
        ],
      },
      {
        kind: "rules",
        title: "Regression verdicts",
        items: [
          {
            name: "offline",
            value: "99 cases · ~2s · $0",
            detail:
              "zero tolerance — any newly-failing case regresses the run and exits 1.",
            fail: true,
          },
          {
            name: "live",
            detail:
              "stochastic, so thresholded: fails on a gate pass-rate drop over 5%, rubric over 2%, cost over 25%, latency p95 over 50% vs baseline.",
          },
          {
            name: "every run persists",
            detail:
              "runs land in eval_runs/ and jim-eval ui plots the trends — which is how a judge max_tokens of 900 (JSON truncating mid-array, every live memo 'rejected') was told apart from a real quality drop. It's 4096 now.",
          },
          {
            name: "the calibration run isn't on disk",
            detail:
              "the sweep that chose 0.55 is recorded in a config comment and a doc — the run document itself exists on no machine, so no reviewer or fresh clone can re-check the numbers. The repo's own eval audit names this first.",
            fail: true,
          },
          {
            name: "the baseline is local",
            detail:
              "the stored baseline and every past run are gitignored, so the regression comparison only bites on the machine that made it — anywhere else it finds nothing to compare against and passes. Named as a gap by the repo's own eval audit, not discovered here.",
            fail: true,
          },
        ],
      },
      {
        kind: "kv",
        title: "The rubric, weighted",
        items: [
          { k: "sourcing", v: "0.40", accent: true },
          { k: "faithfulness", v: "0.30" },
          { k: "completeness", v: "0.20" },
          { k: "impersonal", v: "0.10" },
        ],
      },
      {
        kind: "kv",
        title: "Offline isolation, enforced in .claude/evals.sh",
        items: [
          { k: "ANTHROPIC_API_KEY", v: "emptied — judge + debate skipped" },
          { k: "DATABASE_URL", v: "emptied — in-memory store" },
          { k: "NETWORK", v: "pinned to base sepolia" },
        ],
      },
    ],
  },
};
