// functions/tts.js
// 呼叫 Google Cloud Text-to-Speech API
// 環境變數：GOOGLE_TTS_KEY

const HEADERS = {
‘Content-Type’: ‘application/json’,
‘Access-Control-Allow-Origin’: ‘*’,
};

// 每種語言對應的 WaveNet 聲音（自然度最高）
// WaveNet 聲音名稱格式：{lang}-Wavenet-{ID}
const VOICE_MAP = {
‘zh-TW’: { languageCode: ‘cmn-TW’, name: ‘cmn-TW-Wavenet-A’, gender: ‘FEMALE’ },
‘vi-VN’: { languageCode: ‘vi-VN’, name: ‘vi-VN-Wavenet-A’, gender: ‘FEMALE’ },
‘th-TH’: { languageCode: ‘th-TH’, name: ‘th-TH-Neural2-C’, gender: ‘FEMALE’ },
‘id-ID’: { languageCode: ‘id-ID’, name: ‘id-ID-Wavenet-A’, gender: ‘FEMALE’ },
‘en-US’: { languageCode: ‘en-US’, name: ‘en-US-Wavenet-F’, gender: ‘FEMALE’ },
};

export async function onRequestPost(context) {
try {
const KEY = context.env.GOOGLE_TTS_KEY;
if (!KEY) {
return new Response(
JSON.stringify({ error: ‘Missing GOOGLE_TTS_KEY’ }),
{ status: 500, headers: HEADERS }
);
}

```
const { text, lang } = await context.request.json();
if (!text || !lang) {
  return new Response(
    JSON.stringify({ error: 'Missing text or lang' }),
    { status: 400, headers: HEADERS }
  );
}

const voice = VOICE_MAP[lang] || VOICE_MAP['zh-TW'];

const body = {
  input: { text },
  voice: {
    languageCode: voice.languageCode,
    name: voice.name,
    ssmlGender: voice.gender,
  },
  audioConfig: {
    audioEncoding: 'MP3',
    speakingRate: 1.0,   // 語速，1.0 = 正常，可調 0.75–1.25
    pitch: 0,             // 音調，0 = 正常
    volumeGainDb: 0,
  },
};

const res = await fetch(
  `https://texttospeech.googleapis.com/v1/text:synthesize?key=${KEY}`,
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }
);

const data = await res.json();

if (!res.ok) {
  return new Response(
    JSON.stringify({ error: data.error?.message || 'Google TTS error' }),
    { status: res.status, headers: HEADERS }
  );
}

// 回傳 base64 編碼的 MP3
return new Response(
  JSON.stringify({ audioContent: data.audioContent }),
  { status: 200, headers: HEADERS }
);
```

} catch (err) {
return new Response(
JSON.stringify({ error: err.message }),
{ status: 500, headers: HEADERS }
);
}
}

export async function onRequestOptions() {
return new Response(null, {
status: 204,
headers: {
‘Access-Control-Allow-Origin’: ‘*’,
‘Access-Control-Allow-Methods’: ‘POST, OPTIONS’,
‘Access-Control-Allow-Headers’: ‘Content-Type’,
},
});
}