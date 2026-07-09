---
title: SF AI Hackathon Playbook
collection: hackathons
source: ~/dev/hackathons/PLAYBOOK.md
sourceMtime: '2026-07-06T00:55:54.886Z'
syncedAt: '2026-07-09'
summary: >-
  Researched 2026-07-05. Goals: connect with builders, learn how others build,
  meet hiring managers/recruiters, and ship demos that become talking points.
  Winning is a side effect.
contentHash: 'sha256:16de75e1cb83123e62e502970b8d24f2c3cca46c06ace122f23c4ec436cc95b7'
---
# SF AI Hackathon Playbook

*Researched 2026-07-05. Goals: connect with builders, learn how others build, meet hiring
managers/recruiters, and ship demos that become talking points. Winning is a side effect.*

Companion docs: [IDEAS.md](IDEAS.md) (duration-tiered backlog) · [INGREDIENTS.md](INGREDIENTS.md)
(reusable code pantry + pre-event checklist). Kickoff skill: `/hack <idea> <duration>`.

---

## 1. Define your win condition

You're not optimizing for prizes. A successful event =

1. **One working demo** shipped and pitched (the artifact + the rep).
2. **Three real conversations** where you learned how someone else builds agents.
3. **One follow-up** sent within 24h to someone worth knowing (builder, judge, or hiring-adjacent).
4. **One talking point** captured in DEMO.md → future Byline content + interview material.

If all four happen and you place last, the event paid for itself.

## 2. The scene: who runs what

| Circuit | Examples | Cadence / entry | What it's for (for YOU) |
|---|---|---|---|
| **Flagship** | Cerebral Valley, AGI House | Weekly-biweekly; application-gated (flagships hit sub-4% acceptance — Opus 4.6 event: 13k applied, 500 in) | Prestige, VC visibility, strongest rooms |
| **Model-provider** | Anthropic "Built with Claude/Opus" series, OpenAI Codex, Gemini Build Days | ~Monthly per provider; 1,500+ apps for ~300 seats | Judges are the actual product team — Boris Cherny & Lydia Hallie judged Claude Code hackathons. This is your Tier-S contact channel. |
| **YC events** | Call My Agent, Conversational AI, AI Growth, RoboHacks | Occasional, Luma application, at YC's office | 1st prize is literally a YC interview at several. Highest recruiter-equivalent density. |
| **Vendor build nights** | Cursor meetups, Vercel, NEAR/SF Compute "Useful Agents", Browserbase | Frequent, low bar, RSVP on Luma | Low-stakes reps, casual networking |
| **Community jams** | AI Tinkerers SF | Monthly; open; explicitly no recruiting/vendor pitches | Learning how others build — best insight-per-hour, zero recruiter ROI by design |

**Finding them:** Luma (`lu.ma` — follow the "SF Hackathon Collection"), cerebralvalley.ai/events,
agihouse.ai, events.ycombinator.com, Partiful for informal ones, Devpost for submission-style.
Popular events waitlist fast and screen with a short application — your portfolio one-liners
(jim-agent's x402 economy, grocery-buddy on Temporal) are exactly what those forms want.

**"Loop engineering" / "harness" / "agent swarms" naming:** real and current — the scene pivoted
from "build an AI app" to "build/orchestrate autonomous agent systems." This is *literally your
thesis*. You are walking into events themed on the thing you've spent two waves building.

## 3. Blunt expectations (first-timer, 2026 edition)

- **Everyone ships now.** AI codegen made "working demo" the floor — at recent events ~100% of
  teams demo something functional. You will not impress anyone by merely having it work.
  Differentiation moved to problem selection, product judgment, and demo clarity.
- **Judging is 90 seconds to 3 minutes, demo-first, no slides.** A confusing demo of something
  deep loses to a clear demo of something simple. Judges want to feel the problem in 10 seconds
  and see the money moment within a minute.
- **Solo is normal and sometimes an advantage.** "Solo or squad" is literal event copy; solo wins
  at Anthropic events are documented ($15k solo win in 8 hours). Small teams (1-2) win on
  coordination speed. Don't stress about finding a team — but the team-formation window
  (often ~10am-12:30) is itself a networking device; use it even if you build solo.
- **Domain experts are beating engineers.** A lawyer won an Anthropic hackathon; Opus 4.6 winners
  were domain experts, not senior engineers. The meta: bring a vertical you understand, don't
  out-code the room on a generic idea. (Your verticals: payments/trust, energy, civic, music.)
- **The rooms at flagship tier skew pro.** Expect founders, staff engineers, and repeat builders,
  not students. Smaller/vendor events are mixed.
- **Recruiter/VC presence is concentrated, not universal.** YC events (interview-as-prize),
  Afore's "Return of the Agents" ($500k–$2M pre-seed access), and model-provider events (product
  team as judges) are where hiring-adjacent people actually are. AI Tinkerers explicitly bans it.
  Pick events to match the goal of the week.
- **Wrapper fatigue is real.** Judges are openly tired of "ChatGPT wrapper + sponsor API call."
  The 2026 bar for "AI-native" is multi-step agentic behavior — tool use, verification,
  recovery. Your gate-catches-the-failure demos are precision-targeted at this fatigue.
- **The cynical take exists.** A circulating critique (European student event, HN-amplified) says
  AI hackathons reward vibe-coded front-end vaporware with nothing behind it. Not SF-verified,
  but the mood is industry-wide — which is exactly why a *visibly real* mechanism (a gate that
  deterministically blocks a bad action live) reads as refreshing.
- **Operational reality:** bring your own hotspot fallback, pre-pull models/deps, never depend on
  a live login or fresh API quota during the demo. Credits run out; wifi at 200-person events
  is wifi at 200-person events.

## 4. Event selection ladder

1. **Calibrate (this month):** one AI Tinkerers SF night or a Cursor/vendor build night. Zero
   pressure, learn the room's vocabulary, watch demos.
2. **Rep (next 4-6 weeks):** 2-3 mid-tier themed hackathons (agent/harness/MCP-themed Cerebral
   Valley or AGI House events are less oversubscribed than headline model launches). Ship from
   IDEAS.md.
3. **Stretch (apply now, continuously):** Anthropic/Cerebral Valley flagship series + YC events.
   Sub-4% acceptance means apply broadly and early; the application essay is your portfolio
   one-liner.

## 5. Gameplan

### Before (T-7 → T-0)
- Read the event page rules: **boilerplate/pre-existing-code policy** (norms vary and are
  getting explicit — your INGREDIENTS pantry is normally fine if declared, but check), team cap,
  sponsor-prize criteria, judging format.
- Pick the idea from IDEAS.md that matches the event theme + duration. Have a backup one tier
  smaller.
- Run the INGREDIENTS pre-flight (env template, credits, cached deps, logged-in sessions).
- Prepare the 30-second self-intro (§6) — you'll say it 20 times.

### During
- **Hour 0:** `/hack <idea> <duration>` — scaffold + T-minus schedule. Skeleton demo first,
  mocks everywhere, then make it real.
- **Team-formation window:** even going solo, work the room during it. Ask people what they're
  building and *how* — your goal is their insights, and "what harness are you using?" opens
  every conversation at these themed events.
- **Mid-event:** talk to sponsors' engineers (they're bored and technical), and to the people
  whose demos you'll want to ask about later.
- **Demo freeze at the preset checkpoint. Non-negotiable.** Rehearse twice. Pre-open every tab.
- **Pitch order:** problem they can feel (10s) → live money moment ≤60s in — show the gate
  *catching a failure*, not just success (90s) → the one distinctive mechanism (30s) → what
  you'd build next (the conversation hook).
- **After demos:** this is the highest-value networking window — everyone has a shared artifact
  to discuss. Ask the three best demos how they built theirs. Judges linger; ask them one
  specific question about your demo's weakest part.

### After (within 24h)
- Follow up with every real conversation: one line referencing what you discussed + link to the
  repo/demo. LinkedIn or X, whichever they used.
- Capture talking points + lessons in the repo's DEMO.md; run `/update-project` if it should
  land on the portfolio site; consider a Byline-style post — "what I learned about X building Y
  in 10 hours" is exactly consumer-legible builder content.
- Log the event in this folder (what worked, who you met, what the room cared about) — the
  compounding asset is your read on the scene.

## 6. Your unfair advantages (say these out loud)

**30-second intro:** "I build agents where the model proposes and deterministic code disposes —
the gate owns every irreversible action. I've shipped that sixteen ways: a research agent that
pays for its own data over x402 and blocks any uncited claim, a pantry agent on Temporal that's
never allowed to auto-buy, a procurement agent where the card issuer enforces policy so the
model literally can't overspend. Now I'm working on making *fleets* trustworthy — verified
orchestration."

- Events themed "loops/harnesses/swarms" are your home turf; most of the room discovered agent
  orchestration this year. You have ADRs, eval harnesses, and production hours.
- Seven demo-ready projects = seven talking points. Match project to listener: payments person →
  jim/x402/procurement; infra person → Temporal/grocery-buddy; product person → dj-agent/me-2.
- Your job-target map overlaps the judge/sponsor pool (Anthropic judges, Stripe-sponsored
  events, Temporal-adjacent infra crowds). Each event is a warm-intro channel Tier-S/1 can't
  give you through a portal.

## 7. OpenClaw / Hermes fluency (know the lingo, skip the dependency)

Verdict from 2026-07 research: **neither is a gap in your stack; both are vocabulary you should
own.** Details:

- **OpenClaw** (né Clawdbot→Moltbot, Jan 2026): self-hosted personal-agent gateway (messaging
  front-ends, cron, memory, ClawHub skill registry). ~350k stars, 3M+ users, real SF hack-day
  circuit. It is a *life-automation runtime*, not a dev tool — it competes with your jim/grocery
  personal-agent layer, not with Claude Code. Security story is rough: CVEs, 135k+ exposed
  instances, ~12-20% of ClawHub skills found malicious in audits. Its default posture (broad
  allowlists, unvetted public skills) is the anti-pattern your gates exist to prevent — that
  contrast IS your talking point, not a reason to adopt it. Never install ClawHub skills live.
- **Hermes** in builder conversation = **Hermes Agent**, Nous Research's MIT-licensed agent
  framework (Feb 2026, ~40k stars) — self-improving skill loop, MCP-native, has its own
  Nous/NVIDIA/Stripe-sponsored hackathon. Distinct from the older Hermes *model* family (also
  Nous). Disambiguate on first mention; people conflate them.
- **Job-market signal:** a few postings list OpenClaw alongside Claude Code/Cursor as
  "know-the-ecosystem" bullets; none of your target companies require it. Anthropic's
  relationship with third-party harnesses is adversarial (the Apr–Jun 2026 subscription-billing
  whiplash) — worth knowing as an interview-current-events topic.
- **Worth 30 minutes:** read ClawRouter-Hermes (x402 USDC settlement wired into an agent
  runtime) — it overlaps your agentic-payments portfolio directly and is a better use of time
  than standing up either tool.

## 8. Watch-outs

- Application windows close fast; the Life Sciences hackathon deadline was literally same-day as
  this research. Check Luma/Cerebral Valley weekly, apply on sight.
- Team-size caps vary (some cap at 2) — confirm before promising to team up.
- Boilerplate rules vary per event — declare your pantry code; don't assume.
- Don't demo anything requiring live payments/money movement without a testnet/sandbox — your
  own gates should be the demo, not a compliance incident.
