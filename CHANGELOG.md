# Changelog

All notable changes to Clarity — Pool Assistant.

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
