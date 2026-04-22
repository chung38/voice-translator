// Cloudflare Pages Function
// 檔案路徑：functions/translate.js
// 對應 URL：/translate（前端呼叫 /translate 即可）

// 允許的來源（部署後請改為你的正式域名，例如 'https://your-app.pages.dev'）
const ALLOWED_ORIGIN = '*';

// 固定的 system prompt，不允許前端覆蓋
const SYSTEM_PROMPT = '你是專業翻譯員，只輸出翻譯結果，不加任何說明或解釋。';

export async function onRequestPost(context) {
  const HEADERS = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
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

    // ── 驗證 userText 格式（只接受純文字翻譯請求）──
    const userText = body.text;
    if (!userText || typeof userText !== 'string' || !userText.trim()) {
      return new Response(
        JSON.stringify({ error: 'Missing or invalid text' }),
        { status: 400, headers: HEADERS }
      );
    }
    if (userText.length > 500) {
      return new Response(
        JSON.stringify({ error: 'Text too long (max 500 chars)' }),
        { status: 400, headers: HEADERS }
      );
    }

    const prompt = body.prompt;
    if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
      return new Response(
        JSON.stringify({ error: 'Missing or invalid prompt' }),
        { status: 400, headers: HEADERS }
      );
    }

    // ── system prompt 由後端固定，前端無法覆蓋 ──
    const messages = [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user',   content: prompt + '\n\n' + userText.trim() },
    ];

    const response = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_KEY}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        max_tokens: 300,
        messages,
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
      'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
