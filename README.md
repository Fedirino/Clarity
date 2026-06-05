# Clarity — Personal Pool Assistant

A single-page web app that helps an inground swimming-pool owner manage water
chemistry, dosing, test history, and maintenance — with an AI assistant and a
camera-based test-strip scanner.

---

## Project structure

```
index.html                   ← the entire front-end (no build step)
netlify/functions/claude.js  ← serverless proxy that keeps the API key private
README.md
```

## How to deploy (GitHub → Netlify)

1. **Create a GitHub repo** — push `index.html`, `netlify/functions/claude.js`,
   and this README.
2. **Connect to Netlify** — log in at [app.netlify.com](https://app.netlify.com),
   click "Add new site → Import an existing project", pick your GitHub repo.
   Leave build settings blank (no build command, publish directory = `/`).
3. **Add your API key** — in Netlify go to **Site settings → Environment
   variables → Add a variable**:
   - Key: `ANTHROPIC_API_KEY`
   - Value: your `sk-ant-...` key
4. **Trigger a deploy** — go to **Deploys → Trigger deploy → Deploy site**.
5. **Share the URL** — Netlify gives you a `https://your-site.netlify.app` link.
   Anyone who opens it gets the full app — chat, strip scanning, chemistry,
   schedule — with no API key needed on their end.

### Updating the app

Push changes to GitHub and Netlify auto-deploys within a minute.

---

## What it does

- **Chat tab** — AI pool assistant (Claude via serverless proxy).
  Suggested-question chips on first load.
- **Chemistry tab** — enter 6 readings (Free Chlorine, Total Chlorine, pH,
  Total Alkalinity, Calcium Hardness, Cyanuric Acid) and get exact chemical
  dosing scaled to pool size. Chloramine check flags a shock when
  total − free chlorine > 0.5 ppm.
- **History tab** — every test saved locally with a 6-value scorecard. Tap a
  test to expand and see dosing instructions.
- **Schedule tab** — editable maintenance tasks sorted by urgency with
  overdue / due-today badges.
- **Test-strip scan** — 📷 opens camera, 📁 uploads a photo. Sends to Claude
  vision, parses pad colors into readings, logs them, returns advice.
- **Pool size** — set in ⚙ settings (gallons); all dosing scales to it.

## Architecture

- **Front-end:** single `index.html`, no build step, no dependencies. All
  user state in `localStorage` under `clarity-*` keys.
- **Back-end:** one Netlify Function (`netlify/functions/claude.js`) that
  proxies POST requests to the Anthropic Messages API. The API key lives only
  in Netlify's environment variables — never sent to the browser.
- **No data leaves the device** except the direct proxy calls for chat and
  strip scanning.

## Design / brand

- Dark aquatic theme, aqua/teal palette, Playfair Display + DM Sans + DM Mono.
- Active nav tab fills with an animated wave crest.
- Logo = twin-waves mark; assistant avatar = water drop wearing goggles.
- PWA meta tags for "Add to Home Screen" fullscreen on phones.

## Code map (inside index.html)

- `IDEAL` — the 6 chemistry parameters with ideal ranges + labels.
- `doseAdvice(read, gal)` — deterministic dosing engine.
- `S` — single app-state object; `persist()` saves it.
- `render()` → `renderChat / renderChem / renderHistory / renderSchedule`.
- `callClaude(body)` — POSTs to `/.netlify/functions/claude`.
- `scanStrip(file)` — compresses image, sends to vision, parses JSON.
- Task editor lives in the `#taskScrim` modal.

## Ideas for next steps

- Trend charts in History (chemistry over time).
- Seasonal open/close checklists in Schedule.
- Rate limiting / abuse protection on the proxy function.
- Proper PNG app icons (current icon is SVG; iOS prefers 180×180 PNG).
