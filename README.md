# Clarity — Personal Pool Maintenance Co-Pilot

A single-file web app that helps an inground swimming-pool owner maintain water
chemistry with the help of a personal AI co-pilot. Claude learns your pool's patterns
over time and gives increasingly personalized, anticipatory advice.

**Now powered by Claude Opus** for reasoning, pattern recognition, and learning—while keeping Haiku for fast image analysis.

Everything lives in one file: **`index.html`**. No build step, no dependencies.
Open it in a browser to run it.

---

## How to run

- **Quick look (offline):** double-click `index.html`.
  Chemistry, History and Schedule work offline. Chat and photo analysis require
  the Netlify deployment below.

- **Full features (chat + photo analysis):** deploy to Netlify:
  1. Push this folder to a GitHub repo, or drag the folder onto
     [app.netlify.com](https://app.netlify.com)'s "Deploy manually" drop zone.
  2. In the Netlify dashboard go to **Site settings → Environment variables →
     Add a variable**:
     - Key: `ANTHROPIC_API_KEY`
     - Value: your key (`sk-ant-…`)
  3. Trigger a redeploy (Deploys → Trigger deploy) so the function picks up the
     new variable.
  4. Open the site URL — chat and photo analysis should work immediately.

  The API key lives only on Netlify's server. Anyone you share the URL with can
  use the app without seeing or needing the key.

### File structure

```
index.html                     ← the full app (v2.0.0)
netlify.toml                   ← Netlify config (function path + bundler)
netlify/functions/claude.js    ← serverless proxy (keeps API key safe)
aquachek7wayteststripcolorchart.jpg  ← official color reference (embedded as base64)
old-v1_8_0.html                ← archived previous version
old-v1_7_1.html                ← archived earlier version
old-v1_7_0.html                ← archived earlier version
README.md
CHANGELOG.md
```

---

## What it does (v2.0.0 features)

- **Chat tab — AI Pool Co-Pilot** — Powered by Claude Opus (for reasoning and learning) + Haiku (for image analysis).
  - Attach a photo via 📷 or 📁: Claude analyzes test strips, pool water, equipment, algae, or anything else with specific actionable advice.
  - Ask general questions: Claude remembers your pool's patterns (FC decay rates, pH drift, seasonal behavior) and gives advice tailored to YOUR pool, not generic advice.
  - Learn together: The more you chat, the smarter Claude gets about your specific pool — anticipating problems, recognizing patterns, suggesting proactive maintenance.
  - Full vision: No fake scan pipeline, images go directly to Claude for expert analysis.

- **Chemistry tab** — Enter 6 readings (Free Chlorine, Total Chlorine, pH, Total Alkalinity, Calcium Hardness, Cyanuric Acid) and get exact chemical dosing scaled to pool size. Includes a chloramine check. An "↧ Last test" button pulls the most recent saved readings into the form.

- **History tab** — Every test saved locally with a 6-value scorecard. Tests can be saved directly from chat strip readings (via the "Save to History" button on results cards) or from the Chemistry tab. Claude uses this history to recognize trends and give contextualized advice.

- **Schedule tab** — Fully editable maintenance tasks (add / edit / delete, custom name + frequency + interval in days). Sorted by urgency with overdue / due-today badges.

- **Pool size** — Set in ⚙ settings (gallons); all dosing and advice scales to it.

### How strip analysis works (v1.5.1+)

1. Tap 📷 or 📁 to attach a photo of your test strip.
2. (Optional) type a question — or just hit send.
3. Claude sees the image and reads the pad colors against standard test strip
   scales. It gives you estimated PPM levels for each parameter, flags anything
   out of range, and tells you exactly what chemicals to add and how much (scaled
   to your pool size).

There is no separate "scan" mode, no JSON extraction, and no calibration step.
Claude's vision handles any strip brand directly. This replaced the old
`scanStrip()` pipeline which tried to extract structured JSON from a cheaper
model and often produced unreliable results.

## Design / brand

- Dark aquatic theme, aqua/teal palette, Playfair Display + DM Sans + DM Mono.
- Active nav tab fills with an animated **wave crest**.
- Logo = **twin-waves** mark; assistant avatar = **water drop wearing goggles**
  (used in chat replies + typing indicator).
- Installable: has PWA meta tags + an apple-touch-icon, so "Add to Home Screen"
  opens it fullscreen on phones.

## Data & storage

All state is in browser `localStorage` under `clarity-*` keys: `gallons`,
`history`, `tasks`, `usage`. Nothing leaves the device except the API calls
routed through the Netlify serverless function. The API key is stored only as
a Netlify environment variable.

---

## Code map (inside index.html)

- `IDEAL` — the 6 chemistry parameters with ideal ranges + labels.
- `doseAdvice(read, gal)` — deterministic dosing engine (chemical + amount + why).
- `S` — the single app-state object; `persist()` saves it.
- `render()` → `renderChat / renderChem / renderHistory / renderSchedule`.
- `callClaude(body)` — POSTs to `/.netlify/functions/claude`, which proxies to
  Anthropic. The API key is a server-side environment variable.
- `sendMessage(text)` — sends a chat message, optionally with an attached image
  in multimodal (vision) format. All image analysis (including test strips) goes
  through this single path.
- `attachImage(file)` / `renderAttachPreview()` — image attachment flow: shows
  preview with option to remove.
- `compressImage(file)` — resizes and JPEG-compresses before sending.
- Task editor lives in the `#taskScrim` modal.

## Ideas for next steps (not built yet)

- Trend charts in History (chemistry over time).
- Seasonal open/close checklists in Schedule.
- A timestamp on the "↧ Last test" button.
- Proper PNG app icons (current icon is SVG; iOS prefers 180×180 PNG).
- A written case study / screenshots for the portfolio.

## Note for continuing in a new chat session

This README is the context handoff. The whole app is `index.html` — share that
file (and this README + CHANGELOG) with the new session and ask it to continue
from here.
