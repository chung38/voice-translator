const ALLOWED_ORIGIN = '*';

// 有效的語言白名單
const ALLOWED_LANGS = ['zh-TW', 'cmn-TW', 'vi-VN', 'th-TH', 'id-ID', 'en-US'];

// 語音對照表（Standard 免費層，所有語言都支援）
const voiceMap = {
  'zh-TW':  { languageCode: 'cmn-TW', voiceName: 'cmn-TW-Standard-A', gender: 'FEMALE' },
  'cmn-TW': { languageCode: 'cmn-TW', voiceName: 'cmn-TW-Standard-A', gender: 'FEMALE' },
  'vi-VN':  { languageCode: 'vi-VN',  voiceName: 'vi-VN-Standard-A',  gender: 'FEMALE' },
  'th-TH':  { languageCode: 'th-TH',  voiceName: 'th-TH-Standard-A',  gender: 'FEMALE' },
  'id-ID':  { languageCode: 'id-ID',  voiceName: 'id-ID-Standard-A',  gender: 'FEMALE' },
  'en-US':  { languageCode: 'en-US',  voiceName: 'en-US-Standard-F',  gender: 'FEMALE' },
};

const JSON_HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
};

export async function onRequestPost(context) {
  try {
    const KEY = context.env.GOOGLE_TTS_KEY;

    if (!KEY) {
      return new Response(JSON.stringify({ error: 'Missing GOOGLE_TTS_KEY' }), {
        status: 500, headers: JSON_HEADERS,
      });
    }

    const body = await context.request.json();
    let text = body.text;
    const lang = body.lang;

    // ── 驗證 text ──
    if (!text || typeof text !== 'string' || !text.trim()) {
      return new Response(JSON.stringify({ error: 'Missing text' }), {
        status: 400, headers: JSON_HEADERS,
      });
    }
    // 限制最大長度，防止配額濫用
    if (text.length > 500) text = text.substring(0, 500);

    // ── 驗證 lang （白名單）──
    if (!lang || !ALLOWED_LANGS.includes(lang)) {
      return new Response(JSON.stringify({ error: 'Invalid or unsupported lang' }), {
        status: 400, headers: JSON_HEADERS,
      });
    }

    const voice = voiceMap[lang];

    const payload = JSON.stringify({
      input: { text: text.trim() },
      voice: { languageCode: voice.languageCode, name: voice.voiceName, ssmlGender: voice.gender },
      audioConfig: { audioEncoding: 'MP3', speakingRate: 1.0, pitch: 0 },
    });

    // 使用 v1beta1 支援 API Key 驗證
    const res = await fetch(
      'https://texttospeech.googleapis.com/v1beta1/text:synthesize?key=' + KEY,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payload,
      }
    );

    const data = await res.json();

    if (!res.ok) {
      const msg = data.error ? data.error.message : 'Google TTS error';
      return new Response(JSON.stringify({ error: msg }), {
        status: res.status, headers: JSON_HEADERS,
      });
    }

    return new Response(JSON.stringify({ audioContent: data.audioContent }), {
      status: 200, headers: JSON_HEADERS,
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: JSON_HEADERS,
    });
  }
}

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
