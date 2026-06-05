// Netlify serverless function — proxies requests to the Anthropic API
// so the API key stays server-side and never reaches the browser.
//
// Set ANTHROPIC_API_KEY in Netlify dashboard:
//   Site settings → Environment variables → Add a variable
//   Key:   ANTHROPIC_API_KEY
//   Value: sk-ant-...

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  };

  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: { message: 'Method not allowed' } }) };
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return {
      statusCode: 500, headers,
      body: JSON.stringify({ error: { message: 'ANTHROPIC_API_KEY is not configured on the server. The site owner needs to add it in Netlify environment variables.' } }),
    };
  }

  // Basic body size guard (≈4 MB — needed for base64 images, especially calibration with up to 4 photos)
  if (event.body && event.body.length > 4194304) {
    return { statusCode: 413, headers, body: JSON.stringify({ error: { message: 'Request too large.' } }) };
  }

  let body;
  try {
    body = JSON.parse(event.body);
  } catch {
    return { statusCode: 400, headers, body: JSON.stringify({ error: { message: 'Invalid JSON in request body.' } }) };
  }

  // Only allow the models the app uses
  const ALLOWED_MODELS = ['claude-sonnet-4-6', 'claude-haiku-4-5-20251001'];
  if (!ALLOWED_MODELS.includes(body.model)) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: { message: `Model not allowed. Use one of: ${ALLOWED_MODELS.join(', ')}` } }) };
  }

  // Cap max_tokens to prevent runaway usage
  if (body.max_tokens > 2000) body.max_tokens = 2000;

  try {
    const resp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(body),
    });

    const data = await resp.text();
    return { statusCode: resp.status, headers, body: data };
  } catch (err) {
    return {
      statusCode: 502, headers,
      body: JSON.stringify({ error: { message: 'Failed to reach Anthropic API: ' + err.message } }),
    };
  }
};
