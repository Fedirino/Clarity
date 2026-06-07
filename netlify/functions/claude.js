const https = require('https');

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
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => {
        resolve({ statusCode: res.statusCode, body: Buffer.concat(chunks).toString() });
      });
    });
    req.on('error', (err) => reject(err));
    req.setTimeout(25000, () => { req.destroy(new Error('Request to Anthropic API timed out (25s).')); });
    req.write(data);
    req.end();
  });
}

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  };

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
      body: JSON.stringify({ error: { message: 'ANTHROPIC_API_KEY is not configured. The site owner needs to add it in Netlify → Site settings → Environment variables.' } }),
    };
  }

  let rawBody = event.body;
  if (event.isBase64Encoded) {
    rawBody = Buffer.from(rawBody, 'base64').toString('utf-8');
  }

  if (rawBody && rawBody.length > 4194304) {
    return { statusCode: 413, headers, body: JSON.stringify({ error: { message: 'Request too large (4 MB limit).' } }) };
  }

  let body;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return { statusCode: 400, headers, body: JSON.stringify({ error: { message: 'Invalid JSON in request body.' } }) };
  }

  const ALLOWED_MODELS = ['claude-sonnet-4-6', 'claude-haiku-4-5-20251001'];
  if (!ALLOWED_MODELS.includes(body.model)) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: { message: 'Model "' + body.model + '" not allowed.' } }) };
  }

  if (body.max_tokens > 2000) body.max_tokens = 2000;

  try {
    const result = await anthropicRequest(apiKey, body);
    return { statusCode: result.statusCode, headers, body: result.body };
  } catch (err) {
    return {
      statusCode: 502, headers,
      body: JSON.stringify({ error: { message: 'Failed to reach Anthropic API: ' + err.message } }),
    };
  }
};
