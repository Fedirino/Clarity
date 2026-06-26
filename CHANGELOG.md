# Changelog

All notable changes to Clarity — Pool Assistant.

---

## [4.3.1] — 2026-06-26

### Fixed — Image attachment regression — Hotfix

**Overview**: v4.3.0 silently dropped the new user message from `S.messages` during the strip-routing refactor. The send pipeline then reported "Something went wrong attaching the image" because the just-attached image never made it into the recent-history window.

### Fixed
- Restored `S.messages.push(msg)` after the image attachment block so the new user turn (with the image) is actually added to history before the API call assembles the payload.

### Version
- Bumped 4.3.0 → 4.3.1 (hotfix).

---

## [4.3.0] — 2026-06-26

### Changed — Strip scan confidence / cost tuning — Major release

**Overview**: Clarity now uses a cheaper model for clean strip photos and falls back to a stronger model only when the image looks hard. It also scores image quality locally so the app can keep confidence honest while spending Opus only when it really helps.

### Added
- Local image quality scoring for strip photos before sending them to the model.
- Model routing that prefers `claude-sonnet-4-6` on clean strip photos and falls back to `claude-opus-4-6` for low-quality cases.
- Quality-aware prompt context so confidence can stay conservative on noisy images.

### Changed
- Strip scan path now uses a cheaper default model on good photos.
- Confidence behavior still favors honesty over certainty; low-quality images should lower confidence instead of pretending.

### Version
- Bumped 4.2.0 → 4.3.0 (major release).

---

## [4.1.6] — 2026-06-24

### Added — Swim safety reason explanation — Patch Release

**Overview**: The Dashboard now shows **why** the pool is marked as "Do not swim" or "Use caution" below the swim status card. Previously users only saw the status icon and label (🚫 Do not swim / ⚠️ Use caution) with no explanation.

### Changed
- **Swim safety explanation**: When `swimStatus` is not "safe", a new card appears below the status showing the specific reason (e.g., "Chlorine is 0.3 ppm (needs 1+ ppm)" or "pH is 8.2 (too high, needs below 8.0)").
- Logic includes both danger and caution thresholds with clear explanations for each scenario.

### Version
- Bumped 4.1.5 → 4.1.6.

---

## [4.1.3] — 2026-06-21

### Fix — Remove white ring around the app icon (maskable icons) — Patch Release

**Overview**: The v4.1.2 icon was a teal circle on a transparent background. When Clarity was installed, the OS launcher padded that transparent area onto a white plate — producing a white ring around the logo. The app icons are now **full-bleed and maskable**: the teal extends to every edge, so there's no transparent area for the OS to fill, and the launcher crops the icon to its own round/squircle shape with no white border.

### Changed
- `icon-192.png`, `icon-512.png`, `apple-touch-icon.png` re-rendered **full-bleed** (teal to all edges, twin waves centered within the maskable safe zone).
- Manifest icons marked `"purpose": "any maskable"` so launchers use them as adaptive icons (round on phones) instead of plating them.
- The browser-tab favicon stays a round circle (no white-ring issue there).

### Version
- Bumped 4.1.2 → 4.1.3 (icon fix). Both in-app version strings updated.

### Release note
- Installed icons are cached aggressively — remove and re-add/reinstall Clarity to pick up the new icon.

---

## [4.1.2] — 2026-06-21

### Fix — Real app icon (round logo + PWA manifest) — Patch Release

**Overview**: Installed/added to a home screen, Clarity showed the generic Chrome globe instead of its own logo, because the app had **no web app manifest** — so browsers had no icon to use for the installed app. This adds a proper manifest and a real, round Clarity icon (the twin-waves mark filling a teal circle) across every surface: browser tab, iOS home screen, and installed PWA.

### Added
- **Web app manifest (`manifest.webmanifest`)** with name, theme/background colors, `display: standalone`, and PNG icons at 192 and 512 — this is what was missing for installed-app icons.
- **Round Clarity app icons** rendered as real PNGs from the twin-waves brand mark on a teal circle: `icon-512.png`, `icon-192.png`, `apple-touch-icon.png` (180), `favicon-32.png`.
- Linked them in `<head>`: round SVG favicon, PNG favicons, `apple-touch-icon`, and the `manifest` link.

### Changed
- Favicon redesigned from a rounded-square mark to a **filled circle** so it reads as a round logo at every size.

### Version
- Bumped 4.1.1 → 4.1.2 (app icon + manifest). Both in-app version strings updated.

### Release note
- New static assets ship to Firebase Hosting root (served at `/icon-192.png`, `/manifest.webmanifest`, etc.). Hard-refresh or `?fresh=` to clear a cached old favicon.

---

## [4.1.1] — 2026-06-21

### Fix — Location lookup (ZIP codes + "City, State") — Patch Release

**Overview**: The v4.1.0 weather location field used Open-Meteo's geocoder for everything, which silently mishandled the two most common inputs. A US **ZIP code** like `06450` matched a *Spanish* postal code (Quintana de la Serena) instead of Meriden, CT, and a **"City, State"** string like `Meriden Connecticut` returned no match at all (Open-Meteo only accepts a bare city name). Location now resolves correctly for ZIPs and city/state input.

### Fixed
- **US ZIP codes** now resolve via Zippopotam (`api.zippopotam.us`, free, no key, CORS-enabled): a 5-digit entry is looked up directly, so `06450` → Meriden, CT.
- **"City, State" / "City State"** input is now parsed: Clarity searches the city name alone, fetches up to 10 candidates, and disambiguates by the state/region you typed (full name or 2-letter abbreviation, with or without a comma). `Meriden Connecticut`, `Meriden, CT`, and `Meriden, Connecticut` all resolve to Meriden, CT — instead of failing or grabbing the wrong same-named town.
- Plain city names still work and pick the highest-population match (e.g. `Meriden` → Meriden, CT).

### Truthfulness Notes
- Still no fabrication: if neither the ZIP nor the city/state resolves, Clarity shows an honest "couldn't find that location" message rather than guessing a place.
- Verified against the live geocoding APIs (real responses for `06450`, `Meriden Connecticut`, and `Meriden`) before shipping.

### Version
- Bumped 4.1.0 → 4.1.1 (location fix). Both in-app version strings updated.

---

## [4.1.0] — 2026-06-21

### Phase 4 (start) — Weather-Aware Alerts — Minor Release

**Overview**: Clarity now looks at the sky. Add your location once in settings and Clarity pulls the real local forecast and turns it into pool-specific cautions: hot, high-UV days mean free chlorine will burn off faster (test sooner, keep FC near the top of its range); incoming rain means dilution and a likely pH/alkalinity drop (test and rebalance after it passes). The forecast also feeds Clarity's chat, so its advice is weather-aware. Everything is grounded in real data from Open-Meteo — a free, no-API-key, CORS-friendly service called directly from the browser — and if the forecast can't be fetched, Clarity says so rather than guessing.

### Added
- **Weather engine (`fetchWeather` / `geocodeLocation` / `setPoolLocation`)**: client-side calls to Open-Meteo's geocoding + forecast APIs (no key, no Cloud Function change). Location (city/ZIP) is geocoded once and stored in the pool profile (syncs to Firestore); the 4-day daily forecast (max temp, UV index, precipitation amount + probability) is fetched on sign-in and cached for 30 minutes, with a manual refresh.
- **Deterministic alert engine (`computeWeatherAlerts`)**: over the next ~3 days, flags **heat/UV** (≥90°F or UV ≥8 → "hot & sunny"; ≥100°F or UV ≥10 → "scorcher") and **rain** (≥0.3 in or ≥70% chance). Each alert explains the chemistry impact in plain language. All thresholds are fixed constants; no number is invented.
- **"Weather Watch" dashboard card (`renderWeatherCard`)**: shows today's high/UV, the active alerts (amber/coral by severity), or a clean "nothing unusual" note — plus a prompt to set a location when none is saved, and honest error text when the service is unreachable.
- **Location field in settings**: a "Location (for weather alerts)" input; on entry it geocodes and shows the resolved place (📍) or a friendly not-found message.
- **Weather-aware chat context (`buildWeatherContext`)**: the real forecast and active alerts are injected into Clarity's system context, with instructions to make chlorine/pH advice weather-aware without inventing values beyond the forecast.

### Changed
- Dashboard now leads with Weather Watch above the Pool Model card. Chat context order: profile → notes → **weather** → pool model → insights → history.

### Truthfulness Notes
- All weather data is real and attributed ("Forecast via Open-Meteo"); Clarity never fabricates a forecast. Missing fields or a failed fetch produce no alerts and an honest message, never a guess.
- Weather is used to *flag risk*, not to silently rewrite the learned chlorine-decay number — Clarity cautions that decay may run faster in heat rather than inventing a new rate it hasn't verified.
- Location is used only to fetch the forecast.

### Version
- Bumped 4.0.0 → 4.1.0 (Phase 4 begins — weather alerts). Both in-app version strings updated.

### Release note
- The v4.0.0 archive (`old-v4_0_0.html`) should be generated from git during the Cloud Shell deploy. Before committing v4.1.0, while `HEAD` is still v4.0.0: `git show HEAD:index.html > old-v4_0_0.html`.

---

## [4.0.0] — 2026-06-21

### Phase 3 — The Action Set (Clarity becomes an agent) — Major Release

**Overview**: Clarity stops only *talking* and starts *doing the bookkeeping for you* — with your permission, every time. When you tell Clarity you added chlorine, or ask it to remind you to retest, or mention a durable fact about your pool, it now proposes the matching action as an inline **✓ / ✗ confirm chip** right in the chat. Nothing is ever written until you tap ✓ — the model proposes, *the app* performs the write, and it shows you exactly what was saved. This is the line the spec drew between an advisor and an agent: Clarity can now log treatments, set reminders, build your schedule, update your profile, and remember facts you confirm — all without leaving the conversation, and all without inventing anything.

### Added
- **Agent action layer (`parseActions` + `runAction`)**: Clarity proposes actions in a hidden `<!--ACTIONS:[…]-->` block (the same proven pattern as strip `READINGS`). The app parses it, renders confirm chips, and executes locally. Five tools:
  - **`record_action`** — log a dose/treatment (Added Chlorine, Shocked, pH Up/Down, etc.) with amount; attaches to a just-logged reading or creates a treatment entry. Powers effectiveness tracking.
  - **`set_reminder`** — a dated reminder ("retest in 3 days") as a task.
  - **`update_schedule`** — add a recurring maintenance task.
  - **`update_profile`** — save a durable pool fact (sanitizer, surface, equipment…) or a free-text note.
  - **`record_belief`** — note a qualitative fact *you stated* about the pool, stored as an **owner-confirmed observation kept separate from Clarity's measured beliefs**.
- **Confirmation chips in chat (`renderActionChips` / `executeAction` / `dismissAction`)**: every proposed write shows a ✓ Save/Add and ✗ Dismiss control, then collapses to "✓ Done" or "Dismissed". Nothing is saved without your tap.
- **"You've told me" section** in the *What Clarity Knows* card: lists owner-confirmed observations, explicitly labeled as facts you confirmed — distinct from what Clarity measured.
- **Action-aware system prompt + context**: Clarity is instructed to propose actions only when you clearly want them, to never claim something is already saved, and to never fabricate details. Owner-confirmed facts are fed back into context as stated facts (no derived confidence %).

### Changed
- Assistant messages are now parsed for both `READINGS` and `ACTIONS` blocks; the hidden block is stripped from the visible reply.
- Pool Model structure bumped to `version: 3` with a `normalizePoolModel()` migration adding the `observations` array.

### Truthfulness Notes
- **Confirm-before-write everywhere**: the model can only *propose*; the owner's tap performs every write. No silent state changes.
- **No fabricated actions**: Clarity proposes actions only from what you actually said; it never invents amounts, facts, or treatments.
- **Beliefs vs. observations stay separated**: `record_belief` stores owner-stated facts in a distinct list that never receives a measured-confidence %, so the deterministic Pool Model is never polluted by unverified claims.
- **Forecast honesty preserved**: logging a chlorine addition via `record_action` voids any open free-chlorine forecast (it can no longer be fairly judged), keeping the Phase 2 scorecard accurate.

### Version
- Bumped 3.8.0 → 4.0.0 (Phase 3 complete — Clarity is now an agent). Both in-app version strings updated.

### Release note
- The v3.8.0 archive (`old-v3_8_0.html`) should be generated from git during the Cloud Shell deploy (the workspace file-sync truncates this large file locally). Before committing v4.0.0, while `HEAD` is still v3.8.0: `git show HEAD:index.html > old-v3_8_0.html`.

---

## [3.8.0] — 2026-06-21

### Phase 2 — Predict & Verify (the learning loop closes) — Minor Release

**Overview**: This is the milestone where Clarity stops only *describing* your pool and starts *forecasting* it — then holds itself accountable. From the chlorine-decay rate it already learned, Clarity now makes a concrete, dated forecast of where free chlorine is heading ("FC should be about 1.5 ppm by Thu if you don't add chlorine"). When your next test is logged, Clarity checks that forecast against what actually happened, marks it **held** or **missed**, and lets its own hit-rate nudge its confidence up or down. Forecasts are made only when there's a real basis (a learned decay rate **and** a current reading); a forecast that can't be fairly judged — because chlorine was added before the next test — is **set aside (void)**, never scored. Every number is computed deterministically: Clarity narrates, the math decides.

### Added
- **Forecasts (`S.poolModel.predictions`)**: a persistent, capped list of dated free-chlorine forecasts, each storing its baseline reading, the decay rate used, the predicted value, the due date, and — once checked — the actual value, the error, and a status of `open` / `confirmed` / `missed` / `void`. Syncs to Firestore + localStorage with the rest of the model.
- **Prediction engine (`generateFcPrediction`)**: makes at most one open FC forecast at a time, only when a learned decay rate and a current chlorine reading both exist. Also reports how many days until FC reaches the minimum line.
- **Verification step (`verifyPredictions`)**: runs on every new reading. Compares actual FC against the decay-projected expectation (tolerance = max(0.5 ppm, 25%)). Marks the forecast `confirmed`, `missed`, or — if chlorine was added in the meantime — `void`, so an un-judgeable forecast is never counted against the model.
- **Confidence that learns from being checked (`beliefTrackRecord` + `_confAdjFromRecord`)**: a belief's confidence is now nudged by the track record of the forecasts it produced — centered on a 70% hit-rate, weighted by sample size, bounded to roughly −20…+10 points. A belief that keeps producing wrong forecasts *loses* confidence automatically; one that keeps being right gains a little.
- **Forecast scorecard + open forecast on the "What Clarity Knows" card**: shows "Forecasts that held — N/M · P%" with a bar, the result of the last check (✓ held / ✗ off by X ppm / ↩ set aside), and the current open forecast. If there's no decay rate yet, it says so honestly instead of forecasting.
- **Forecast-aware Claude context**: the open forecast, each belief's track record, and the overall accuracy are injected into chat, with explicit instructions never to invent, alter, or pre-confirm a forecast, and to report the accuracy honestly.

### Changed
- `logReading` now closes the loop on every new reading: verify open forecasts → recompute beliefs (now adjusted by track record) → make the next forecast.
- `updatePoolModel` applies the track-record confidence adjustment and generates the next forecast.
- Pool Model structure bumped to `version: 2` with a `normalizePoolModel()` migration so existing v1 models gain the `predictions` array safely.

### Truthfulness Notes
- **No forecast without a basis**: a forecast requires a learned decay rate (2+ chlorine-free intervals) *and* a current reading. Otherwise Clarity says it can't forecast yet.
- **Un-judgeable forecasts are voided, not scored**: adding chlorine before the next test sets the forecast aside rather than counting it as a hit or miss.
- **Accountability is visible**: the scorecard surfaces accuracy so a model that is wrong cannot hide it; confidence moves only on *verified* outcomes.
- All forecast math is deterministic and inspectable; Claude narrates but never produces the numbers.

### Version
- Bumped 3.5.0 → 3.8.0 (Phase 2 complete). Both in-app version strings updated.

### Release note
- The v3.5.0 archive (`old-v3_5_0.html`) should be generated from git during the Cloud Shell deploy (the workspace file-sync truncates this large file locally). Before committing v3.8.0, while `HEAD` is still v3.5.0: `git show HEAD:index.html > old-v3_5_0.html`.

---

## [3.5.0] — 2026-06-21

### Phase 1 — The Pool Model + Chlorine-Decay Bug Fix — Minor Release

**Overview**: Clarity stops being a stateless advisor and starts keeping a living, confidence-rated model of *your* pool. It learns how fast your chlorine fades, how your pH drifts, your testing rhythm, and which parameters chronically run out of range — and it shows you each belief with an explicit confidence percentage and the evidence behind it. Nothing is invented: every belief is computed deterministically from your own test history, confidence is capped below 100% on purpose (there's always room for the unknown), and what Clarity *doesn't* yet know is listed plainly under "Still learning." This model is now fed into every chat so Clarity reasons from what it actually knows about your pool, with instructions to treat low-confidence beliefs as tentative.

While building this, a latent accuracy bug surfaced and was fixed (see below) — the chlorine-decay calculation had never actually been running.

### Added
- **Pool Model (`S.poolModel`)**: a persistent, versioned structure holding beliefs (with confidence %, evidence, and detail) and open questions. Syncs to Firestore and localStorage alongside the rest of your data.
- **Belief engine (`computeBeliefs` / `updatePoolModel`)**: deterministic math that derives four kinds of belief —
  - *Chlorine decay* (ppm/day, from chlorine-free intervals, with spread + consistency)
  - *pH behavior* (rising/falling/steady, per-week rate, with direction consistency)
  - *Testing rhythm* (average days between tests, with regularity)
  - *Recurring patterns* (parameters that chronically run high or low)
- **"What Clarity Knows" dashboard card**: shows each belief with a confidence bar (green ≥70%, amber 45–69%, grey <45%), the evidence behind it, a "Still learning" section, and last-updated time. Includes a one-tap **Build my pool model** button (opt-in) and **Refresh** / **turn off** controls.
- **Confidence-aware Claude context (`buildPoolModelContext`)**: the model is injected into every chat with explicit instructions to treat anything under ~60% as tentative and never guess about open questions.

### Changed
- **Opt-in by design**: the model stays empty until you tap "Build my pool model" (requires ≥3 tests). Once enabled, it refreshes automatically before every chat message so Clarity always reasons from current beliefs.
- Chat context now includes the Pool Model ahead of the raw insights and history.

### Fixed
- **Chlorine-decay calculation never ran (latent bug).** Because history is stored newest-first, the elapsed-time delta was computed with the wrong sign (`prev − cur`), making it always negative and silently rejected by the `days > 0` guard. Free-chlorine decay — arguably the most important pattern for a pool — was therefore never computed in the dashboard insights or the chat context. Fixed in all three code paths (dashboard insights, chat insights, and the new Pool Model), and tightened the guard to skip intervals where chlorine was added at *either* endpoint (not just the older one), so additions can't mask the true decay rate.

### Truthfulness Notes
- Beliefs appear only when real evidence supports them (e.g. 2+ chlorine-free intervals, 3+ pH readings); otherwise the topic is listed under "Still learning" rather than guessed.
- Confidence is derived from evidence count + consistency/regularity and is **capped at 90–95%** — Clarity never claims certainty.
- The model is fully inspectable: every belief shows its evidence and the data it's drawn from.

### Version
- Bumped 3.2.0 → 3.5.0 (Phase 1 complete).

---

## [3.2.0] — 2026-06-20

### Move to Firebase + Cloud Sync & Sign-In — Minor Release

**Overview**: Clarity moves off Netlify and onto Firebase, and gains a real backend identity for the first time. Hosting is now Firebase Hosting, the Anthropic proxy is now a 2nd-gen Cloud Function, and your pool data lives in Firestore (synced across devices) instead of only in one browser's localStorage. Access is locked to your Google account: you sign in once, and both your data and the AI proxy are protected — nobody who finds the URL can read your pool history or burn your Anthropic credits. localStorage is kept as a fast local cache, so the app still works instantly and survives brief network blips.

This release is infrastructure groundwork for Phase 1 (the Pool Model, v3.5): with Firestore in place, the Pool Model will persist to the cloud from day one rather than being trapped on a single device.

### Added
- **Firebase Hosting** serves the app (replaces Netlify hosting).
- **2nd-gen Cloud Function** (`functions/index.js`) proxies Anthropic, replacing the Netlify function. Longer timeout (120s function / 60s through Hosting) vs Netlify's 10–25s cap — more headroom for Opus vision scans.
- **Google sign-in gate**: a sign-in overlay covers the app until you authenticate; "Sign in with Google" button, plus a "Sign out" control in Settings.
- **Firestore cloud sync**: pool gallons, history, tasks, notes, and profile mirror to `clarity/{uid}` in Firestore and hydrate on sign-in — your pool follows you across phone and laptop.
- **Token-verified proxy**: the function verifies the caller's Firebase ID token (and, when `OWNER_UID` is set, that it's *you*) before forwarding to Anthropic.
- **Firestore security rules** (`firestore.rules`): each user can read/write only their own document; everything else is denied.
- **Project config**: `firebase.json` (with the `/api/claude` rewrite), `.firebaserc`, `firestore.indexes.json`, `.gitignore`.

### Changed
- **API endpoint**: the app now calls `/api/claude` (a Hosting rewrite to the function) with an `Authorization: Bearer <id-token>` header, instead of `/.netlify/functions/claude`.
- **`persist()`** now writes to both localStorage (immediate) and Firestore (debounced 800ms) via new `persistLocal()` / `cloudPush()` / `cloudHydrate()` helpers.
- **Version** bumped 3.1.6 → 3.2.0 (footer tag + settings panel).

### Security / Truthfulness Notes
- The Firebase web config in `index.html` is intentionally public; security is enforced by Firestore rules + Auth, not by hiding config values.
- The Anthropic API key remains fully server-side, now in Cloud Secret Manager (`ANTHROPIC_API_KEY`) instead of a Netlify env var.
- Setting `OWNER_UID` locks the proxy to a single account — recommended.

### Migration Notes
- Requires the Blaze (pay-as-you-go) plan for Cloud Functions. A single-user pool tool sits comfortably in the free allowance (~$0/mo); a budget alert is recommended as a guardrail.
- The old Netlify files (`netlify.toml`, `netlify/functions/claude.js`) are retired but kept under `netlify-old/` for reference; they can be deleted once Firebase is confirmed working.
- Full step-by-step in `FIREBASE-SETUP.md`.

### Version
- Bumped 3.1.6 → 3.2.0.

---

## [3.1.6] — 2026-06-20

### Route Strip Scans to a Stronger Vision Model — Patch

**Overview**: After five prompt revisions failed to make scanning reliable — while Opus read the very same daylight photo correctly in conversation — the pipeline, not the prompt, became the prime suspect. The app routed every strip scan to `STRIP_MODEL`, which was Claude Haiku (chosen originally for speed). Haiku is the weakest of the three models at vision, and the symptoms throughout (declaring the channel empty, balking at pale pads, capitulating to "the strip is there" with invented readings) are exactly what an under-powered vision model produces on a hard image: faint pads in a channel against a white card, requiring subtle color-matching. The chat path already used Opus and had no trouble reading photos; only the scan path was handicapped.

### Changed
- **`STRIP_MODEL` switched from `claude-haiku-4-5-20251001` to `claude-opus-4-6`** — the strongest available vision model, and specifically the one observed reading the failing photo correctly. This is a one-line change; the serverless proxy already permitted all three models, and the shared system prompt and READINGS parsing are model-agnostic, so no other code changed.

### Rationale
- This is a diagnostic test as much as a fix: using the model already proven to read the photo makes the outcome conclusive. If scans now succeed, the five-round "it won't scan" saga was a model-capability problem, and the current prompt (already substantially improved through v3.1.5) is fine as-is. If a clean photo still fails with Opus, the cause lies elsewhere and the prompt will be reworked from scratch with far better information.
- Cost is not a concern for this single-user personal tool, so Opus is acceptable for scanning. Once accuracy is confirmed, `STRIP_MODEL` can optionally be stepped down to `claude-sonnet-4-6` for faster scans while retaining strong vision.

### Note
- An earlier project assumption held that switching the scan model would require rewriting the serverless function, system prompt, and output parsing. That is not true of the code as it stands — the change is a single constant. The assumption is superseded.

### Version
- Bumped 3.1.5 → 3.1.6 (footer tag + settings panel).

---

## [3.1.5] — 2026-06-20

### Always-Read + Confidence Percentage — Minor Release

**Overview**: After four patches chasing the "it won't scan" problem, the root fix is architectural rather than another anti-refusal nudge: Clarity no longer decides whether to read a strip. It ALWAYS reads every pad and attaches an honest confidence percentage (0–100%) to each. Uncertainty is now expressed as a number, not a refusal. This is strictly more truthful than the old binary read/decline behavior — a 40% reading openly tells the user "retest for certainty" while still giving them something to act on — and it removes the failure modes (false "empty channel," lighting bailouts, flip-flops) that were really just the model picking refusal when unsure.

### Added
- **Per-pad confidence percentages**: Every reading on the results card now shows a confidence % (green ≥70, amber 45–69, grey <45), driven by a new `confidence` object in the READINGS data block.
- **Low-confidence banner**: When any pad drops below 45%, the results card shows a one-line prompt to retest in bright, even daylight with the card flat — guidance, not a refusal.

### Changed
- **Honesty rule reframed** from "never invent / may decline" to "honesty via confidence, not refusal": always give a best estimate per pad and calibrate the percentage to what's genuinely visible. Inventing high-confidence precision, or raising confidence because the user insists, is explicitly forbidden.
- **READINGS block** extended to carry a `confidence` map alongside the six values; it is now required for any strip/card photo.
- **Per-turn image instruction** simplified to "read every pad, give a confidence %, never refuse for quality." The only no-read cases left: not a strip photo, or an image so blurred/dark no guess is possible.
- **Results-card renderer and parser** updated to split out and display confidence; confidence is shown per-read but not persisted to history (history keeps the six clean values).
- **Short-text guidance** now asks Clarity to flag a low-confidence read in one honest line and suggest a retest, while still delivering the numbers.

### Rationale
- A clean outdoor daylight photo confirmed the strip is readable; the remaining problem was the model defaulting to refusal under any uncertainty. Converting uncertainty into a visible percentage resolves the UX complaint and strengthens — rather than compromises — the "Clarity can never lie" principle.

### Version
- Bumped 3.1.4 → 3.1.5 (footer tag + settings panel).

---

## [3.1.4] — 2026-06-20

### Pale Pads Read as "Empty Channel" — Patch

**Overview**: A captured transcript revealed the real failure behind "it's still doing it." Clarity was opening with "the left channel is empty — there's no strip in the slot," then reading the strip correctly only after the user insisted it was there. Root cause: this strip's pads are low-saturation — free chlorine and low total chlorine read near-white, low CYA is pale — and against the card's WHITE channel on a WHITE body they blend in. The model scanned the left edge, saw white-on-white, and concluded the slot was bare. The prior "skip only if plainly, visibly empty" guard then licensed the false refusal.

The same transcript exposed a second, more serious issue: on recovery, Clarity flipped from "channel is empty" straight to six precise readings plus dosing, with no confidence flags — behavior indistinguishable from deferring to the user and generating plausible numbers. That violates the core "Clarity can never lie" principle.

### Fixed
- **Pale pads are no longer mistaken for an empty channel**: The prompt now states explicitly that faint/near-white pads (low free/total chlorine, low CYA) blend with the white channel and are NOT an empty slot. Clarity is told to assume a strip is present, treat "empty" as a rare exception, and look closely for subtle color blocks before ever concluding the channel is bare.
- **"Strip required" guard tightened further**: refusal for an empty channel now requires unmistakably bare plastic with zero pads of any shade.
- **Per-turn image instruction and HOW TO READ step 1** updated with the same pale-pad caveat.

### Added — Anti-Flip-Flop Honesty Guard
- New rule: if Clarity cannot resolve the strip on the first look, it must NOT then produce confident precise numbers just because the user says the strip is there. It re-examines honestly and, if pads are genuinely faint, reports bracketed low-confidence values — never invented certainty. Capitulating to "it's there" with tidy numbers it could not previously see is explicitly named as a form of lying.
- Recovered reads must still carry per-pad confidence levels; pale/low-contrast pads are marked low confidence rather than reported as precise.

### Version
- Bumped 3.1.3 → 3.1.4 (footer tag + settings panel).

---

## [3.1.3] — 2026-06-19

### Read on First Pass — Patch

**Overview**: Scans were still stalling, but with a revealing symptom: Clarity refused on the first attempt, then read the strip correctly the moment the user pushed back. That proves the model CAN read the photo — the problem was purely first-pass behavior. It treated "I'm not fully sure I see the strip" as a reason to ask a clarifying question or request a new photo, instead of just reading. The remaining guards ("if the channel is empty, refuse") gave it too easy an out when it was merely uncertain rather than actually looking at an empty slot.

### Fixed
- **First-pass reading is now mandatory**: When a strip/card photo is attached, Clarity assumes the strip is in the channel, finds it, and returns bracketed values immediately. It is explicitly told NOT to open with a clarifying question or ask for a new photo before attempting.
- **Per-turn image instruction rewritten** to bias hard toward reading: "assume it is there and FIND IT," calibrate against the card, give values now.
- **"Strip required" guard narrowed**: only skips a reading when the channel is plainly, visibly empty (bare slot, no pads). Mere uncertainty about seeing the strip is no longer grounds to refuse — look again and read.

### Rationale
- The model demonstrably reads the same photo correctly once asked, so the fix targets default behavior, not vision capability. Net effect: the cooperative second-attempt behavior is now the first-attempt behavior.

### Version
- Bumped 3.1.2 → 3.1.3 (footer tag + settings panel).

---

## [3.1.2] — 2026-06-19

### Stop Over-Refusing on Lighting — Patch

**Overview**: After the v3.1.1 channel fix, scans were still failing — Clarity kept refusing readings and complaining about lighting on photos a person could read by eye. Root cause: the prompt still carried "ask for a reshoot if the light is poor" instructions left over from before the in-frame-card approach. But the entire reason the card sits in the same photo is that lighting *cancels out* — a warm or dim cast shifts the card and strip together, and Clarity can correct using the card's white border. Those leftover refusal instructions directly contradicted the card's purpose, so Clarity bailed instead of calibrating.

### Fixed
- **Default-to-reading behavior**: Ordinary indoor light, warm/yellow cast, dimness, an angled shot, or sheen on the lamination are explicitly NO LONGER grounds to refuse. If a human could distinguish the swatches, Clarity calibrates against the card and gives a bracketed read, marking confidence "moderate" when light is poor.
- **Refusal narrowed to genuinely unreadable photos**: severe blur, so dark/blown-out that reference swatches can't be told apart, or glare sitting directly on the strip pads. A single obscured pad is skipped; the rest are still read.
- **Honesty rule clarified**: "Honest estimation" now explicitly means a best bracketed read with a confidence level — NOT declining whenever conditions are imperfect. Per-pad "can't read confidently" is reserved for a specific unreadable pad, not the whole photo.

### Version
- Bumped 3.1.1 → 3.1.2 (footer tag + settings panel).

---

## [3.1.1] — 2026-06-19

### Strip-in-Channel Scan Fix — Patch

**Overview**: First real-world test of v3.1.0 revealed the scan failing: the AquaChek SELECT CONNECT card has a built-in **strip channel along its left edge** — you seat the dipped strip in that slot and printed arrows point from each pad to its matching row. v3.1.0's prompt described the strip and card as two separate objects placed side by side, so Clarity read the strip-in-channel as part of the printed card and never identified it as the strip to read. This patch teaches Clarity the card's actual geometry.

### Fixed
- **Scan prompt now models the card's left-edge channel**: Clarity looks for the strip as the vertical column of real pads in the channel on the card's left side, follows each pad's arrow to its parameter row, and reads it against that row's swatches in the same photo.
- **Pad orientation tied to card labels**: top pad = Total Hardness ("END PAD"), bottom pad = Cyanuric Acid ("PAD NEAREST HANDLE"), matching the card's own printed labels, so pad→row mapping is unambiguous.
- **Explicit anti-confusion instruction**: Clarity is told not to mistake the strip in the channel for printed card artwork.

### Changed
- **Guard flipped from "card required" to "strip required"**: since the card holds the strip, the failure mode is now an *empty channel* (card present, no strip). Clarity asks for a photo with the strip seated in the channel instead of guessing, and still suppresses the READINGS block in that case.
- **Welcome message and empty-state copy** updated to instruct sliding the strip into the channel on the card's left edge and photographing the whole card.
- **Per-turn image instruction** updated to match.

### Version
- Bumped 3.1.0 → 3.1.1 (footer tag + settings panel).

---

## [3.1.0] — 2026-06-19

### Reference-Card Calibration for Strip Scanning — Minor Release

**Overview**: Reworks how Clarity reads test strips. Previously it injected a static, embedded color chart image and asked Claude to compare the strip against it — but that reference lived under different lighting than the user's photo, so color matching was unreliable. Now the user places the **physical AquaChek SELECT CONNECT reference card** in the same photo as the dipped strip. Claude calibrates against the card's printed swatches under identical lighting, then reads the strip relative to them. This directly targets the lighting/white-balance variability that was the real accuracy bottleneck (not the model).

### Changed
- **Scan method is now card-in-frame**: The strip and the AquaChek reference card must appear together in one photo, same light. Claude reads pad colors relative to the card's swatches in that exact image.
- **System prompt rewritten** (IMAGES + HOW TO READ sections): Claude now locates the card first, uses it as the color baseline, and corrects for any color cast using the card's neutral areas instead of reporting shifted values.
- **Scale block (`AQUA7_SCALE`) updated** to describe the card as the calibration anchor while preserving the per-pad color→value scales.
- **Onboarding/empty-state and welcome copy** updated to instruct laying the strip on the card and photographing both together in even, indirect light (no flash).

### Removed
- **Embedded reference chart image** (`REF_CHART_B64` / `REF_CHART_MEDIA`) and its injection into the API payload. The physical card replaces it, so the stale embedded image is gone — removing a source of mismatched-lighting comparisons and trimming payload size.

### Added
- **Card-required guard**: If a strip photo arrives without the reference card visible, Clarity does not guess. It explains the card is missing, asks for a re-shoot with the card beside the strip, and suppresses the hidden READINGS block so no fabricated values are recorded. (Non-strip photos — algae, water, equipment — are unaffected.)

### Notes
- Physical AquaChek SELECT CONNECT strips and card have arrived; this release ships the code ready for first real-world testing at home.
- No dosing logic changed in this release. Dosing-accuracy review and the embedded pool-knowledge base remain open follow-ups.

### Version
- Bumped 3.0.0 → 3.1.0 (footer tag + settings panel).

---

## [3.0.0] — 2026-06-11

### Polish & Delight (Phase 5) — Major Release

**Overview**: Clarity v3.0 is the complete personal pool co-pilot. This release adds smart context-aware prompts, export functionality, a "Generate Pool Manual" feature, onboarding nudges, and branding refinements. All five phases of the roadmap are now complete.

### Added
- **Smart Suggested Prompts on Dashboard**: Context-aware question chips based on your current pool state:
  - If FC is low → "How do I raise my chlorine?"
  - If pH is high → "Why does my pH keep rising?"
  - If it's been 3+ days since last test → "Should I test today?"
  - If 5+ readings exist → "How is my pool doing overall?"
  - If 3+ readings exist → "What patterns do you see?"
  - Tapping a prompt navigates to Chat and auto-sends the question to Claude
- **Export Pool Report**: "📋 Export Report" button on Dashboard. Generates a full text report including pool profile, last 20 test readings with statuses, actions, and notes. Copies to clipboard (or downloads as .txt fallback).
- **Generate Pool Manual**: "📖 Pool Manual" button on Dashboard. Sends a detailed prompt to Claude asking it to write a comprehensive, personalized maintenance manual covering: pool specs, ideal ranges, maintenance schedule, chemicals & dosing, seasonal tips, common issues, and observed patterns. Specific to YOUR pool.
- **Onboarding Nudge**: If pool profile is less than 100% complete, a card appears at the bottom of the Dashboard showing progress (e.g. "3/7 fields") with a "Set up →" button linking directly to settings.

### Changed
- **Branding updated**: "Pool Assistant" → "Pool Co-Pilot" throughout (page title, header subtitle)
- **Dashboard enhanced**: Now includes Ask Clarity prompts section, Export/Manual buttons, and onboarding nudge
- **Version bumped** from 2.4.0 → 3.0.0

### Roadmap Complete
- ✅ Phase 1: Pool Profile (v2.1)
- ✅ Phase 2: Enriched History (v2.2)
- ✅ Phase 3: Visual Dashboard (v2.3)
- ✅ Phase 4: Smart Assistant (v2.4)
- ✅ Phase 5: Polish & Delight (v3.0)

---

## [2.4.0] — 2026-06-11

### Smart Assistant (Phase 4)

**Overview**: Clarity now computes patterns from your history data and feeds them to Claude alongside every message. Claude can now reference your FC decay rate, pH trends, test frequency, action effectiveness, and recurring issues — giving data-driven, predictive advice specific to YOUR pool.

### Added
- **`buildInsightsContext()`**: New function that computes and injects the following into every API call:
  - **FC decay rate**: Calculates average ppm/day loss between readings (excluding chlorine additions)
  - **pH trend**: Rising, falling, or stable with actual values
  - **Test frequency**: Average days between tests
  - **Days since last test**: Exact count
  - **Action effectiveness**: Before/after FC comparisons when chlorine was added (with amounts)
  - **Recurring issues**: Parameters that are out of range 3+ times in last 15 tests
  - **Current status**: Which params are ideal vs. out of range

- **Dashboard Insights section**: Visual display of computed patterns:
  - 📉 FC decay rate per day
  - 📈/📉/➡️ pH trend direction with values
  - 🗓️ Average testing frequency
  - 🔁 Recurring issues with counts
  - ⏰ **Next test prediction**: "FC reaches minimum in ~X days — test by then"

- **Enhanced system prompt — PROACTIVE COACHING section**:
  - **Pattern Recognition**: Claude references computed decay rates and drift, not generic advice
  - **Anomaly Detection**: Flags readings that contradict established patterns
  - **Predictive Guidance**: Uses decay rates to predict when next action is needed
  - **Before/After Tracking**: Evaluates whether chlorine additions worked
  - **Recurring Issues**: Addresses root causes, not just symptoms
  - **Test Frequency**: Suggests adjustments based on pool behavior
  - **Seasonal Awareness**: Factors current date + climate + patterns

### Changed
- **System prompt**: Added 7-point PROACTIVE COACHING section with specific instructions for each smart behavior
- **API call**: Now injects `insightsCtx` alongside profile, notes, and history
- **Dashboard**: Added Insights card below Recent Actions showing computed patterns and predictions
- **Version bumped** from 2.3.0 → 2.4.0

### Example Conversations Enabled
- *"Your FC drops ~0.5 ppm/day. At 2.8 now, you'll hit the minimum in about 4 days. Test Wednesday."*
- *"You added 2 lbs chlorine last time and FC rose 1.7 ppm. That dosage works well for your 15k gallon pool."*
- *"pH has been high in 4 of your last 10 tests. With your city water and full sun, this is likely caused by CO₂ offgassing. Consider adding a small amount of muriatic acid weekly as prevention."*
- *"You normally test every 4 days, but it's been 6. With summer heat, I'd test today."*

---

## [2.3.0] — 2026-06-11

### Visual Dashboard (Phase 3)

**Overview**: New Dashboard tab shows your pool's health at a glance — health score, swim safety status, current readings, trend sparklines, and recent actions. Dashboard is now the default landing tab.

### Added
- **Dashboard tab** (new first tab, now the default):
  - **Pool Health Score** (0–100): Based on how many parameters are in the ideal range from your most recent reading. Color-coded green/yellow/red.
  - **Swim Status**: 🏊 Safe to Swim / ⚠️ Use Caution / 🚫 Do Not Swim. Based on Free Chlorine and pH levels.
  - **Last Tested**: Shows days since last test with a "Test now →" quick link to Chat.
  - **Current Readings**: 6-card grid showing each parameter's value, color-coded (green=OK, blue=LOW, coral=HIGH) with ideal range below.
  - **Trend Sparklines**: SVG sparkline charts for FC, pH, and Alkalinity showing last 15 readings with ideal range band highlighted in green.
  - **Recent Actions Timeline**: Last 5 logged actions with dates, amounts, and notes.
  - **Empty state**: Friendly message when no data exists yet, pointing to Chat and Chemistry tabs.
- **`buildSparkline(key, w, h)`**: New function that generates inline SVG sparkline charts from history data. Shows ideal range band, data polyline, and latest-value dot.

### Changed
- **Default tab**: Changed from 'chat' to 'dash' — users land on the dashboard first.
- **Tab order**: Dashboard → Chat → Chemistry → History → Schedule
- **Version bumped** from 2.2.0 → 2.3.0

### Swim Safety Logic
- **🚫 Do Not Swim**: FC < 0.5 ppm OR pH < 6.8 or > 8.0
- **⚠️ Use Caution**: FC 0.5–1.0 ppm OR pH 7.0–7.2 or 7.6–7.8
- **🏊 Safe to Swim**: FC ≥ 1.0 ppm AND pH 7.0–7.8

---

## [2.2.0] — 2026-06-11

### Enriched History (Phase 2)

**Overview**: History entries now track what you DID, not just what the numbers were. Every reading can include the action you took, the amount, and context notes. Claude sees the full cause → effect chain and can tell you what's working.

### Added
- **Action tracking per reading**: Tap a history card to expand it, then tap an action chip:
  - Added Chlorine, Shocked, pH Up, pH Down, Added Alkalinity, Backwashed, Brushed, Added CYA, Nothing
  - Tap again to deselect
- **Amount field**: Optional text field for dosage (e.g. "2 lbs", "1 gal muriatic acid")
- **Notes field**: Optional context per reading (e.g. "pool party Saturday", "heavy rain", "gone for 2 weeks")
- **Action summary on collapsed cards**: Shows a one-line summary (↳ Added Chlorine · 2 lbs · pool party) without expanding
- **Cause → effect in Claude's context**: `buildHistoryContext()` now includes actions and notes. Claude can say "You added 2 lbs chlorine on Jun 8 → FC rose from 1.5 to 3.2 by Jun 10. That's working."

### Changed
- **`logReading()`**: Now initializes `action: null`, `actionAmt: ''`, `notes: ''` on every new entry
- **`renderHistory()`**: Complete rewrite. Cards now show action summary when collapsed, and full action/notes editor when expanded. Click handlers updated to prevent card collapse when interacting with chips/inputs.
- **`buildHistoryContext()`**: Updated prompt instructions to emphasize CAUSE-EFFECT patterns and action tracking
- **History card expand/collapse**: Now triggers on header click only (not whole card), preventing accidental collapse when tapping action chips or typing in fields

### Backward Compatible
- Existing history entries without action/notes fields will work fine (they display as before, with empty action summary)

---

## [2.1.0] — 2026-06-11

### Pool Profile (Phase 1)

**Overview**: Added a full pool profile to Settings so Clarity knows the specifics of your pool. Every API call now includes your pool profile, enabling personalized advice from day one.

### Added
- **Pool Profile fields** in Settings (all tap-to-select chips):
  - Pool size (gallons): 5k–30k options
  - Sanitizer type: Chlorine, Salt, Mineral, Bromine
  - Surface: Plaster, Vinyl, Fiberglass, Pebble/Aggregate
  - Filter: Sand, Cartridge, DE
  - Climate: Hot & Dry, Hot & Humid, Temperate, Cold/Seasonal
  - Sun exposure: Full Sun, Partial Shade, Mostly Shade
  - Water source: City/Municipal, Well
  - Usage: Daily, Few times/week, Weekends only, Seasonal
  - Equipment (multi-select): Heater, Salt Cell, Automation, Cover, UV/Ozone, Robot Cleaner
- **Profile completion indicator**: Shows percentage complete in Settings header
- **`buildProfileContext()`**: New function that generates a structured POOL PROFILE block injected into every API system prompt
- **Profile persistence**: Saved to localStorage via `poolProfile` key
- **Updated welcome message**: Prompts first-time users to set up their pool profile

### Changed
- **Settings panel redesigned**: Expanded from simple gallons selector to full pool profile with all fields
- **System prompt injection**: Now includes pool profile context alongside history and notes
- **Version bumped** from 2.0.0 → 2.1.0
- **Old version archived** as `old-v2_0_0.html`

### Why This Matters
- Claude now knows your pool's sanitizer type, surface, filter, climate, sun exposure, water source, and usage patterns
- Advice is personalized from the first conversation: "Your salt cell should be checked every 3 months" vs. generic "check your equipment"
- Foundation for pattern learning: Claude can now reason about WHY your pool behaves the way it does based on these specifics

---

## [2.0.0] — 2026-06-10

### Major Release: Personal AI Co-Pilot & Opus Integration

**Overview**: Clarity graduates from a "test strip reader tool" to a "personal pool maintenance co-pilot." This release upgrades to Claude Opus for conversational reasoning and personalization, while keeping Haiku for fast image analysis. The system now learns your pool's patterns over time and gives increasingly personalized, anticipatory advice.

### Added
- **Dual-model architecture**: `CHAT_MODEL` (claude-opus-4-6) for reasoning, pattern recognition, and learning; `STRIP_MODEL` (claude-haiku-4-5-20251001) for fast image analysis. The app auto-detects whether a message contains an image and routes to the appropriate model.
- **Coaching/co-pilot system prompt**: Complete redesign of the system prompt. Claude now treats conversations as a collaborative partnership: "You are learning this person's pool alongside them. You remember patterns, anticipate problems, and improve your advice as you learn more over weeks and months."
- **Learning & personalization section in system prompt**: New instructions for Claude to:
  - Compare each new reading to their historical baseline
  - Point out interesting patterns ("Your FC typically drops 0.5 ppm/day in summer heat")
  - Notice anomalies ("This is unusual — did something change?")
  - Ask clarifying questions based on their history
  - Update mental model after each session
  - Anticipate issues and suggest proactive maintenance
- **Foundation for persistent knowledge base**: App now structured to support loading pool profiles and enriched history into every chat (currently in localStorage; future releases will add GitHub persistence).

### Changed
- **Model selection logic in `sendMessage()`**: Added `hasImage` detection. If the API message array contains any image content blocks, routes to Haiku (speed + accuracy for colors). If text-only, routes to Opus (reasoning + learning).
- **System prompt completely rewritten**:
  - Opens with "You are Clarity, a personal pool maintenance co-pilot" instead of "friendly assistant"
  - New "YOUR ROLE" section emphasizing partnership and learning
  - New "LEARNING & PERSONALIZATION" section with 5 key behaviors
  - Tone shifted from prescriptive to collaborative
  - Kept all existing technical instructions for strip reading, image handling, honesty rules
- **Version bumped** from 1.8.0 → 2.0.0 in footer (`<span class="ver-tag">v2.0.0</span>`) and settings panel.
- **Old version archived** as `old-v1_8_0.html`.

### Technical Details
- **No breaking changes**: All existing features work as before (strip scanning, manual entry, history, Chemistry tab, image re-attachment across turns).
- **Chat history transfers seamlessly**: No migration needed.
- **Model allowlist updated in Netlify function** (`netlify/functions/claude.js`): Added `claude-opus-4-6` to `ALLOWED_MODELS`.
- **System prompt injection remains unchanged**: History context still injects via `buildHistoryContext()`; pool notes still injected via `S.poolNotes`.

### Why This Matters
- **Opus reasoning power** enables pattern recognition that Sonnet could not reliably do (e.g., "Your pH rises 0.3/week in summer, but stays stable in winter — here's why").
- **Co-pilot framing** shifts the mental model from "tool" to "partner," encouraging richer conversation and longer-term learning.
- **Fast image analysis** (Haiku for strips) keeps costs down while Opus handles the reasoning-heavy work.
- **Foundation for growth**: This architecture makes it simple to add persistent knowledge bases, GitHub backing, and seasonal guidance in future releases.

### What to Test
- Chat with general questions (should feel more personalized, remember pool context)
- Upload a strip photo (should be read with Haiku quickly)
- Follow-up questions after a strip read (Opus should reason about your specific pool)
- History panel (should load into Opus's context for smarter advice)

---

## [1.8.0]

### Added — Pool Memory & Simplified Readings
- **Pool history context in every API call** — New `buildHistoryContext()` function serializes the last 8 saved test results into a compact text block injected into the system prompt. Claude now sees your past readings and can spot trends, compare to previous tests, and give contextual advice (e.g. "your pH has been running high the last 3 tests — might be an alkalinity issue").
- History context format: `• Jun 8 — FC:3 · TC:3 · pH:7.4 · Alk:100 · Hard:250 · CYA:40 — all OK` with out-of-range flags like `pH:7.8(HIGH)`.

### Changed
- **Simplified strip reading text** — Since v1.7.0's results card handles the visual presentation (gauges, badges, dosing cards), the system prompt now tells Claude to keep strip reading text SHORT: a quick summary sentence, specific fixes for anything off, done. No more listing every parameter line-by-line in text.
- **System prompt restructured** — The verbose "FOR EACH READABLE PARAMETER" block replaced with concise instructions that lean on the visual card. Claude now writes conversationally, not clinically.
- Version bumped from 1.7.0 → 1.7.1 in footer and settings.
- Old version archived as `old-v1.7.0.html`.

---

## [1.7.0] — 2026-06-08

### Added — Chat-to-History pipeline & results UI
- **Strip readings now save to History from Chat** — When Claude reads a test strip photo, it appends structured data to its response. The app parses this into a rich results card with parameter gauges, status badges, dosing instructions, and a **"💾 Save to History"** button — all inline in the chat. This was the #1 missing feature: previously, only manual Chemistry tab entries could be saved.
- **Results card UI** — Chat strip readings now display a visual card below Claude's analysis with: a 3×2 grid of parameters (value + LOW/OK/HIGH badge + gauge), styled dosing instruction cards (matching the Chemistry tab style), and a save button. If all readings are in range, a "water is balanced" confirmation shows instead.
- **`parseReadings()` function** — Extracts hidden `<!--READINGS:{...}-->` JSON from Claude's response text. If parsing fails or the block is absent, the plain text response still displays normally — no data loss.
- **`renderResultsCard()` function** — Generates the inline results card HTML with gauges, dosing, and save button.
- **Version number visible in app** — Shown in the footer input bar and settings panel.

### Changed
- **System prompt updated** — Added `STRUCTURED OUTPUT` instruction telling Claude to append a JSON readings block at the end of strip analysis responses. Uses `null` for unreadable pads, single best-estimate numbers for brackets.
- **`renderChat()` rewritten** — Now detects parsed readings in assistant messages and renders the results card inline. Save buttons wire to `logReading()` and track which messages have been saved.
- **History empty state updated** — Now says "Send a strip photo in Chat or enter readings in Chemistry" instead of only mentioning the Chemistry tab.
- **`max_tokens` raised** from 1800 → 2000 to accommodate the JSON data block in strip analysis responses.
- Version bumped from 1.6.1 → 1.7.0 in footer and settings.
- Old version archived as `old-v1.6.1.html`.

---

## [1.5.1] — 2026-06-05

### Fixed — Anti-hallucination & image reliability
- **Fixed hallucinated strip readings** — Claude was fabricating test strip results when no image was actually attached. Root cause: the system prompt said "you CAN and MUST analyze images" so aggressively that the model invented readings rather than admitting no image was present. Rewrote the vision section with an explicit anti-hallucination guard: "NEVER fabricate readings. If you do not see an image, tell the user."
- **Added image verification pipeline** — `sendMessage()` now verifies base64 data exists and is non-trivial (>100 bytes) before claiming an image is attached. If the image payload is missing or empty, the user gets an explicit error instead of a hallucinated response.
- **Added post-sanitization image check** — After the message array is sanitized for API role-alternation rules, the code now verifies the image survived the sanitization. If it was dropped (e.g. by consecutive-role merging), the user gets an error instead of a text-only request.
- **Added "📷 Image sent" confirmation badge** — Each user message that included an image now shows a green badge with the payload size (e.g. "📷 Image sent (247KB)"). This gives the user visible proof the image made it into the API call.
- **Added error handling to `compressImage()`** — Canvas/blob/FileReader failures now reject the promise with a clear error instead of hanging silently. `img.onerror` is handled. Empty base64 results are caught.
- **Added error handling to `attachImage()`** — If image compression fails, the user sees a chat error message instead of nothing happening.

### Changed
- **Increased image resolution** — `compressImage` max width raised from 900px → 1200px for clearer test strip pad detail.
- **Increased JPEG quality** — from 0.85 → 0.88 to preserve more color accuracy in strip photos.
- **Console logging** — Image processing now logs size, dimensions, and API inclusion to the browser console for debugging.
- Version bumped from 1.5.0 → 1.5.1 in footer and settings.
- Old version archived as `old-v1.5.0.html`.

---

## [1.5.0] — 2026-06-05

### Changed — "Simple First" rewrite
- **Removed fake scan pipeline** — The old flow used a separate `scanStrip()` function that sent the image to a cheaper model (Haiku) with a rigid JSON-extraction prompt, then parsed the JSON into structured result cards and ran a local dosing engine on the parsed values. This produced unreliable "precise-looking" results because JSON extraction from pad colors was fragile. Now every image — test strips included — goes through the normal Claude chat with a strong vision system prompt. Claude analyzes the strip in natural language, gives estimated readings, flags out-of-range levels, and recommends exact chemical amounts. No JSON parsing, no fake precision.
- **Removed calibration system** — The multi-photo calibration flow (photograph your strip bottle's color card, extract a color-to-value mapping, store it in localStorage, inject it into the scan prompt) added complexity without reliability. Removed the entire calibration modal, CSS, and JS. Claude's vision handles any strip brand directly — just send the photo and ask.
- **Removed scan result cards** — The `type:'scan'` chat messages with 6-parameter gauge cards are gone. Strip results now appear as normal assistant messages with human-readable analysis.
- **Removed `SCAN_MODEL` / `STRIP_PROMPT_BASE` / `CAL_PROMPT` / `getStripPrompt()`** — all replaced by a single strong `SYSTEM` prompt that covers both strip analysis and general pool photos.
- **Simplified attachment preview** — removed the "🔬 Scan strip" button. Attach a photo → type a question or just send → Claude analyzes it. One flow, no branching.
- **Simplified input bar** — renamed `.scanbtn` → `.photobtn`, removed scan-busy spinner state. Buttons are just 📷 (camera) and 📁 (upload).
- **Simplified settings** — removed calibration button and status badge. Settings is now just pool size.
- **Raised `max_tokens`** from 1200 → 1500 for richer strip analysis in natural language.
- **Updated system prompt** — comprehensive vision declaration with explicit test-strip analysis instructions (ideal ranges, dosing format, chemical amounts). Includes a `{POOL_SIZE}` placeholder so dosing advice is scaled to the user's pool.
- Welcome message rewritten to focus on the simple workflow: send a photo, get analysis.
- Suggested questions updated (replaced calibration-related chip).
- Version bumped from 1.4.1 → 1.5.0 in footer and settings.
- Old version archived as `old-v1.4.1.html`.

### Removed
- `scanStrip()` function and all scan-specific state (`S.scanning`).
- `updateScanBtn()` function.
- `SCAN_MODEL` constant (no longer using Haiku for a separate scan path).
- `STRIP_PROMPT_BASE`, `CAL_PROMPT`, `getStripPrompt()`.
- Calibration modal HTML (`#calScrim`) and all calibration CSS (`.cal-*` classes).
- All calibration JS: `calPhotos`, `calProcessing`, `openCalibration()`, `renderCalUI()`, `renderCalPreview()`, calibration file-input handlers, `calRunBtn` / `calClearBtn` handlers.
- Scan result rendering in `renderChat()` (the `type:'scan'` message branch).
- `attach-scan` button and CSS.
- `localStorage` key `clarity-calibration`.

---

## [1.4.1] — 2026-06-05

### Fixed
- **"I can't see images" bug** — Root cause: the API `messages` array could start with an `assistant` role (the welcome message) and contain consecutive same-role messages (after filtering out `type:'scan'` results). The Anthropic API requires messages to start with `user` and strictly alternate roles. Added a sanitizer that skips leading assistant messages and merges consecutive same-role messages before sending.
- **System prompt hardened** — Rewrote the vision declaration from a passing mention ("You have VISION") to a `CRITICAL` block that explicitly forbids the model from denying vision capability. Added "Never say you cannot see images" anti-hallucination instruction.

### Changed
- Version bumped from 1.4.0 → 1.4.1 in footer and settings.
- Old version archived as `old-v1.4.0.html`.

---

## [1.4.0] — 2026-06-05

### Added
- **Image analysis in chat** — 📷/📁 buttons now attach photos to your chat message instead of only scanning strips. Ask questions about pool water color, algae, equipment, chemical labels, or anything else and Clarity will analyze the image and respond.
- **Attach preview bar** — shows a thumbnail of the attached image with options to remove it or quick-scan it as a test strip (🔬 Scan strip).
- Images are displayed inline in chat message bubbles.
- Updated system prompt gives the AI full vision awareness: it now knows it can see and analyze pool photos.
- New suggested question: "What can you tell from a photo of my pool?"

### Changed
- 📷/📁 buttons now attach an image for chat; strip scanning is accessed via the 🔬 button on the attachment preview.
- Welcome message updated to mention photo analysis capabilities.
- Chat max_tokens raised from 800 → 1200 for richer image analysis responses.
- Version bumped from 1.3.1 → 1.4.0 in footer and settings.
- Old version archived as `old-v1.3.1.html`.

### Fixed
- AI no longer says "I'm a text-based AI assistant" when sent images — the system prompt now explicitly declares vision capability and the image is sent in the correct multimodal format.

---

## [1.3.0] — 2026-06-05

### Added
- **Netlify serverless function** (`netlify/functions/claude.js`) — proxies all Anthropic API calls so the API key stays server-side and is never exposed to users.
- **Upload button in calibration** — 📷 Camera and 📁 Upload options side by side, so you can pick a photo from your gallery/files instead of only using the camera.
- Server-side safeguards: model allowlist (only Sonnet & Haiku), max_tokens cap (2000), body size limit (~4 MB for base64 images), and clear error when `ANTHROPIC_API_KEY` env var is missing.
- CORS preflight handling for browser requests.

### Changed
- Frontend `callClaude()` now calls `/.netlify/functions/claude` instead of the Anthropic API directly.
- Removed API key input from ⚙ settings — no longer needed since the key lives on the server.
- Version bumped from 1.2.1 → 1.3.0 in footer and settings.
- Old version archived as `old-v1.2.0.html`.
- Updated README with Netlify deployment + env var instructions.

### Security
- API key is now an environment variable on Netlify, never sent to or stored in the browser. Friends can use the app without seeing the key.

---

## [1.2.1] — 2026-06-05

### Fixed
- **AI features now work** — restored direct Anthropic API calls. The previous version tried to call a non-existent Netlify serverless function (`/.netlify/functions/claude`), which caused chat and strip scanning to return errors / placeholder results.
- **API key input restored** in ⚙ settings. Key is stored in localStorage per browser. Includes the `anthropic-dangerous-direct-browser-access` header for direct browser-to-API calls.
- Added specific error message when API key is missing ("Tap ⚙ and paste your Anthropic key").
- Added detection for `authentication_error` responses with a clear "Invalid API key" message.

### Changed
- Version bumped from 1.2.0 → 1.2.1 in footer and settings.
- Old version archived as `old-v1.2.0.html`.

---

## [1.2.0] — 2026-06-05

### Added
- **Test strip calibration** — scan the color reference card from your test strip bottle to calibrate readings to your specific brand. Supports multi-photo capture (up to 4 photos) for cards that wrap around bottles.
- **AquaChek 7-Way default** — strip scanning defaults to AquaChek 7-Way (Aqua 7) value scales and pad order out of the box. No calibration needed if you use this brand.
- Calibration data persists in localStorage and is automatically applied to all future strip scans.
- Calibration preview panel shows detected parameters, value ranges, and brand info.
- "Clear calibration" option to reset to default strip interpretation.
- Calibration status badge shown in settings (Active / Set up).
- Scan results now indicate whether calibration was used and prompt setup if not.
- Created `CHANGELOG.md` for version tracking.
- Old version archived as `old-v1.1.0.html`.

### Changed
- Strip scan prompt is now dynamically generated to include calibration data when available.
- Settings panel expanded with calibration button and status.
- Version bumped from 1.1.0 → 1.2.0 in footer and settings.

---

## [1.1.0] — Initial tracked version

### Features (carried forward)
- AI chat assistant (Anthropic API, Claude Sonnet).
- Chemistry tab with 6-parameter dosing engine scaled to pool size.
- History tab with expandable test cards and per-reading dosing replay.
- Schedule tab with editable maintenance tasks, urgency sorting, and overdue badges.
- Camera and file-upload test strip scanning via Claude vision.
- Pool size selector in settings.
- Dark aquatic theme with wave-crest tab animation.
- PWA meta tags for Add to Home Screen.
- All data stored locally in localStorage.
