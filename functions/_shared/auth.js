// functions/_shared/auth.js
// 共用：從 Request 取出 Bearer token 並驗證是否有效

export async function verifyToken(request, db) {
  const auth = request.headers.get('Authorization') || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7).trim() : null;
  if (!token) return null;

  const row = await db.prepare(
    `SELECT s.user_id, s.expires_at, u.username, u.status
     FROM sessions s
     JOIN users u ON u.id = s.user_id
     WHERE s.token = ?`
  ).bind(token).first();

  if (!row) return null;
  if (new Date(row.expires_at) < new Date()) return null;
  if (row.status !== 'active') return null;

  return { userId: row.user_id, username: row.username };
}

export function unauthorized(msg = 'Unauthorized') {
  return new Response(JSON.stringify({ error: msg }), {
    status: 401,
    headers: { 'Content-Type': 'application/json' },
  });
}

// ── Rate Limiting（使用 Cloudflare KV）──
// KV binding 名稱：RATE_KV
// 每個 token 每分鐘最多 LIMIT 次

const LIMIT = 20;   // 每分鐘最多幾次
const WINDOW = 60;  // 時間窗口（秒）

export async function checkRateLimit(token, kv) {
  if (!kv) return false; // 沒有 KV 綁定時跳過
  const key = 'rl:' + token.slice(0, 16);
  const now = Math.floor(Date.now() / 1000);
  const windowKey = key + ':' + Math.floor(now / WINDOW);

  const current = parseInt(await kv.get(windowKey) || '0');
  if (current >= LIMIT) return true; // 超過限制

  await kv.put(windowKey, String(current + 1), { expirationTtl: WINDOW * 2 });
  return false;
}

export function tooManyRequests() {
  return new Response(JSON.stringify({ error: '請求過於頻繁，請稍後再試' }), {
    status: 429,
    headers: { 'Content-Type': 'application/json' },
  });
}
