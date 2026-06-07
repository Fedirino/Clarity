# Clarity — Personal Pool Assistant

A single-file web app that helps an inground swimming-pool owner manage water
chemistry, dosing, test history, and maintenance — with an AI assistant powered
by Claude's vision. First portfolio project.

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
index.html                     ← the full app (v1.6.0)
netlify.toml                   ← Netlify config (function path + bundler)
netlify/functions/claude.js    ← serverless proxy (keeps API key safe)
old-v1.5.1.html                ← archived previous version
old-v1.5.0.html                ← archived earlier version
aquachek7wayteststripcolorchart.jpg  ← source of embedded Aqua 7 chart
old-v1.4.1.html                ← archived earlier version
old-v1.4.0.html                ← archived earlier version
old-v1.3.1.html                ← archived earlier version
README.md
CHANGELOG.md
```

---

## What it does (current features)

- **Chat tab** — AI pool assistant (Anthropic API, model `claude-sonnet-4-6`)
  with **full vision**. Attach a photo via 📷 or 📁 and send it — Claude
  analyzes test strips, pool water, equipment, algae, or anything else and
  responds with specific actionable advice. No fake scan pipeline, no JSON
  parsing — the image goes directly to Claude and you get a natural-language
  expert analysis. Suggested-question chips on first load.
- **Chemistry tab** — enter 6 readings (Free Chlorine, Total Chlorine, pH,
  Total Alkalinity, Calcium Hardness, Cyanuric Acid) and get exact chemical
  dosing scaled to pool size. Includes a chloramine check (flags a shock when
  total − free chlorine > 0.5 ppm). An "↧ Last test" button pulls the most
  recent saved readings into the form.
- **History tab** — every test saved locally with a 6-value scorecard. Tap a
  test to expand it and see the dosing instructions for that specific reading.
- **Schedule tab** — fully editable maintenance tasks (add / edit / delete,
  custom name + frequency + interval in days). Sorted by urgency with
  overdue / due-today badges; checking one off resets its next-due date.
- **Pool size** — set in ⚙ settings (gallons); all dosing scales to it.

### How strip analysis works (v1.6.0+)

1. Tap 📷 or 📁 to attach a photo of your **AquaChek 7-Way** strip (even,
   indirect light, no flash).
2. (Optional) type a question — or just hit send.
3. The app sends Claude **two** images: the embedded official Aqua 7 color
   chart, then your strip. Claude reads each pad **against the chart**, reports
   a nearest-swatch value or a bracket between two swatches (never fake
   precision), flags LOW/OK/HIGH, and gives exact dosing for your pool size.
4. If a pad is unclear (glare, shadow, color cast) Clarity says so and skips it
   rather than guessing — and asks for a re-shoot if the whole photo is poor.

The app is locked to AquaChek 7-Way: the exact pad order (Total Hardness at the
tip … Cyanuric Acid nearest the handle) and color→value scale are baked into the
prompt, and the chart image rides along with every request. This is what fixed
the old "confident but wrong" readings — Claude was previously asked to convert
colors to numbers with no reference scale.

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
