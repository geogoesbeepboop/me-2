import type { InspectMap } from "./types";

/**
 * The artifact behind each component of ~/dev/dj-agent, distilled into
 * designed blocks — flows, rules, schema maps. Every name, number,
 * threshold and quote is as coded in the repo; nothing illustrative.
 */
export const DJ_AGENT: InspectMap = {
  cur: {
    path: "src/dj/curator.py",
    note: "one track in: segment → analyze → embed → one upsert, under a trace span",
    blocks: [
      {
        kind: "flow",
        title: "Ingesting one track",
        states: [
          { id: "ref", label: "track file", col: 0, row: 0 },
          { id: "seg", label: "segment", col: 1, row: 0 },
          { id: "ana", label: "analyze", col: 2, row: 0 },
          { id: "emb", label: "embed (clap)", col: 3, row: 0 },
          { id: "up", label: "one upsert", col: 3, row: 1, kind: "terminal" },
        ],
        transitions: [
          { from: "ref", to: "seg" },
          { from: "seg", to: "ana", label: "beat grid + sections" },
          { from: "ana", to: "emb", label: "bpm · key · lufs" },
          { from: "emb", to: "up", label: "track + section vectors" },
        ],
      },
      {
        kind: "rules",
        items: [
          {
            name: "idempotent",
            detail:
              "the upsert is one statement, on-conflict by path — re-ingesting a track updates it, never duplicates it.",
          },
          {
            name: "sections are first-class",
            detail:
              "every section gets its own LUFS measurement, its own CLAP vector, its mix-in/mix-out/loopable flags — written in the same upsert as the track.",
          },
          {
            name: "traced",
            detail:
              "the whole ingest runs under a curate-track span with section count and detector source in the metadata.",
          },
        ],
      },
    ],
  },

  seg: {
    path: "src/dj/audio/segment.py",
    note: "the detector cascade, plus the octave fold that fixes librosa's half/double tempo",
    blocks: [
      {
        kind: "flow",
        title: "The detector cascade — never raises",
        caption: "dashed = degradation path, taken on any detector failure",
        states: [
          { id: "in", label: "audio file", col: 0, row: 0 },
          { id: "a1", label: "all-in-1 detector", col: 1, row: 0 },
          { id: "lib", label: "librosa fallback", col: 1, row: 1 },
          { id: "one", label: "single section", col: 1, row: 2, kind: "terminal" },
          { id: "out", label: "structure", col: 2, row: 0, kind: "terminal" },
        ],
        transitions: [
          { from: "in", to: "a1" },
          { from: "a1", to: "out", label: "beat grid + sections" },
          { from: "a1", to: "lib", label: "fails", dashed: true },
          { from: "lib", to: "out", label: "estimate" },
          { from: "lib", to: "one", label: "fails — whole file", dashed: true },
        ],
      },
      {
        kind: "rules",
        title: "The octave fold",
        items: [
          {
            name: "the bug it fixes",
            detail:
              "librosa's beat_track frequently reports half or double tempo — 62 for a 124 track, 70 for 140.",
          },
          {
            name: "the band",
            value: "84 – 184 bpm",
            detail:
              "estimates fold by doubling/halving until they land in [84, 184) — the range DJs actually count in.",
          },
          {
            name: "why 184",
            detail:
              "the band runs high so genuinely fast genres — DnB and jungle at ~170–180, footwork at ~160 — are NOT mistakenly halved. Only true octave errors fold.",
          },
        ],
      },
    ],
  },

  ana: {
    path: "src/dj/audio/analyze.py",
    note: "bpm, key → camelot, and cross-track lufs from one waveform",
    blocks: [
      {
        kind: "steps",
        title: "Features from one mono waveform",
        items: [
          { name: "bpm", tag: "gate", detail: "the detector's value when present; otherwise an octave-corrected librosa estimate" },
          { name: "key → camelot", tag: "gate", detail: "chroma CQT averaged, Krumhansl correlation over 12 rotations, pitch class + mode mapped to the Camelot wheel" },
          { name: "loudness", tag: "gate", detail: "integrated LUFS — the cross-track-comparable measure, not raw RMS" },
          { name: "energy curve", tag: "gate", detail: "RMS downsampled to a fixed-length normalized arc, for display and arc-fitting" },
        ],
      },
      {
        kind: "note",
        text: "Pure signal processing — no model anywhere in analysis. The core function takes a waveform, not a path, so the whole feature extractor is testable without audio files.",
      },
    ],
  },

  taste: {
    path: "src/dj/taste/propagate.py",
    note: "spreads my hand-written labels across the library via clap neighbors",
    blocks: [
      {
        kind: "steps",
        title: "A provisional taste vector for an untagged track",
        items: [
          { name: "find acoustic neighbors", tag: "gate", detail: "top-k (k = 8) tagged tracks by CLAP cosine similarity" },
          { name: "weight by similarity", tag: "gate", detail: "negative similarities clipped to zero; weights normalized — nothing is learned from a dissimilar track" },
          { name: "blend their taste", tag: "gate", detail: "similarity-weighted average of the neighbors' 384-d taste vectors, re-normalized" },
          { name: "carry a confidence", tag: "gate", detail: "the weighted mean neighbor similarity (0–1) rides along — downstream can discount weak propagation" },
        ],
      },
      {
        kind: "kv",
        items: [
          { k: "k", v: "8 neighbors" },
          { k: "taste dim", v: "384" },
          { k: "no neighbors similar", v: "returns None — nothing to learn from" },
        ],
      },
      {
        kind: "note",
        text: "My hand-written taste notes embed to 384-d vectors (taste/embed.py); propagation gives every untagged track a provisional rating and vector from its tagged acoustic neighbors — taste_source records 'manual' vs 'propagated' so the two are never confused.",
      },
    ],
  },

  store: {
    path: "src/dj/vibe/schema.sql",
    note: "both vectors live on the same tracks row; sections are first-class rows",
    blocks: [
      {
        kind: "schema",
        title: "The vibe store",
        caption:
          "pgvector — GENERAL taste (CLAP, shared with text) and MY taste (384-d) on the same row; sections carry their own vibe.",
        tables: [
          {
            name: "tracks",
            note: "one row per audio file",
            col: 0,
            row: 0,
            columns: [
              { name: "id", type: "BIGSERIAL", key: "pk" },
              { name: "path", type: "TEXT UNIQUE" },
              { name: "bpm", type: "REAL · downbeat-derived" },
              { name: "camelot", type: "TEXT" },
              { name: "loudness_lufs", type: "REAL · comparable" },
              { name: "embedding", type: "vector(512) · CLAP" },
              { name: "taste_note", type: "TEXT · nullable" },
              { name: "taste_vec", type: "vector(384) · nullable" },
              { name: "taste_source", type: "manual · propagated" },
            ],
          },
          {
            name: "sections",
            note: "many per track · UNIQUE (track_id, idx)",
            col: 1,
            row: 0,
            columns: [
              { name: "id", type: "BIGSERIAL", key: "pk" },
              { name: "track_id", type: "BIGINT", key: "fk", ref: "tracks" },
              { name: "embedding", type: "vector(512) · THIS section" },
            ],
          },
        ],
        relations: [
          {
            from: "sections",
            to: "tracks",
            label: "track_id · ON DELETE CASCADE",
          },
        ],
      },
      {
        kind: "kv",
        items: [
          { k: "ann index", v: "hnsw · vector_cosine_ops" },
          { k: "vibe dim", v: "512 (CLAP)" },
          { k: "taste dim", v: "384" },
        ],
      },
      {
        kind: "note",
        text: "Two vector spaces on one row: the 512-d CLAP space is shared with text, so a typed brief can search audio; the 384-d taste space is mine alone. Sections having their own 512-d vectors is what transition matching actually compares.",
      },
    ],
  },

  clap: {
    path: "src/dj/vibe/clap.py",
    note: "one audio load yields the 512-d track vector and every per-section vector",
    blocks: [
      {
        kind: "kv",
        items: [
          { k: "window", v: "~10 s · CLAP's training clip length" },
          { k: "max windows", v: "12 · ~2 min sampled evenly" },
          { k: "output", v: "512-d, L2-normalized" },
          { k: "audio loads per track", v: "1", accent: true },
        ],
      },
      {
        kind: "rules",
        items: [
          {
            name: "track vector",
            detail: "mean-pool ALL windows — the discovery vector (tracks.embedding).",
          },
          {
            name: "section vectors",
            detail:
              "mean-pool only the windows inside each section's (start, end) span — that section's own vibe (sections.embedding).",
          },
          {
            name: "why both",
            detail:
              "averaging a 6-minute track's ambient intro with its peak drop yields a mushy midpoint that represents neither — the parts get their own vectors, and transition matching compares parts.",
          },
        ],
      },
    ],
  },

  arch: {
    path: "src/dj/agents/architect.py",
    note: "the whole llm step: a prompt for arc control points, with a deterministic fallback",
    blocks: [
      {
        kind: "quote",
        text: "Energy is in LUFS (−24 ≈ very quiet warm-up, −6 ≈ peak-time loud). … 4–7 points; position runs 0.0 (first track) → 1.0 (last); BPM and LUFS should rise/fall to match the brief's journey.",
        cite: "the architect prompt, verbatim",
      },
      {
        kind: "steps",
        title: "plan_arc — brief in, arc out",
        items: [
          { name: "model drafts the arc", tag: "model", detail: "JSON only — a name plus 4–7 {position, bpm, lufs} control points" },
          { name: "parse + sanity check", tag: "gate", detail: "unparseable JSON or fewer than 2 points → discarded" },
          { name: "deterministic fallback", tag: "gate", detail: "no model, a failed call, or a failed parse → a coded arc shape; plan_arc never raises" },
        ],
      },
      {
        kind: "note",
        text: "The model's only authority is the shape of the curve — a “slow build” rises gradually, “peak-time” tops out ~70% through, a “wind-down” descends. Everything downstream treats the arc as data.",
      },
    ],
  },

  sel: {
    path: "src/dj/agents/selector.py",
    note: "the generate → verify → revise loop — the critic's notes feed each revision",
    blocks: [
      {
        kind: "flow",
        title: "Selection under a deterministic critic",
        caption: "outlined = the critic — code decides what passes",
        states: [
          { id: "pool", label: "candidate pool", col: 0, row: 0 },
          { id: "gen", label: "model selects", col: 1, row: 0 },
          { id: "ver", label: "evaluate_set", col: 2, row: 0, kind: "gate" },
          { id: "pass", label: "plan passes", col: 3, row: 0, kind: "terminal" },
          { id: "rev", label: "critique → revise", col: 2, row: 1 },
          { id: "fb", label: "best-so-far · greedy", col: 1, row: 1, kind: "terminal" },
        ],
        transitions: [
          { from: "pool", to: "gen", label: "numbered cards" },
          { from: "gen", to: "ver", label: "ordered picks (JSON)" },
          { from: "ver", to: "pass", label: "all thresholds met" },
          { from: "ver", to: "rev", label: "fails", dashed: true },
          { from: "rev", to: "gen", label: "notes appended" },
          { from: "gen", to: "fb", label: "revisions exhausted", dashed: true },
        ],
      },
      {
        kind: "rules",
        items: [
          {
            name: "what the prompt optimizes",
            detail:
              "BPM and LUFS tracking the arc at each position · smooth Camelot transitions · no back-to-back same artist · lean on higher-taste tracks — exactly the dimensions the critic measures.",
          },
          {
            name: "best-so-far, then greedy",
            detail:
              "every revision is scored; if none passes, the best report wins. If the model produces nothing usable at all, a deterministic greedy selection still returns a set — the pipeline never dead-ends.",
          },
        ],
      },
    ],
  },

  critic: {
    path: "src/dj/critic.py",
    note: "the deterministic verifier the selector must pass — no model, just thresholds",
    blocks: [
      {
        kind: "rules",
        title: "The thresholds (deliberately forgiving v1)",
        items: [
          { name: "max_bpm_jump", value: "6.0", detail: "BPM difference between adjacent slots." },
          { name: "max_lufs_jump", value: "5.0", detail: "energy difference between adjacent slots." },
          { name: "min_harmonic_compat", value: "≥ 0.7", detail: "fraction of transitions that are Camelot-compatible." },
          { name: "max_arc_rmse_lufs", value: "≤ 4.0", detail: "RMSE between the set's actual LUFS curve and the arc's target." },
          { name: "max_artist_repeats", value: "0", detail: "back-to-back same-artist transitions allowed." },
          { name: "min_artist_gap", value: "≥ 3", detail: "slots the same artist must be apart." },
          { name: "max_key_run", value: "≤ 4", detail: "consecutive identical-Camelot slots before it's monotonous." },
        ],
      },
      {
        kind: "note",
        text: "passed = harmonic% ≥ 0.7 AND max BPM jump ≤ 6 AND arc RMSE ≤ 4 AND artist repeats = 0. The report carries every measurement, so a failure becomes the critique the next revision is prompted with.",
      },
    ],
  },

  hitl: {
    path: "src/dj/agents/hitl.py",
    note: "the plan rendered as data, then a one-line yes/no before the mixer spends compute",
    blocks: [
      {
        kind: "steps",
        title: "The approval gate",
        items: [
          { name: "render_plan", tag: "gate", detail: "tracklist, sections, arc shape, estimated length vs target, rough-transition flags — the whole set as readable data" },
          { name: "approve?", tag: "human", detail: "“Approve this set for rendering? [y/N]” — a one-line yes/no before any audio is rendered" },
          { name: "render", tag: "io", detail: "only on yes does the mixer start spending compute" },
        ],
      },
      {
        kind: "kv",
        items: [
          { k: "HITL_LEVEL=none", v: "auto-approves (printed, not silent)" },
          { k: "EOF on stdin", v: "treated as no" },
        ],
      },
    ],
  },

  core: {
    path: "src/dj/llm.py",
    note: "the substrate, inlined — agent-core was retired once dj proved its only real consumer",
    blocks: [
      {
        kind: "rules",
        items: [
          {
            name: "tiers, not model ids",
            detail:
              "agents ask for cheap / mid / hard; a config map resolves the tier to an Anthropic model id. No agent hardcodes a model.",
          },
          {
            name: "retries with backoff",
            detail:
              "transient errors retry with exponential backoff; a non-transient error raises immediately.",
          },
          {
            name: "every call logged",
            detail:
              "model, usage, and computed cost land in the generation log on every successful call.",
          },
          {
            name: "the lesson",
            detail:
              "inlined from the retired agent-core substrate (its ADR-0004): dj was the one real consumer, so the ~2 functions dj actually used moved here. Don't maintain a framework for one caller.",
          },
        ],
      },
      {
        kind: "kv",
        items: [
          { k: "provider", v: "anthropic only" },
          { k: "default tier", v: "mid" },
          { k: "prompt caching", v: "on by default" },
        ],
      },
    ],
  },

  mixer: {
    path: "src/dj/mixer.py",
    note: "beatmatch ratio, equal-power crossfade, and the butterworth bass swap",
    blocks: [
      {
        kind: "rules",
        title: "How two tracks join",
        items: [
          {
            name: "beatmatch",
            value: "dst ÷ src",
            detail:
              "the pyrubberband time-stretch rate that matches the incoming track's tempo — >1 means play faster.",
          },
          {
            name: "equal-power crossfade",
            value: "sin² + cos² = 1",
            detail:
              "outgoing fades on a cosine curve, incoming on a sine — total power stays constant through the overlap, so the join never dips or bumps.",
          },
          {
            name: "bass swap",
            value: "high-pass 180 Hz",
            detail:
              "the incoming track is Butterworth high-passed through the overlap so two basslines never clash; the outgoing track owns the low end until the join completes.",
          },
          {
            name: "graceful without scipy",
            detail:
              "no scipy → the swap is skipped but the equal-power crossfade still happens — degraded, never broken.",
          },
        ],
      },
    ],
  },

  wav: {
    path: "src/dj/mixer.py",
    note: "the render tail: robust-peak normalize, then write the .wav",
    blocks: [
      {
        kind: "rules",
        title: "Loudness-preserving normalize",
        items: [
          {
            name: "robust peak",
            value: "99.9th percentile",
            detail:
              "dividing by the absolute max lets one stray transient crush the whole set's level and flatten the energy arc — so the anchor is the 99.9th-percentile sample, not the max.",
          },
          {
            name: "ceiling",
            value: "0.97",
            detail:
              "the robust peak is scaled to 0.97; the rare samples above it are hard-clipped — preserving the arc's relative dynamics at the cost of a handful of clipped overs.",
          },
        ],
      },
      {
        kind: "note",
        text: "The output filename is the arc's name, slugified, into the configured output dir — the deliverable is one rendered .wav of the whole set.",
      },
    ],
  },
};
