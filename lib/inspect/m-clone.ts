import type { InspectMap } from "./types";

/**
 * M-CLONE — click-to-inspect for the on-device banking-copilot dossier.
 * Distilled from /Users/geoandr/dev/M-Clone: names, thresholds, guard
 * behavior, and corpus facts are as coded/measured, never illustrative.
 * (Measured 2026-07-23: 86.5% family / 0/35 OOS = evals/erica-routing/
 * REPORT.md hybrid-armA-v1 row; 81 = sealed/holdout-v3.jsonl; 604 =
 * `grep -rh '@Test' Crown/Tests/CrownKitTests | wc -l`.)
 */
export const M_CLONE: InspectMap = {
  hosts: {
    path: "Crown/ · BofAShell/",
    note: "Two SwiftUI host apps, zero duplicated logic — both consume the same shared package.",
    blocks: [
      {
        kind: "kv",
        title: "the split",
        items: [
          { k: "hosts", v: "two app shells (Crown, BofAShell)" },
          { k: "shared", v: "CrownCore + CrownKit Swift package" },
          { k: "pattern", v: "SwiftUI · @Observable view-models" },
          { k: "backend", v: "none — no server, no server DB", accent: true },
        ],
      },
    ],
  },
  kit: {
    path: "Crown/Sources/CrownKit/",
    note: "The package where everything lives: view-models, services, repositories.",
    blocks: [
      {
        kind: "steps",
        title: "a question becomes an answer",
        ordered: true,
        items: [
          { name: "intent proposed", detail: "deterministic router, model assist inside a bounded lane", tag: "model" },
          { name: "capability resolved", detail: "family → operation, guarded", tag: "gate" },
          { name: "typed tool runs", detail: "calculators over repository reads", tag: "io" },
          { name: "answer rendered", detail: "numbers computed, never generated", tag: "gate" },
        ],
      },
    ],
  },
  store: {
    path: "Crown/Sources/CrownKit/Services/",
    note: "SwiftData on-device store; Plaid tokens live in the Keychain, keyed by item.",
    blocks: [
      {
        kind: "kv",
        title: "what stays on the phone",
        items: [
          { k: "ledgers", v: "accounts · transactions · budgets · goals" },
          { k: "chat", v: "assistant history, local only" },
          { k: "plaid tokens", v: "Keychain, keyed by item_id", accent: true },
          { k: "sync", v: "none — the device is the source of truth" },
        ],
      },
    ],
  },
  router: {
    path: "Crown/Sources/CrownKit/Services/Advisor/FoundationModelsSemanticRouter.swift",
    note: "The hybrid: a deterministic floor carries the load; the on-device model assists with family-level intent only.",
    blocks: [
      {
        kind: "rules",
        title: "measured on the live corpus (REPORT.md, hybrid-armA-v1)",
        items: [
          { name: "family accuracy", detail: "prompts routed to the right capability family", value: "86.5%" },
          { name: "out-of-scope leaks", detail: "attempts that escaped the guarded scope", value: "0/35" },
          { name: "model authority", detail: "family-only — the model never picks the operation, the numbers, or the tool arguments", fail: false },
        ],
      },
      {
        kind: "note",
        text: "Typed error chains replaced stringified errors after an OS-level failure hid inside 'available': the guardrail asset gate (FB19844387) was invisible until the harness typed every error.",
      },
    ],
  },
  tools: {
    path: "Crown/Sources/CrownKit/Services/Advisor/",
    note: "Typed financial tools and calculators — the only way the assistant touches a number.",
    blocks: [
      {
        kind: "kv",
        title: "the tool surface",
        items: [
          { k: "shape", v: "typed schemas in, computed values out" },
          { k: "coverage", v: "balances · spend · budgets · goals · debt · products" },
          { k: "free generation", v: "never — a figure the tools can't compute isn't answered", accent: true },
        ],
      },
    ],
  },
  insights: {
    path: "Crown/Sources/CrownKit/Services/Advisor/InsightEngine.swift",
    note: "Rules compute the observations; the on-device model narrates them — under a citation forcer.",
    blocks: [
      {
        kind: "rules",
        title: "narration is graded, not trusted",
        items: [
          { name: "fixtures", detail: "engineered eval fixtures pinning the rules layer", value: "35" },
          { name: "must-cite", detail: "narration must carry the computed figure or the card ships without narration" },
          { name: "per-row adjudication", detail: "device runs are read output-by-output before any strategy ships" },
        ],
      },
    ],
  },
  guards: {
    path: "scripts/check-no-remote-llm.sh",
    note: "The privacy claim and the test discipline, enforced at commit time — not promised in a README.",
    blocks: [
      {
        kind: "rules",
        title: "guards that fail the commit",
        items: [
          { name: "no-remote-llm", detail: "source-level scan; a cloud-model call anywhere in the assistant goes red" },
          { name: "model-free-tests", detail: "no test may reach a live model or the real availability gate — doubles + override only" },
          { name: "anti-cheat", detail: "net-negative test assertions, skip markers, or deleted evals turn the gate red" },
        ],
      },
    ],
  },
  evals: {
    path: "evals/erica-routing/",
    note: "The eval product: versioned packs, preregistrations, a failure taxonomy, a sealed holdout, a native harness.",
    blocks: [
      {
        kind: "graph",
        title: "inside the eval product",
        nodes: [
          { id: "packs", label: "Corpus packs", sub: "development · confusable · workflow · journey · over-refusal", col: 0, row: 0 },
          { id: "prereg", label: "Preregistrations", sub: "hypothesis before run", col: 1, row: 0 },
          { id: "harness", label: "Mac harness", sub: "compiles the real router source", col: 0, row: 1 },
          { id: "sealed", label: "Sealed holdout", sub: "81 cases · hash-sealed", col: 1, row: 1, accent: true },
          { id: "report", label: "REPORT.md", sub: "the running results doc", col: 2, row: 1 },
        ],
        edges: [
          { from: "packs", to: "harness", label: "scored" },
          { from: "prereg", to: "report", label: "ratified" },
          { from: "harness", to: "report", label: "evidence" },
          { from: "sealed", to: "report", label: "sealed reads only", dashed: true },
        ],
      },
      {
        kind: "note",
        text: "The seal earned its keep: development-pack tuning read 55 while the sealed holdout read ~23 — overfitting arrived as a measurement, not a shipped surprise.",
      },
    ],
  },
  relay: {
    path: "plaid-redirect/",
    note: "The only hosted piece, kept deliberately thin: OAuth return, AASA, webhook-to-push. Nothing else grows server-side.",
    blocks: [
      {
        kind: "kv",
        title: "the entire server",
        items: [
          { k: "oauth return", v: "Plaid redirect back into the app" },
          { k: "aasa", v: "universal-link association" },
          { k: "webhooks", v: "Plaid events relayed to APNs" },
          { k: "data stored", v: "none", accent: true },
        ],
      },
    ],
  },
};
