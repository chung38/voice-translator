export async function onRequestPost(context) {
const HEADERS = {
‘Content-Type’: ‘application/json’,
‘Access-Control-Allow-Origin’: ‘*’,
};

try {
const KEY = context.env.GOOGLE_TTS_KEY;
if (!KEY) {
return new Response(
JSON.stringify({ error: ‘Missing GOOGLE_TTS_KEY’ }),
{ status: 500, headers: HEADERS }
);
}

```
const body = await context.request.json();
const text = body.text;
const lang = body.lang;

if (!text || !lang) {
  return new Response(
    JSON.stringify({ error: 'Missing text or lang' }),
    { status: 400, headers: HEADERS }
  );
}

const voiceMap = {
  'zh-TW': { languageCode: 'cmn-TW', name: 'cmn-TW-Wavenet-A' },
  'vi-VN': { languageCode: 'vi-VN',  name: 'vi-VN-Wavenet-A'  },
  'th-TH': { languageCode: 'th-TH',  name: 'th-TH-Neural2-C'  },
  'id-ID': { languageCode: 'id-ID',  name: 'id-ID-Wavenet-A'  },
  'en-US': { languageCode: 'en-US',  name: 'en-US-Wavenet-F'  },
};

const voice = voiceMap[lang] || voiceMap['zh-TW'];

const reqBody = {
  input: { text: text },
  voice: {
    languageCode: voice.languageCode,
    name: voice.name,
    ssmlGender: 'FEMALE',
  },
  audioConfig: {
    audioEncoding: 'MP3',
    speakingRate: 1.0,
    pitch: 0,
  },
};

const res = await fetch(
  'https://texttospeech.googleapis.com/v1/text:synthesize?key=' + KEY,
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(reqBody),
  }
);

const data = await res.json();

if (!res.ok) {
  return new Response(
    JSON.stringify({ error: data.error ? data.error.message : 'Google TTS error' }),
    { status: res.status, headers: HEADERS }
  );
}

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