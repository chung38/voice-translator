const HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// 共用邏輯
async function handleRequest(body) {
  const DEEPSEEK_KEY = process.env.DEEPSEEK_API_KEY;
  if (!DEEPSEEK_KEY) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Missing DEEPSEEK_API_KEY' })
    };
  }

  try {
    const response = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_KEY}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        max_tokens: 500,
        messages: body.messages
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        statusCode: response.status,
        body: JSON.stringify({ error: data.error?.message || 'DeepSeek API error' })
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify(data)
    };

  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
}

//
// 🔵 Netlify 用
//
exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: HEADERS, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: HEADERS, body: 'Method Not Allowed' };
  }

  const result = await handleRequest(JSON.parse(event.body));

  return {
    statusCode: result.statusCode,
    headers: HEADERS,
    body: result.body
  };
};

//
// 🟢 Render（Express）用
//
module.exports.expressHandler = async (req, res) => {
  if (req.method === 'OPTIONS') {
    return res.status(200).set(HEADERS).send('');
  }

  if (req.method !== 'POST') {
    return res.status(405).set(HEADERS).send('Method Not Allowed');
  }

  const result = await handleRequest(req.body);

  res.status(result.statusCode).set(HEADERS).send(result.body);
};
