// POST /auth/register
// body: { username, password }

const HEADERS = { 'Content-Type': 'application/json' };

export async function onRequestPost(context) {
  try {
    const { username, password } = await context.request.json();

    if (!username || typeof username !== 'string' || username.trim().length < 3) {
      return new Response(JSON.stringify({ error: '帳號至少 3 個字元' }), { status: 400, headers: HEADERS });
    }
    if (!password || typeof password !== 'string' || password.length < 6) {
      return new Response(JSON.stringify({ error: '密碼至少 6 個字元' }), { status: 400, headers: HEADERS });
    }

    const user = username.trim().toLowerCase();

    // 檢查帳號是否已存在
    const existing = await context.env.DB.prepare(
      'SELECT id FROM users WHERE username = ?'
    ).bind(user).first();

    if (existing) {
      return new Response(JSON.stringify({ error: '帳號已存在' }), { status: 409, headers: HEADERS });
    }

    // 雜湊密碼（使用 SubtleCrypto + PBKDF2）
    const hashed = await hashPassword(password);

    await context.env.DB.prepare(
      'INSERT INTO users (username, password, status) VALUES (?, ?, ?)'
    ).bind(user, hashed, 'pending').run();

    return new Response(
      JSON.stringify({ message: '註冊成功，請等待管理員審核後才能登入' }),
      { status: 201, headers: HEADERS }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: HEADERS });
  }
}

// PBKDF2 雜湊
async function hashPassword(password) {
  const enc = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const keyMaterial = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
    keyMaterial, 256
  );
  const hashArr = Array.from(new Uint8Array(bits));
  const saltArr = Array.from(salt);
  return saltArr.map(b => b.toString(16).padStart(2,'0')).join('') + ':' +
         hashArr.map(b => b.toString(16).padStart(2,'0')).join('');
}
