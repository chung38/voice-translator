// Cloudflare Pages Function
// 檔案路徑：functions/tts.js

import { verifyToken, unauthorized } from './_shared/auth.js';

const ALLOWED_ORIGIN = '*';
const ALLOWED_LANGS = ['zh-TW', 'cmn-TW', 'vi-VN', 'th-TH', 'id-ID', 'en-US'];
const MAX_TTS_LENGTH = 500;

const HEADERS_JSON = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
};

export async function onRequestPost(context) {
  // ── Token 驗證 ──
  const user = await verifyToken(context.request, context.env.DB);
  if (!user) return unauthorized();

  try {
    const body = await context.request.json();

    const lang = body.lang;
    if (!lang || !ALLOWED_LANGS.includes(lang)) {
      return new Response(JSON.stringify({ error: 'Invalid lang' }), { status: 400, headers: HEADERS_JSON });
    }

    let text = body.text;
    if (!text || typeof text !== 'string' || !text.trim()) {
      return new Response(JSON.stringify({ error: 'Missing text' }), { status: 400, headers: HEADERS_JSON });
    }
    if (text.length > MAX_TTS_LENGTH) {
      text = text.slice(0, MAX_TTS_LENGTH);
    }

    // 這裡放你原本的 TTS 實作邏輯
    // 若是使用瀏覽器 speechSynthesis，此 function 可能不需要
    // 保留此檔案作為未來串接 TTS API 的入口

    return new Response(JSON.stringify({ message: 'ok', text }), { status: 200, headers: HEADERS_JSON });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: HEADERS_JSON });
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