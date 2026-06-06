# Changelog

All notable changes to Clarity — Pool Assistant.

---

## [1.5.2] — 2026-06-06

### Fixed — Serverless function dropping image payloads
- **Root cause: `req.write(string)` silently truncating multi-MB payloads** — The Netlify serverless function (`claude.js`) forwarded the request body to Anthropic by calling `req.write(JSON.stringify(payload))` with a raw string. For large payloads (a base64-encoded JPEG inside a JSON wrapper easily exceeds 1–2 MB), Node's `https.request.write(string)` can silently truncate the data, causing Anthropic to receive a malformed or image-less request. Fixed by converting the JSON string to a `Buffer` before writing: `req.write(Buffer.from(...))`. Buffer writes are byte-exact at any size.
- **Body size limit was too aggressive** — The old 4 MB gate used `rawBody.length` (string character count), which doesn't account for Netlify's own base64 re-encoding of the body or multi-byte characters. Replaced with `Buffer.byteLength()` and raised the limit to 10 MB.
- **Added `Content-Type: application/json; charset=utf-8`** — Explicit charset ensures the API interprets the payload correctly.
- **Increased request timeout** — Raised from 25 s → 55 s. Vision requests with image payloads take longer for the model to process; 25 s was borderline.
- **Added server-side payload logging** — The function now logs message count, whether an image is present, approximate image size, and the Anthropic response status to Netlify function logs for debugging.
- **Added `messages` array validation** — Returns a clear 400 error if the frontend sends a request without a `messages` array, instead of forwarding a malformed payload.

### Changed
- Version bumped from 1.5.1 → 1.5.2 in footer and settings.
- Old version archived as `old-v1.5.1.html`.

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
