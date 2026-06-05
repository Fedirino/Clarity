// Netlify serverless function — proxies requests to the Anthropic API
// so the API key stays server-side and visitors never see it.
//
// Set ANTHROPIC_API_KEY in Netlify → Site settings → Environment variables.

exports.handler = async (event) => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
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
    console.error('ANTHROPIC_API_KEY environment variable is not set');
    return {
      statusCode: 500, headers,
      body: JSON.stringify({ error: { message: 'Server API key not configured. Add ANTHROPIC_API_KEY in Netlify → Site settings → Environment variables, then redeploy.' } }),
    };
  }

  try {
    const resp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: event.body,
    });

    const data = await resp.text();
    return { statusCode: resp.status, headers, body: data };
  } catch (err) {
    console.error('Proxy error:', err);
    return {
      statusCode: 502, headers,
      body: JSON.stringify({ error: { message: 'Failed to reach Anthropic API: ' + err.message } }),
    };
  }
};
