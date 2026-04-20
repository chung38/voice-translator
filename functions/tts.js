export async function onRequestPost(context) {
  try {
    const KEY = context.env.GOOGLE_TTS_KEY;

    if (!KEY) {
      return new Response(JSON.stringify({ error: 'Missing GOOGLE_TTS_KEY' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    const body = await context.request.json();
    const text = body.text;
    const lang = body.lang;

    if (!text || !lang) {
      return new Response(JSON.stringify({ error: 'Missing text or lang' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    // 語音對照表（Standard 免費層繊，所有語言都支援）
    const voiceMap = {
      'zh-TW':  { languageCode: 'cmn-TW', voiceName: 'cmn-TW-Standard-A', gender: 'FEMALE' },
      'cmn-TW': { languageCode: 'cmn-TW', voiceName: 'cmn-TW-Standard-A', gender: 'FEMALE' },
      'vi-VN':  { languageCode: 'vi-VN',  voiceName: 'vi-VN-Standard-A',  gender: 'FEMALE' },
      'th-TH':  { languageCode: 'th-TH',  voiceName: 'th-TH-Standard-A',  gender: 'FEMALE' },
      'id-ID':  { languageCode: 'id-ID',  voiceName: 'id-ID-Standard-A',  gender: 'FEMALE' },
      'en-US':  { languageCode: 'en-US',  voiceName: 'en-US-Standard-F',  gender: 'FEMALE' },
    };

    const voice = voiceMap[lang] || voiceMap['zh-TW'];

    const payload = JSON.stringify({
      input: { text },
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
        status: res.status,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    return new Response(JSON.stringify({ audioContent: data.audioContent }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }
}

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
