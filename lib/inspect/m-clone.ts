import type { InspectMap } from "./types";

/**
 * M-CLONE — click-to-inspect for the on-device banking-copilot dossier.
 * Distilled from /Users/geoandr/dev/M-Clone: names, thresholds, guard
 * behavior, and corpus facts are as coded/measured, never illustrative.
 * (Re-verified 2026-07-26, unchanged since 2026-07-23: 86.5% family /
 * 0/35 OOS = the routing evals' REPORT.md hybrid-armA-v1 row; 81 =
 * sealed/holdout-v3.jsonl; 604 =
 * `grep -rh '@Test' Crown/Tests/CrownKitTests | wc -l` — Swift only.
 * 168 Python test fns =
 * `git grep -hE '^\s*(async )?def test_' -- scripts/tests | wc -l`
 * across 15 files. Timeline start = `git log --reverse -1` → 2026-02-12.
 *
 * The audit verdicts below are quoted from
 * docs/evals/2026-07-25-methodology-audit.md (D1–D8 scorecard, its
 * five ranked gaps) and the 2026-07-25 v2 addendum in the same file.
 * Figures sourced there: 61 scored cases = the gate's coverage assert
 * in scripts/gate-erica-routing.sh; 2,144 tuning messages = the
 * holdout leak check; 48 = overrefusal-pack-v1.jsonl; six retracted
 * claims = the corrections ledger; five sealed reads in four days =
 * the D4 finding.)
 */
export const M_CLONE: InspectMap = {
  hosts: {
    path: "Crown/ (+ a second host shell)",
    note: "Two SwiftUI host apps, zero duplicated logic — both consume the same shared package.",
    blocks: [
      {
        kind: "kv",
        title: "the split",
        items: [
          { k: "hosts", v: "two app shells, one code path" },
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
        text: "Read these as upper bounds. The repo documents its own matcher as too generous — it requires the answer key's fields but tolerates extra ones the key never asked for — so scores are expected to move down when the ruler gets strict.",
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
    path: "evals/ — assistant routing + insights",
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
      {
        kind: "note",
        text: "On 2026.07.25 the suite was scored against an outside eight-part standard for eval work. Met, partial and missing below are the review's own verdicts; ember marks the one part with no coverage at all.",
      },
      {
        kind: "rules",
        title: "what held — the suite, graded against an outside standard",
        items: [
          { name: "how answers are graded", detail: "the accuracy check IS the shipped rule, not a copy of it; the offline rescorer is pinned against it", value: "met" },
          { name: "failures become cases", detail: "a real failure is written in as a case in the same change that fixes it, and an append-only ledger records six published claims later found wrong, each with a date", value: "met" },
          { name: "scores as statistics", detail: "repeat runs came back byte-identical on both models, so the noise floor is measured rather than assumed — but only for one deterministic pass, not the three-sample vote the app actually ships", value: "partial" },
          { name: "suite honesty", detail: "the seal, the leak check against 2,144 tuning messages, and the refusal counterweight all hold; the nightly asserts how many cases were scored, not how many were right", value: "partial" },
          { name: "multi-turn grading", detail: "a conversation known to be measured wrong still sits inside the certified numbers, its fix parked behind an off-by-default switch to keep the baseline identical", value: "partial" },
          { name: "refusal safety", detail: "48 benign-but-alarming probes stop a more nervous assistant from scoring as a better one; personal data arriving in the question is uncovered", value: "partial" },
          { name: "one uniform command", detail: "the nightly resolves its own interpreter and runs unattended — but needs Xcode and a bootable simulator, so a broken machine reads the same as a broken answer", value: "partial" },
        ],
      },
      {
        kind: "rules",
        title: "what didn't",
        items: [
          { name: "the reviewer as instrument", detail: "the quality gate for insights was closed by the same agent that wrote the change, unblinded, with no rows carrying planted errors to show what the reviewer waves through", value: "missing", fail: true },
        ],
      },
      {
        kind: "note",
        text: "Verdicts only — the review changed no corpus, no gate, no threshold and no grading code. It quoted the failing lines, froze a list of what must not be refactored during the repair, and left the numbers standing.",
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
