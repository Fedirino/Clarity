# Changelog

All notable changes to Clarity — Pool Assistant.

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
