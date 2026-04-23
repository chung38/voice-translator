// GET  /admin/users          → 列出所有使用者
// POST /admin/users          → 更新使用者狀態
// body (POST): { userId, status }  status: 'active' | 'disabled' | 'pending'
// 需在 Cloudflare Pages 環境變數設定 ADMIN_SECRET

const HEADERS = { 'Content-Type': 'application/json' };

function checkAdmin(request, env) {
  const secret = request.headers.get('X-Admin-Secret');
  return secret && secret === env.ADMIN_SECRET;
}

export async function onRequestGet(context) {
  if (!checkAdmin(context.request, context.env)) {
    return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: HEADERS });
  }
  const rows = await context.env.DB.prepare(
    'SELECT id, username, status, created_at FROM users ORDER BY created_at DESC'
  ).all();
  return new Response(JSON.stringify(rows.results), { status: 200, headers: HEADERS });
}

export async function onRequestPost(context) {
  if (!checkAdmin(context.request, context.env)) {
    return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: HEADERS });
  }
  try {
    const { userId, status } = await context.request.json();
    if (!userId || !['active','disabled','pending'].includes(status)) {
      return new Response(JSON.stringify({ error: '參數錯誤' }), { status: 400, headers: HEADERS });
    }
    await context.env.DB.prepare(
      'UPDATE users SET status = ? WHERE id = ?'
    ).bind(status, userId).run();
    return new Response(JSON.stringify({ message: '更新成功' }), { status: 200, headers: HEADERS });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: HEADERS });
  }
}
