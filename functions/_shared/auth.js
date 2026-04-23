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
