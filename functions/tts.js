// tts.js - 已改用前端瀏覽器原生 TTS，此檔保留但不再使用
export async function onRequestPost(context) {
  // 回傳空的 audioContent，前端會自動 fallback 到瀏覽器 TTS
  return new Response(JSON.stringify({ audioContent: null, useBrowserTTS: true }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  });
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
