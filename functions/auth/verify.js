// GET /auth/verify
// Header: Authorization: Bearer <token>

import { verifyToken, unauthorized } from '../_shared/auth.js';

const HEADERS = { 'Content-Type': 'application/json' };

export async function onRequestGet(context) {
  const user = await verifyToken(context.request, context.env.DB);
  if (!user) return unauthorized();
  return new Response(JSON.stringify({ username: user.username }), { status: 200, headers: HEADERS });
}