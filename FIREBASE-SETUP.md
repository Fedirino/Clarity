# Clarity — Firebase Setup Guide (v3.2.0)

This is the one-time setup to get Clarity running on Firebase, plus how to deploy from now on. Do these **in order**. Total time ~20–30 min.

You already have a Google account and Firebase project, so we'll move fast — but read the **billing** and **OWNER_UID** steps carefully.

---

## What you're standing up

- **Firebase Hosting** — serves `index.html`
- **Cloud Function `claude`** (2nd gen) — proxies Anthropic, key stays server-side
- **Firestore** — stores your pool data at `clarity/{your-uid}`, synced across devices
- **Google Auth** — you sign in once; data + proxy locked to you

The app calls `/api/claude`, which Hosting rewrites to the function (same-origin, no CORS headaches).

---

## Step 0 — Install the tools (once)

You'll need Node.js and the Firebase CLI on your computer (the web GitHub editor can't deploy functions).

```bash
# Install Node 20 if you don't have it: https://nodejs.org
node --version          # should print v20.x or newer

# Install the Firebase CLI
npm install -g firebase-tools

# Sign in (opens a browser)
firebase login
```

---

## Step 1 — Upgrade the project to the Blaze plan

Cloud Functions **require** the Blaze (pay-as-you-go) plan. For a single-user pool tool you'll almost certainly pay **$0/month** — Blaze includes all the free-tier allowances (2M function calls/mo, 50K Firestore reads/day, etc.). You only pay above those, which you won't hit.

1. Firebase console → your project → gear icon → **Usage and billing** → **Details & settings** → **Modify plan**.
2. Choose **Blaze**, link a billing account (credit card).

### Set a budget alert (do this — it's your safety net)

Blaze has no hard spending cap, so add an alert:

1. [console.cloud.google.com](https://console.cloud.google.com) → same project → **Billing** → **Budgets & alerts** → **Create budget**.
2. Amount: **$1** (or whatever makes you comfortable). Set alert thresholds at 50% / 90% / 100%.
3. Save. You'll get an email long before any real charge.

---

## Step 2 — Enable Auth and Firestore

**Authentication:**
1. Console → **Build → Authentication** → **Get started**.
2. **Sign-in method** tab → enable **Google** → pick a support email → Save.

**Firestore:**
1. Console → **Build → Firestore Database** → **Create database**.
2. Choose **Production mode** (our rules file will lock it down properly).
3. Pick a location close to you (e.g. `us-east1` for Connecticut). **This is permanent.**

---

## Step 3 — Get your web config and paste it into index.html

1. Console → gear → **Project settings** → **General** tab → scroll to **Your apps**.
2. If there's no web app yet: click the **</>** (web) icon, give it a nickname ("Clarity"), register. (You do *not* need Firebase Hosting setup from this dialog — we configure that ourselves.)
3. Under **SDK setup and configuration**, select **Config**. You'll see an object like:

   ```js
   const firebaseConfig = {
     apiKey: "AIza…",
     authDomain: "your-project.firebaseapp.com",
     projectId: "your-project",
     storageBucket: "your-project.appspot.com",
     messagingSenderId: "1234567890",
     appId: "1:1234567890:web:abc123",
   };
   ```

4. Open `index.html`, find the `firebaseConfig` block near the top (right after the Firebase `<script>` tags), and replace the `PASTE_…` placeholders with your real values.

> These values are **not secret** — they're meant to ship in the page. Your security comes from the Firestore rules and Auth, not from hiding them.

---

## Step 4 — Point the CLI at your project

Edit `.firebaserc` and replace `PASTE_YOUR_PROJECT_ID` with your actual project ID (the `projectId` from Step 3):

```json
{
  "projects": { "default": "your-project" }
}
```

---

## Step 5 — Set the Anthropic API key as a secret

This stores your key in Cloud Secret Manager — never in code, never in the browser.

```bash
firebase functions:secrets:set ANTHROPIC_API_KEY
# paste your sk-ant-... key when prompted, press Enter
```

---

## Step 6 — Install function dependencies and do a first deploy

```bash
cd functions
npm install
cd ..

# Deploy everything: rules, function, hosting
firebase deploy
```

The first deploy may take a few minutes (it builds the function container). When it finishes, the CLI prints your **Hosting URL** — something like `https://your-project.web.app`.

---

## Step 7 — First sign-in, then lock the proxy to you

1. Open your `.web.app` URL. You'll see the **Sign in with Google** gate. Sign in.
2. The app loads. (On first sign-in it seeds Firestore with whatever was in local state.)
3. Now grab **your UID**: Console → **Authentication → Users** → copy the **User UID** for your account.
4. Lock the proxy to that UID so only you can use it. Create a file `functions/.env` containing:

   ```
   OWNER_UID=your-uid-here
   ```

   Then redeploy the function:

   ```bash
   firebase deploy --only functions
   ```

   (Leaving `OWNER_UID` empty still requires a valid Google sign-in to use the proxy — it just doesn't restrict *which* signed-in account. Setting it to your UID makes it truly yours. The `.env` file is gitignored, so it won't end up in your repo.)

5. Reload the app and confirm chat + a strip scan both work. ✅

---

## Step 8 — (When ready) flip your domain and retire Netlify

Right now Netlify is untouched and still serving your old live site. Once Firebase is confirmed working:

- **Using the default `.web.app` URL?** You're done — just start using it.
- **Have a custom domain?** Console → **Hosting → Add custom domain**, follow the DNS steps, then remove the domain from Netlify.
- Add your custom domain to **Authentication → Settings → Authorized domains** (so sign-in works there too). `localhost`, `.web.app`, and `.firebaseapp.com` are authorized automatically.
- Once confident, delete the Netlify site and the `netlify-old/` folder.

---

## Deploying from now on

Your old workflow was "commit to GitHub → Netlify auto-builds." Firebase is a CLI deploy:

```bash
# After editing index.html or functions:
firebase deploy                      # everything
firebase deploy --only hosting       # just the app (fast, for index.html tweaks)
firebase deploy --only functions     # just the proxy
firebase deploy --only firestore:rules   # just the rules
```

Still commit to GitHub for version history — it just no longer triggers the deploy. (If you want auto-deploy on push later, Firebase has a GitHub Action we can add.)

---

## Troubleshooting

| Symptom | Fix |
|---|---|
| Sign-in popup closes instantly / `auth/unauthorized-domain` | Add the domain under Auth → Settings → Authorized domains. |
| Chat: "Proxy not found" (404) | Function didn't deploy, or rewrite isn't live. Run `firebase deploy`. |
| Chat: "Sign-in problem" (401/403) | Token expired (sign out/in), or `OWNER_UID` doesn't match your UID. |
| Scan times out at ~60s | Hosting caps responses at 60s. Opus scans should finish faster; retry, or reduce image size. |
| Data didn't sync to other device | Confirm you signed in with the *same* Google account; check the browser console for "Cloud sync" warnings. |
| Popup blocked on mobile | We can switch sign-in from popup to redirect — tell me and I'll patch it. |

---

## File map

```
index.html              ← app (Firebase wired in, v3.2.0)
firebase.json           ← hosting + functions + firestore config
.firebaserc             ← your project ID
firestore.rules         ← per-user lockdown
firestore.indexes.json  ← (empty for now)
.gitignore
functions/
  index.js              ← Anthropic proxy (2nd gen, token-verified)
  package.json
  .gitignore
  .env                  ← OWNER_UID (you create this; gitignored)
netlify-old/            ← retired Netlify files (delete once happy)
old-v3_1_6.html         ← archived previous version
CHANGELOG.md
FIREBASE-SETUP.md       ← this file
```
