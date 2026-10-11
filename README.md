# Clarity — Personal Pool Maintenance Co-Pilot

A single-file web app that helps an inground swimming-pool owner maintain water
chemistry with a personal AI co-pilot. You scan test strips with your phone
camera, Clarity reads them with GPT-4o vision, tracks your chemistry over time,
learns your pool's patterns, and gives advice specific to *your* pool.

**Live app:** https://clarity-pool.web.app

**Core rule: Clarity can never lie — only accurate results.** Every displayed
number is either a real reading, a deterministic computation from real readings
(with its inputs stated), or an AI estimate wearing an honest confidence %.

---

## Stack

| Piece | What it does |
|-------|--------------|
| `index.html` | The entire app — single-file SPA, no build step |
| Firebase Hosting | Serves the app; rewrites to the Cloud Function (retired) |
| Firestore | Per-user data at `clarity/{uid}`, security rules lock each user to their own doc |
| Google Auth | Sign-in gate; everything is tied to the signed-in account |
| OpenRouter | API proxy for GPT-4o (strip scanning) + Qwen 3.5 9B (chat) |
| Open-Meteo + Zippopotam | Free, keyless weather + ZIP geocoding, called client-side |

The OpenRouter key lives in the browser (localStorage) — the app calls
OpenRouter directly from the client. There is no server-side function.

---

## What it does (current)

- **Dashboard** — animated Pool Health ring (deterministic 0–100 score),
  swim-safety verdict with the *reason*, Weather Watch (real forecast → pool
  cautions), "What Clarity Knows" (learned beliefs with confidence % and a
  verified forecast track record), current readings with ideal-range gauges,
  trend sparklines with delta-vs-last-test, computed insights, recent actions.
- **Chat** — strip scans via GPT-4o vision with per-pad confidence %, a visual
  results card with dosing scaled to your gallons, and an agent layer that can
  *propose* bookkeeping actions (log a dose, add a reminder…) which only your
  ✓ tap actually saves.
- **Chemistry** — manual entry of the 6 readings (FC, TC, pH, TA, CH, CYA) with
  a deterministic dosing engine.
- **History** — every test with scorecard, expandable dosing detail, action +
  notes tracking, per-test delete, and one-tap **CSV export**.
- **Schedule** — editable maintenance tasks with due badges and browser/PWA
  **notifications** at a time you choose.
- **Pool Model** — Clarity learns FC decay rate, pH drift, and testing rhythm
  from your history, makes chlorine forecasts, then *checks its own forecasts*
  against your next real test and adjusts its confidence.

---

## Agent patterns

Clarity isn't just an AI feature — it uses agentic patterns throughout:

- **Propose and confirm (human-in-the-loop)** — the chat's agent layer can
  propose bookkeeping actions (log a dose, add a reminder…), but nothing is
  saved until you tap ✓. The agent suggests multi-step actions; the human
  approves each one.
- **Forecast, verify, adjust** — the pool model learns your FC decay rate, pH
  drift, and testing rhythm, makes chlorine forecasts, then checks its own
  predictions against your next real test. Hits and misses are shown, and
  misses lower confidence. The system evaluates itself against ground truth.
- **Honest uncertainty** — every reading and belief carries a confidence %.
  When there isn't enough data, Clarity says what it still needs instead of
  guessing. Uncertainty is a number, never fake precision.
- **Strip scanning** — every pad is read via GPT-4o vision with a per-pad
  confidence %. Single call, one model, cheapest path.
- **Threshold-gated cross-model verification** — if a scan's lowest per-pad
  confidence drops below `STRIP_VERIFY_THRESHOLD` (default 70%), Clarity sends the
  *same photo* to a **different-model-family** auditor (`STRIP_MODEL_VERIFIER`,
  default `google/gemini-3.1-pro-preview`) over the same client-side OpenRouter
  path. The auditor does **not** re-read the strip — it reports only disagreements,
  each with its own reading and confidence (and a low confidence when a pad is too
  pale/blurred to judge, never fake precision). Above the threshold the flow is
  unchanged: one call, same cost. The verifier is best-effort — a failure never
  fails the primary scan.
- **Disputes are surfaced, never silently overwritten.** For each disputed pad the
  results card shows *both* readings with *both* confidences, flagged for the owner
  to decide; a "🔀 Cross-checked · N pads disputed" indicator appears whenever the
  audit ran. No model ever silently edits another model's number.

---

## Deploy

Hosting auto-deploys on every push to `main` via GitHub Actions
(`.github/workflows/deploy.yml`, needs the `FIREBASE_SERVICE_ACCOUNT_CLARITY_POOL`
secret). Manual deploy:

```bash
cd ~/Clarity
git fetch origin && git reset --hard origin/main
firebase deploy --only hosting --project clarity-pool
```

Verify with a cache-bust URL: `https://clarity-pool.web.app/?fresh=NNN`

---

## Repo map

```
index.html                   ← the full app
sw.js                        ← service worker (task notifications)
firebase.json                ← hosting + rewrites + Firestore config
firestore.rules              ← per-user data lock
manifest.webmanifest + icons ← installable PWA
CHANGELOG.md                 ← full version history
```

---

## Design / brand

Dark aquatic theme with a living-water animated background, glass cards, and
aqua/teal glow accents. Outfit (body) + DM Mono (mono). Logo = outlined droplet
with a waterline (Minimal Monoline); assistant avatar = water drop wearing
goggles. Installable PWA with full-bleed maskable icons. All decorative motion
respects `prefers-reduced-motion`.

---

## Truthfulness principles

- Strip readings always carry a per-pad confidence % — uncertainty is a number,
  never fake precision and never a blanket refusal.
- Beliefs and forecasts are computed only from real logged history; when there
  isn't enough data, Clarity says what it still needs instead of guessing.
- Forecasts get verified against the next real reading — hits and misses are
  shown, and misses lower confidence.
- Weather cautions come from a real forecast (attributed), never invented.