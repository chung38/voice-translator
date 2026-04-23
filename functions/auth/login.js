// POST /auth/login
// body: { username, password }

const HEADERS = { 'Content-Type': 'application/json' };
const SESSION_DAYS = 30;

export async function onRequestPost(context) {
  try {
    const { username, password } = await context.request.json();
    if (!username || !password) {
      return new Response(JSON.stringify({ error: '請輸入帳號和密碼' }), { status: 400, headers: HEADERS });
    }

    const user = username.trim().toLowerCase();
    const row = await context.env.DB.prepare(
      'SELECT id, password, status FROM users WHERE username = ?'
    ).bind(user).first();

    if (!row) {
      return new Response(JSON.stringify({ error: '帳號或密碼錯誤' }), { status: 401, headers: HEADERS });
    }
    if (row.status === 'pending') {
      return new Response(JSON.stringify({ error: '帳號尚未通過審核，請聯繫管理員' }), { status: 403, headers: HEADERS });
    }
    if (row.status === 'disabled') {
      return new Response(JSON.stringify({ error: '帳號已被停用' }), { status: 403, headers: HEADERS });
    }

    const valid = await verifyPassword(password, row.password);
    if (!valid) {
      return new Response(JSON.stringify({ error: '帳號或密碼錯誤' }), { status: 401, headers: HEADERS });
    }

    // 產生 session token
    const tokenBytes = crypto.getRandomValues(new Uint8Array(32));
    const token = Array.from(tokenBytes).map(b => b.toString(16).padStart(2,'0')).join('');

    const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000).toISOString();

    await context.env.DB.prepare(
      'INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)'
    ).bind(token, row.id, expiresAt).run();

    return new Response(
      JSON.stringify({ token, expiresAt, username: user }),
      { status: 200, headers: HEADERS }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: HEADERS });
  }
}

// PBKDF2 驗證
async function verifyPassword(password, stored) {
  try {
    const [saltHex, hashHex] = stored.split(':');
    const salt = new Uint8Array(saltHex.match(/.{2}/g).map(b => parseInt(b, 16)));
    const enc = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits']);
    const bits = await crypto.subtle.deriveBits(
      { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
      keyMaterial, 256
    );
    const hashArr = Array.from(new Uint8Array(bits));
    const computed = hashArr.map(b => b.toString(16).padStart(2,'0')).join('');
    return computed === hashHex;
  } catch { return false; }
}