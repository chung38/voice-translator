export async function onRequestPost(context) {
  try {
    const KEY = context.env.GOOGLE_TTS_KEY;

    if (!KEY) {
      return new Response(JSON.stringify({ error: "Missing GOOGLE_TTS_KEY" }), {
        status: 500,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      });
    }

    const body = await context.request.json();
    const text = body.text;
    const lang = body.lang;

    if (!text || !lang) {
      return new Response(JSON.stringify({ error: "Missing text or lang" }), {
        status: 400,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      });
    }

    let languageCode = "cmn-TW";
    let voiceName = "cmn-TW-Wavenet-A";

    if (lang === "vi-VN") { languageCode = "vi-VN"; voiceName = "vi-VN-Wavenet-A"; }
    else if (lang === "th-TH") { languageCode = "th-TH"; voiceName = "th-TH-Neural2-C"; }
    else if (lang === "id-ID") { languageCode = "id-ID"; voiceName = "id-ID-Wavenet-A"; }
    else if (lang === "en-US") { languageCode = "en-US"; voiceName = "en-US-Wavenet-F"; }

    const payload = JSON.stringify({
      input: { text: text },
      voice: { languageCode: languageCode, name: voiceName, ssmlGender: "FEMALE" },
      audioConfig: { audioEncoding: "MP3", speakingRate: 1.0, pitch: 0 },
    });

    const res = await fetch(
      "https://texttospeech.googleapis.com/v1/text:synthesize?key=" + KEY,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: payload,
      }
    );

    const data = await res.json();

    if (!res.ok) {
      const msg = data.error ? data.error.message : "Google TTS error";
      return new Response(JSON.stringify({ error: msg }), {
        status: res.status,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      });
    }

    return new Response(JSON.stringify({ audioContent: data.audioContent }), {
      status: 200,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
