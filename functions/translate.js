// Cloudflare Pages Function
// 檔案路徑：functions/translate.js
// 對應 URL：/translate（前端呼叫 /translate 即可）

export async function onRequestPost(context) {
  const HEADERS = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
  };

  try {
    const DEEPSEEK_KEY = context.env.DEEPSEEK_API_KEY;
    if (!DEEPSEEK_KEY) {
      return new Response(
        JSON.stringify({ error: 'Missing DEEPSEEK_API_KEY' }),
        { status: 500, headers: HEADERS }
      );
    }

    const body = await context.request.json();

    const response = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_KEY}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        max_tokens: 200,
        messages: body.messages,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return new Response(
        JSON.stringify({ error: data.error?.message || 'DeepSeek API error' }),
        { status: response.status, headers: HEADERS }
      );
    }

    return new Response(JSON.stringify(data), { status: 200, headers: HEADERS });

  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: HEADERS }
    );
  }
}

// 處理 CORS preflight
export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
