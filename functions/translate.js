// Cloudflare Pages Function
// 檔案路徑：functions/translate.js

import { verifyToken, unauthorized } from './_shared/auth.js';

const ALLOWED_ORIGIN = '*';
const SYSTEM_PROMPT = '你是專業翻譯員，只輸出翻譯結果，不加任何說明或解釋。';

const HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
};

export async function onRequestPost(context) {
  // ── Token 驗證 ──
  const user = await verifyToken(context.request, context.env.DB);
  if (!user) return unauthorized();

  try {
    const DEEPSEEK_KEY = context.env.DEEPSEEK_API_KEY;
    if (!DEEPSEEK_KEY) {
      return new Response(JSON.stringify({ error: 'Missing DEEPSEEK_API_KEY' }), { status: 500, headers: HEADERS });
    }

    const body = await context.request.json();

    const userText = body.text;
    if (!userText || typeof userText !== 'string' || !userText.trim()) {
      return new Response(JSON.stringify({ error: 'Missing or invalid text' }), { status: 400, headers: HEADERS });
    }
    if (userText.length > 500) {
      return new Response(JSON.stringify({ error: 'Text too long (max 500 chars)' }), { status: 400, headers: HEADERS });
    }

    const prompt = body.prompt;
    if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
      return new Response(JSON.stringify({ error: 'Missing or invalid prompt' }), { status: 400, headers: HEADERS });
    }

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
      body: JSON.stringify({ model: 'deepseek-chat', max_tokens: 300, messages }),
    });

    const data = await response.json();
    if (!response.ok) {
      return new Response(JSON.stringify({ error: data.error?.message || 'DeepSeek API error' }), { status: response.status, headers: HEADERS });
    }

    return new Response(JSON.stringify(data), { status: 200, headers: HEADERS });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: HEADERS });
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}