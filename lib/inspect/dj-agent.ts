import type { InspectMap } from "./types";

/**
 * The artifact behind each component of ~/dev/dj-agent, distilled into
 * designed blocks — sub-graphs, flows, rules, schema maps. The topology
 * shows 12 chunks; clicking one opens the real wiring inside it. Every
 * name, number, threshold and quote is as coded in the repo; nothing
 * illustrative.
 */
export const DJ_AGENT: InspectMap = {
  ingest: {
    path: "src/dj/curator.py",
    note: "one track in — the deterministic analyses fan out, and everything lands as one idempotent transaction",
    blocks: [
      {
        kind: "graph",
        title: "One track, one transaction",
        caption:
          "no model anywhere in ingest — five analyses from one file, one upsert at the end",
        nodes: [
          { id: "src", label: "source file", sub: "local folder · resolved link", col: 2, row: 0 },
          { id: "seg", label: "allin1 sections", sub: "bpm · downbeats · grid-snapped", col: 0, row: 1 },
          { id: "lufs", label: "loudness", sub: "integrated LUFS · pyloudnorm", col: 1, row: 1 },
          { id: "key", label: "camelot key", sub: "chroma → krumhansl", col: 2, row: 1 },
          { id: "clap", label: "clap vectors", sub: "512-d · track + per-section", col: 3, row: 1 },
          { id: "tags", label: "id3 tags", sub: "mutagen · isrc kept", col: 4, row: 1 },
          { id: "up", label: "upsert_track", sub: "1 track row + N section rows", col: 2, row: 2, accent: true },
        ],
        edges: [
          { from: "src", to: "seg" },
          { from: "src", to: "lufs" },
          { from: "src", to: "key" },
          { from: "src", to: "clap" },
          { from: "src", to: "tags" },
          { from: "seg", to: "clap", label: "section bounds" },
          { from: "seg", to: "up" },
          { from: "lufs", to: "up" },
          { from: "key", to: "up" },
          { from: "clap", to: "up" },
          { from: "tags", to: "up" },
        ],
      },
      {
        kind: "steps",
        title: "The link path (ADR 0009) — a pasted URL becomes a library file",
        items: [
          {
            name: "classify",
            tag: "gate",
            detail:
              "pure URL parsing — spotify track/album/playlist/artist, youtube video/shorts/playlist; anything else fails fast, naming what is supported",
          },
          {
            name: "resolve",
            tag: "io",
            detail:
              "spotify gives names, durations and the ISRC — catalog metadata only, never audio",
          },
          {
            name: "match on youtube",
            tag: "gate",
            detail:
              "ytsearch5, scored — duration within ±25 s of the catalog dominates; live / sped-up / cover tokens penalized unless I asked for them",
          },
          {
            name: "fetch → flac",
            tag: "io",
            detail:
              "yt-dlp download, idempotent by video id — re-pasting a playlist pulls only what's new",
          },
          {
            name: "stamp identity",
            tag: "io",
            detail:
              "the rip carries no tags, so the resolved artist / title / ISRC are written onto the file before it hits the same ingest path as a local file",
          },
        ],
      },
      {
        kind: "rules",
        title: "Idempotent, forever",
        items: [
          {
            name: "one transaction",
            detail:
              "the track row upserts ON CONFLICT (path); its old sections are deleted and the new set inserted in the same transaction — re-ingesting updates, never duplicates.",
          },
          {
            name: "sticky signals",
            detail:
              "is_favorite ORs with the existing row and a known ISRC survives a re-ingest that arrives without one — a plain re-run can't erase a taste signal.",
          },
          {
            name: "parked reviews drain",
            detail:
              "a taste review left before the file existed auto-applies on a confident match — ISRC, or unique name plus duration; anything ambiguous stays parked for a one-line manual resolve.",
          },
          {
            name: "keep going",
            detail:
              "one bad file prints FAILED and the run continues — a 40-track playlist never dies on entry 3.",
          },
        ],
      },
    ],
  },

  seg: {
    path: "src/dj/audio/segment.py",
    note: "the detector cascade — allin1 out-of-process, plus the octave fold for librosa's half/double tempo",
    blocks: [
      {
        kind: "flow",
        title: "The detector cascade — never raises",
        caption: "dashed = degradation path, taken on any detector failure",
        states: [
          { id: "in", label: "audio file", col: 0, row: 0 },
          { id: "a1", label: "allin1 cli · subprocess", col: 1, row: 0 },
          { id: "cache", label: "json cache", col: 2, row: 0 },
          { id: "lib", label: "librosa fallback", col: 1, row: 1 },
          { id: "one", label: "single section", col: 1, row: 2, kind: "terminal" },
          { id: "out", label: "structure", col: 3, row: 0, kind: "terminal" },
        ],
        transitions: [
          { from: "in", to: "a1" },
          { from: "a1", to: "cache", label: "per track" },
          { from: "cache", to: "out", label: "beat grid + sections" },
          { from: "a1", to: "lib", label: "fails", dashed: true },
          { from: "lib", to: "out", label: "estimate" },
          { from: "lib", to: "one", label: "fails — whole file", dashed: true },
        ],
      },
      {
        kind: "rules",
        title: "Making allin1 actually run (ADR 0012)",
        items: [
          {
            name: "the problem",
            value: "11.3 GB / 30 s",
            detail:
              "allin1 had never run for real — librosa carried every ingest. The uncompiled CPU attention path materializes full T×T score matrices: 11.3 GB peak for a 30-second clip; a full track OOMs 16 GB.",
          },
          {
            name: "out-of-process",
            detail:
              "the allin1 CLI runs as a subprocess from any Python on PATH, JSON-cached per track — the host venv's torch pins stop mattering.",
          },
          {
            name: "memory-linear attention",
            value: "O(T·k), not O(T²)",
            detail:
              "a vendored pure-torch patch computes the same neighborhood attention windowed — verified to float32 epsilon, and it restores the trained relative positional bias the upstream API migration silently dropped. 30-s clip: 2.07 GB; full track: 5.2 GB.",
          },
          {
            name: "label map",
            detail:
              "allin1's vocabulary folds into the section labels the selector already speaks: start → intro, end → outro, inst → break, solo → bridge.",
          },
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
      {
        kind: "note",
        text: "Key and loudness (analyze.py) are pure signal processing over one mono waveform — chroma CQT correlated against the Krumhansl profiles over 12 rotations for Camelot, pyloudnorm integrated LUFS for cross-track-comparable energy. The core function takes a waveform, not a path, so the whole feature extractor tests without audio files.",
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
              { name: "first_downbeat_s", type: "REAL · grid anchor" },
              { name: "embedding", type: "vector(512) · CLAP" },
              { name: "taste_note", type: "TEXT · nullable" },
              { name: "taste_vec", type: "vector(384) · nullable" },
              { name: "taste_source", type: "manual · propagated" },
              { name: "taste_confidence", type: "REAL · 0–1" },
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
              { name: "label", type: "intro … drop … outro" },
              { name: "energy_lufs", type: "REAL · this section" },
              { name: "is_mixin · is_mixout", type: "BOOLEAN · cue flags" },
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

  taste: {
    path: "src/dj/taste/",
    note: "two spaces, one bridge — my words become vectors, and CLAP neighbors spread sparse labels across the library",
    blocks: [
      {
        kind: "graph",
        title: "The dual taste space",
        caption:
          "512-d hears the track; 384-d speaks my words — propagation bridges them so ~150 hand tags can cover a library",
        nodes: [
          { id: "note", label: "my note", sub: "“dreamy 3am closer” · rating", col: 0, row: 0 },
          { id: "st", label: "sentence model", sub: "all-MiniLM-L6-v2 · 384-d", col: 1, row: 0 },
          { id: "man", label: "manual taste_vec", sub: "confidence 1.0", col: 2, row: 0 },
          { id: "clapsp", label: "clap space", sub: "512-d · what it sounds like", col: 0, row: 1 },
          { id: "nb", label: "k = 8 neighbors", sub: "tagged tracks · cosine", col: 1, row: 1 },
          { id: "prop", label: "propagated taste_vec", sub: "weighted avg · measured confidence", col: 2, row: 1 },
          { id: "blend", label: "blended rank", sub: ".5 acoustic · .4 taste · .1 rating", col: 3, row: 0, accent: true },
          { id: "queue", label: "labeling queue", sub: "most uncertain first", col: 3, row: 1 },
        ],
        edges: [
          { from: "note", to: "st", label: "embeds" },
          { from: "st", to: "man" },
          { from: "clapsp", to: "nb", label: "acoustic similarity" },
          { from: "nb", to: "prop", label: "similarity-weighted" },
          { from: "man", to: "blend", label: "counts in full" },
          { from: "prop", to: "blend", label: "discounted" },
          { from: "nb", to: "queue", label: "far or disagreeing" },
          { from: "queue", to: "note", label: "what to tag next", dashed: true },
        ],
      },
      {
        kind: "rules",
        items: [
          {
            name: "manual beats propagated",
            detail:
              "a label I wrote counts at confidence 1.0; a propagated one counts at its measured propagation confidence (0.5 when unmeasured) — taste_source keeps the two from ever being confused.",
          },
          {
            name: "cold start is acoustic",
            detail:
              "no taste vector → the taste term contributes 0 and ranking falls back to pure acoustic — the intended behavior before enough tags exist (ADR 0003).",
          },
          {
            name: "nothing from dissimilar tracks",
            detail:
              "propagation clips negative similarities to zero before weighting; no positively-similar tagged neighbor → None — nothing to learn from, so nothing is guessed.",
          },
        ],
      },
      {
        kind: "kv",
        items: [
          { k: "blend α · β · γ", v: "0.5 acoustic · 0.4 taste · 0.1 rating", accent: true },
          { k: "taste model", v: "all-MiniLM-L6-v2 · local" },
          { k: "propagation", v: "k = 8 CLAP neighbors" },
        ],
      },
    ],
  },

  prof: {
    path: "src/dj/profiles.py",
    note: "a frozen dataclass table — nine genres plus an open default that is exactly the old behavior",
    blocks: [
      {
        kind: "rules",
        title: "One table, many readers — architect, selector, critic, mixer, set sheet",
        items: [
          {
            name: "open / default",
            value: "6 bpm · 70% · 8 bars",
            detail:
              "max_bpm_jump 6.0 · min_harmonic_compat 0.7 · max_stretch 0.06 · max_xfade_bars 8 · play 120–330 s · 3.5 min per slot — no keyword hit means yesterday's constants.",
          },
          {
            name: "hip-hop",
            value: "12 bpm · 40% · 2 bars",
            detail:
              "max_bpm_jump 12.0 · min_harmonic_compat 0.4 · max_stretch 0.03 — big jumps and key clashes are the genre; blends are quick cuts.",
          },
          {
            name: "house",
            value: "4 bpm · 80% · 16 bars",
            detail:
              "max_bpm_jump 4.0 · min_harmonic_compat 0.8 · max_stretch 0.08 — tight tempo, harmonic discipline, long blends.",
          },
          {
            name: "detection",
            detail:
              "detect(brief) is first-keyword substring matching; --genre overrides. ADR 0013 explicitly rejected an LLM judge — genre stays out of the model's hands.",
          },
        ],
      },
      {
        kind: "note",
        text: "The point isn't the specific numbers — it's that thresholds became data. Changing what 'mixes well' means for a genre is a table edit with a unit test, not a code change scattered across four modules.",
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
          { name: "model drafts the arc", tag: "model", detail: "JSON only — a name plus 4–7 {position, bpm, lufs} control points; the genre profile seeds the BPM band it sees" },
          { name: "parse + sanity check", tag: "gate", detail: "unparseable JSON, fewer than 2 points, or all positions equal → discarded" },
          { name: "deterministic fallback", tag: "gate", detail: "no model, a failed call, or a failed parse → shape_from_brief picks a coded arc; plan_arc never raises" },
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
            name: "the pool",
            value: "k = 60",
            detail:
              "query_vibe_db retrieves 60 candidates by the blended score — the brief embeds through CLAP's text encoder for the acoustic side and the sentence model for the taste side — hard-filtered to the arc's BPM band (±4) with recently-played tracks excluded.",
          },
          {
            name: "play spans, not points",
            detail:
              "each slot plans entry → core → exit: a mix-in-flagged section at or before the core, a mix-out-flagged one at or after, chosen to fill the genre's airtime window. The critic grades the core's LUFS.",
          },
          {
            name: "what the prompt optimizes",
            detail:
              "BPM and LUFS tracking the arc at each position · smooth Camelot transitions · no back-to-back same artist · lean on higher-taste tracks — exactly the dimensions the critic measures.",
          },
          {
            name: "best-so-far, then greedy",
            value: "≤ 3 revisions",
            detail:
              "every revision is scored; if none passes, the best report wins. If the model produces nothing usable at all, a deterministic greedy selection still returns a set — the pipeline never dead-ends.",
          },
        ],
      },
    ],
  },

  critic: {
    path: "src/dj/critic.py",
    note: "the deterministic verifier the selector must pass — no model, just the genre's thresholds",
    blocks: [
      {
        kind: "rules",
        title: "The bars — genres override the jump and harmonic gates",
        items: [
          {
            name: "max_bpm_jump",
            value: "6.0",
            detail: "BPM between adjacent slots — the genre's call: 4.0 techno · 12.0 hip-hop · 14.0 pop.",
          },
          {
            name: "min_harmonic_compat",
            value: "≥ 0.7",
            detail: "fraction of transitions Camelot-compatible — 0.75 techno, 0.8 trance and house, 0.4 hip-hop.",
          },
          {
            name: "max_arc_rmse_lufs",
            value: "≤ 4.0",
            detail: "RMSE between the set's actual LUFS curve and the arc's target — holds for every genre.",
          },
          {
            name: "max_artist_repeats",
            value: "0",
            detail: "back-to-back same-artist transitions — a hard fail in every genre.",
          },
          {
            name: "max_lufs_jump",
            value: "5.0",
            detail: "energy jump between adjacent slots — flags the transition rough; roughness feeds the critique, not pass/fail.",
          },
          {
            name: "min_artist_gap",
            value: "≥ 3",
            detail: "slots the same artist must be apart — soft: surfaced in the notes the next revision is prompted with.",
          },
          {
            name: "max_key_run",
            value: "≤ 4",
            detail: "consecutive identical-Camelot slots before it's monotonous — soft, like the gap rule.",
          },
        ],
      },
      {
        kind: "note",
        text: "Since ADR 0013 the BPM-jump and harmonic bars come from the brief's genre profile; arc-RMSE and the artist rules hold for every genre. The same set with a 7-BPM jump and one key clash passes as hip-hop (12 BPM, 40% harmonic) and fails as house (4 BPM, 80%); that exact case is a unit test. The report carries every measurement, so a failure becomes the critique the next revision is prompted with.",
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
          { name: "render_plan", tag: "gate", detail: "tracklist, sections, arc shape, estimated length vs target, the genre-graded critic report — the whole set as readable data" },
          { name: "approve?", tag: "human", detail: "“Approve this set for rendering? [y/N]” — a one-line yes/no before any artifact is written" },
          { name: "export", tag: "io", detail: "yes writes rekordbox.xml + .m3u8 + the set sheet; only --render makes the mixer spend compute on audio" },
        ],
      },
      {
        kind: "kv",
        items: [
          { k: "HITL_LEVEL=none", v: "auto-approves (printed, not silent)" },
          { k: "EOF on stdin", v: "treated as no" },
          { k: "either way", v: "the plan + verdict log to set history" },
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

  exp: {
    path: "src/dj/export/",
    note: "the plan is the product — every approval writes three artifacts; the .wav renders on demand",
    blocks: [
      {
        kind: "steps",
        title: "What an approval writes",
        items: [
          { name: "rekordbox.xml", tag: "io", detail: "per-track cues — MIX IN, MIX OUT, and a third hot cue on the core's hit point, each doubled as a memory cue — plus a real TEMPO anchor at the first downbeat, so the decks show the grid the mixer assumed" },
          { name: ".m3u8", tag: "io", detail: "the plain playlist — works in anything" },
          { name: "set sheet", tag: "io", detail: "a printable markdown cue card: track table, per-transition bar counts and blend style (long blend · blend · short blend · quick cut), critic warnings inline" },
          { name: ".wav, on --render", tag: "io", detail: "the automatic mix of the whole set — the only artifact that costs audio compute" },
        ],
      },
      {
        kind: "rules",
        title: "How two tracks join — the render",
        items: [
          {
            name: "beatmatch",
            value: "dst ÷ src",
            detail:
              "the pyrubberband time-stretch rate that matches the incoming track's tempo — clamped to the genre's max_stretch in both planning and render, so a track is never warped past what the genre tolerates.",
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
              "the incoming track is Butterworth high-passed through the overlap so two basslines never clash; without scipy the swap is skipped but the crossfade still happens — degraded, never broken.",
          },
          {
            name: "phrase quantization",
            value: "1 · 2 · 4 · 8 · 16 · 32",
            detail:
              "crossfade bars — half the outgoing section — quantize DOWN to a power of two and cap at the genre's blend limit, so joins land on phrase boundaries: 2-bar cuts for hip-hop, 16-bar blends for house.",
          },
        ],
      },
      {
        kind: "note",
        text: "The render tail normalizes on a robust peak — the 99.9th-percentile sample scaled to a 0.97 ceiling, rare overs hard-clipped — because dividing by the absolute max lets one stray transient crush the whole set's level and flatten the energy arc.",
      },
    ],
  },

  verify: {
    path: ".claude/gate.sh",
    note: "the fast gate, the eval scorecard, and the set history — what the bench checks, and what it still doesn't",
    blocks: [
      {
        kind: "rules",
        title: "The gate — on every commit",
        items: [
          {
            name: "ruff + 256 fast tests",
            value: "~19 s",
            detail:
              "runs on git commit via the guard-commit hook — no DB, no network, no audio fixtures, no model downloads. The 4 tests that pull CLAP/sentence weights are marked slow and deselected.",
          },
          {
            name: "hermetic by design",
            detail:
              "every external — DB, models, yt-dlp, audio libs — sits behind an injectable seam or a lazy import, so the whole planning stack tests with fakes.",
          },
        ],
      },
      {
        kind: "rules",
        title: "The scorecard (evals/runner.py)",
        items: [
          {
            name: "taste-match",
            detail:
              "mean cosine of the set's taste vectors to the centroid of my hand-labeled favorites — does this set sit where the music I love sits?",
          },
          {
            name: "discovery ratio",
            detail:
              "fraction of the set I had NOT already labeled or favorited — a good set is mine and still shows me something new.",
          },
          {
            name: "the deterministic half",
            detail:
              "BPM continuity, harmonic-compat %, energy-arc RMSE and artist spacing come straight from the Critic's SetReport — the verifier is the scorecard, unchanged.",
          },
          {
            name: "the A/B",
            detail:
              "compare_to_acoustic_baseline builds the same brief blended vs CLAP-only (taste off); greedy selection makes the A/B run with no API key. The blended set has to win on taste-match.",
          },
        ],
      },
      {
        kind: "kv",
        title: "set_history.jsonl — every generated set",
        items: [
          { k: "record", v: "brief · full plan · approval verdict — no model id, no prompt version, no offline/live flag" },
          { k: "recently played", v: "last 3 sets excluded from the next pool — approved or not" },
          { k: "acceptance metric", v: "approving the plan as data — but the documented run path auto-approves, so the flag is always true" },
        ],
      },
      {
        kind: "rules",
        title: "What the 2026-07-25 audit found missing",
        items: [
          {
            name: "no case set",
            value: "missing",
            fail: true,
            detail:
              "nothing anywhere grades a model's output. The A/B that is supposed to protect the Selector defaults to no model, and its only caller never overrides that — so it measures the greedy path and returns 0 whatever the delta.",
          },
          {
            name: "no trajectory",
            value: "missing",
            fail: true,
            detail:
              "trace() records duration and per-call cost, and it is wired in exactly one place: the curator. The planning stack emits no span, so a revision loop leaves no record of what it tried.",
          },
          {
            name: "no refusal cases",
            value: "missing",
            fail: true,
            detail:
              "candidate titles and artists — sourced from YouTube — are interpolated straight into the Selector's prompt, and the reply is parsed by matching the first bracketed list. Nothing tests what a title written to look like an instruction does.",
          },
          {
            name: "no nightly eval run",
            value: "missing",
            fail: true,
            detail:
              "the gate script became a tracked file on 2026-07-07; there is no evals.sh beside it, so this bench sits out the fleet's nightly eval run.",
          },
        ],
      },
      {
        kind: "note",
        text: "The unlock is a committed fixture library — about 120 track rows and their sections, exported once from the real database. The Selector already takes an injected toolbelt, so a fixture toolbelt makes the whole pipeline run offline with no credentials, which is the single change that lets the suite run anywhere.",
      },
    ],
  },
};
