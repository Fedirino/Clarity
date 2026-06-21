// Clarity — Anthropic proxy (Cloud Functions for Firebase, 2nd gen)
//
// Replaces the old Netlify function. Two jobs:
//   1. Keep the Anthropic API key server-side (never reaches the browser).
//   2. Verify the caller is signed in (and, if OWNER_UID is set, is YOU),
//      so nobody who finds the URL can burn your Anthropic credits.
//
// Secrets / config (set via the Firebase CLI — see FIREBASE-SETUP.md):
//   ANTHROPIC_API_KEY  (secret)  — your sk-ant-... key
//   OWNER_UID          (param)   — your Firebase Auth UID (optional but
//                                  recommended; locks the proxy to just you)

const { onRequest } = require('firebase-functions/v2/https');
const { defineSecret, defineString } = require('firebase-functions/params');
const { initializeApp } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
const https = require('https');

initializeApp();

const ANTHROPIC_API_KEY = defineSecret('ANTHROPIC_API_KEY');
const OWNER_UID = defineString('OWNER_UID', { default: '' });

// Only allow the models the app actually uses.
const ALLOWED_MODELS = ['claude-opus-4-6', 'claude-sonnet-4-6', 'claude-haiku-4-5-20251001'];

function anthropicRequest(apiKey, payload) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(payload);
    const req = https.request({
      hostname: 'api.anthropic.com',
      path: '/v1/messages',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'Content-Length': Buffer.byteLength(data),
      },
    }, (res) => {
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => resolve({ statusCode: res.statusCode, body: Buffer.concat(chunks).toString() }));
    });
    req.on('error', reject);
    req.setTimeout(110000, () => req.destroy(new Error('Request to Anthropic API timed out.')));
    req.write(data);
    req.end();
  });
}

exports.claude = onRequest(
  {
    secrets: [ANTHROPIC_API_KEY],
    cors: true,              // allows direct function-URL testing; Hosting calls are same-origin anyway
    timeoutSeconds: 120,     // Opus vision scans finish well under this (note: Hosting caps responses at 60s)
    memory: '256MiB',
    region: 'us-central1',
    maxInstances: 5,         // safety cap so a runaway loop can't fan out
  },
  async (req, res) => {
    if (req.method === 'OPTIONS') { res.status(204).send(''); return; }
    if (req.method !== 'POST') { res.status(405).json({ error: { message: 'Method not allowed' } }); return; }

    // 1. Require a valid Firebase sign-in token.
    const authHeader = req.get('Authorization') || '';
    const match = authHeader.match(/^Bearer (.+)$/);
    if (!match) { res.status(401).json({ error: { message: 'Please sign in first.' } }); return; }

    let decoded;
    try {
      decoded = await getAuth().verifyIdToken(match[1]);
    } catch (e) {
      res.status(401).json({ error: { message: 'Your sign-in expired — please sign in again.' } });
      return;
    }

    // 2. If OWNER_UID is configured, lock the proxy to that one account.
    const owner = OWNER_UID.value();
    if (owner && decoded.uid !== owner) {
      res.status(403).json({ error: { message: 'This Clarity instance is private.' } });
      return;
    }

    // 3. Validate + forward the request.
    const body = req.body;
    if (!body || !ALLOWED_MODELS.includes(body.model)) {
      res.status(400).json({ error: { message: 'Model "' + (body && body.model) + '" not allowed.' } });
      return;
    }
    if (body.max_tokens > 2000) body.max_tokens = 2000;

    try {
      const result = await anthropicRequest(ANTHROPIC_API_KEY.value(), body);
      res.status(result.statusCode).set('Content-Type', 'application/json').send(result.body);
    } catch (err) {
      res.status(502).json({ error: { message: 'Failed to reach Anthropic API: ' + err.message } });
    }
  }
);
