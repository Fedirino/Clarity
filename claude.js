// Netlify serverless function — proxies requests to the Anthropic API
// so the API key stays server-side and never reaches the browser.
//
// Set ANTHROPIC_API_KEY in Netlify dashboard:
//   Site settings → Environment variables → Add a variable
//   Key:   ANTHROPIC_API_KEY
//   Value: sk-ant-...
//
// v1.5.2 — Fixed: multimodal (image) messages were silently dropped.
//   Root cause: writing a multi-MB JSON string via req.write() in one shot
//   could truncate the payload. Now writes a Buffer. Also raised the body
//   size limit and added server-side logging for image payloads.

const https = require('https');

// ---------------------------------------------------------------------------
// Forward a request to Anthropic, writing the body as a Buffer to prevent
// silent truncation of large payloads (base64 images can be several MB).
// ---------------------------------------------------------------------------
function anthropicRequest(apiKey, payload) {
  return new Promise((resolve, reject) => {
    // Convert to Buffer FIRST — this guarantees Content-Length is exact
    // and prevents Node from silently mis-encoding or truncating large strings.
    const buf = Buffer.from(JSON.stringify(payload), 'utf-8');

    const req = https.request(
      {
        hostname: 'api.anthropic.com',
        path: '/v1/messages',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'Content-Length': buf.length,      // Buffer.length is always byte-accurate
        },
      },
      (res) => {
        const chunks = [];
        res.on('data', (chunk) => chunks.push(chunk));
        res.on('end', () => {
          resolve({
            statusCode: res.statusCode,
            body: Buffer.concat(chunks).toString('utf-8'),
          });
        });
      }
    );

    req.on('error', (err) => reject(err));
    req.setTimeout(55000, () => {
      req.destroy(new Error('Request to Anthropic API timed out (55 s).'));
    });

    // Write the Buffer — a single .write(Buffer) is safe at any size;
    // the issue was .write(string) on multi-MB strings.
    req.write(buf);
    req.end();
  });
}

// ---------------------------------------------------------------------------
// Quick helper: walk the messages array and report whether any message
// contains an image content block. Used for logging only.
// ---------------------------------------------------------------------------
function describePayload(body) {
  const info = { model: body.model, messageCount: 0, hasImage: false, imageSizeKB: 0 };
  if (!Array.isArray(body.messages)) return info;
  info.messageCount = body.messages.length;
  for (const msg of body.messages) {
    if (Array.isArray(msg.content)) {
      for (const block of msg.content) {
        if (block.type === 'image' && block.source?.data) {
          info.hasImage = true;
          // base64 chars ÷ 1.37 ≈ original bytes
          info.imageSizeKB = Math.round(block.source.data.length / 1.37 / 1024);
        }
      }
    }
  }
  return info;
}

// ---------------------------------------------------------------------------
// Netlify function handler
// ---------------------------------------------------------------------------
exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  };

  // CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: { message: 'Method not allowed' } }),
    };
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: {
          message:
            'ANTHROPIC_API_KEY is not configured. The site owner needs to add it in Netlify → Site settings → Environment variables.',
        },
      }),
    };
  }

  // ------------------------------------------------------------------
  // Decode the request body.
  // Netlify may base64-encode it (especially when it contains binary-
  // like characters or is over ~1 MB). Decode to a UTF-8 string first.
  // ------------------------------------------------------------------
  let rawBody = event.body || '';
  if (event.isBase64Encoded) {
    rawBody = Buffer.from(rawBody, 'base64').toString('utf-8');
  }

  // Size gate — use byte length, not string length, and allow up to 10 MB
  // to comfortably fit a compressed JPEG in base64 inside a JSON wrapper.
  const bodyBytes = Buffer.byteLength(rawBody, 'utf-8');
  if (bodyBytes > 10 * 1024 * 1024) {
    return {
      statusCode: 413,
      headers,
      body: JSON.stringify({
        error: { message: `Request too large (${(bodyBytes / 1048576).toFixed(1)} MB; limit 10 MB).` },
      }),
    };
  }

  // ------------------------------------------------------------------
  // Parse JSON — the entire messages array (including any nested image
  // content blocks with base64 data) must survive this round-trip:
  //   frontend JSON.stringify  →  network  →  JSON.parse here  →
  //   JSON.stringify in anthropicRequest  →  Buffer  →  Anthropic API
  // ------------------------------------------------------------------
  let body;
  try {
    body = JSON.parse(rawBody);
  } catch (e) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({
        error: { message: 'Invalid JSON in request body: ' + e.message },
      }),
    };
  }

  // Sanity-check: messages must be an array
  if (!Array.isArray(body.messages) || body.messages.length === 0) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({
        error: { message: 'Request must include a non-empty "messages" array.' },
      }),
    };
  }

  // Only allow the models the app uses
  const ALLOWED_MODELS = ['claude-sonnet-4-6', 'claude-haiku-4-5-20251001'];
  if (!ALLOWED_MODELS.includes(body.model)) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({
        error: { message: 'Model "' + body.model + '" not allowed.' },
      }),
    };
  }

  // Cap max_tokens
  if (body.max_tokens > 2000) body.max_tokens = 2000;

  // ------------------------------------------------------------------
  // Log what we're about to send (helpful for debugging in Netlify logs)
  // ------------------------------------------------------------------
  const info = describePayload(body);
  console.log(
    '[claude-fn]',
    info.hasImage
      ? `Forwarding ${info.messageCount} msgs WITH IMAGE (~${info.imageSizeKB} KB) to ${info.model}`
      : `Forwarding ${info.messageCount} msgs (text only) to ${info.model}`,
    `| body ${(bodyBytes / 1024).toFixed(0)} KB`
  );

  // ------------------------------------------------------------------
  // Forward the ENTIRE body to Anthropic.
  // The body object (model, system, messages, max_tokens, etc.) is
  // re-serialised inside anthropicRequest as a Buffer.
  // ------------------------------------------------------------------
  try {
    const result = await anthropicRequest(apiKey, body);

    // Log the outcome
    if (result.statusCode >= 400) {
      console.error('[claude-fn] Anthropic returned', result.statusCode, result.body.slice(0, 300));
    } else {
      console.log('[claude-fn] Anthropic returned', result.statusCode, 'OK');
    }

    return { statusCode: result.statusCode, headers, body: result.body };
  } catch (err) {
    console.error('[claude-fn] Request failed:', err.message);
    return {
      statusCode: 502,
      headers,
      body: JSON.stringify({
        error: { message: 'Failed to reach Anthropic API: ' + err.message },
      }),
    };
  }
};
