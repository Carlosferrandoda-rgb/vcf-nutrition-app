import crypto from 'crypto';
import { cookies } from 'next/headers';
import { env } from './env';

const COOKIE_NAME = 'vcf_staff_session';

function sign(value: string) {
  return crypto.createHmac('sha256', env.SESSION_SECRET).update(value).digest('hex');
}

export async function createSession(username: string) {
  const payload = `${username}:${Date.now()}`;
  const signature = sign(payload);
  const store = await cookies();
  store.set(COOKIE_NAME, `${payload}.${signature}`, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 12,
  });
}

export async function clearSession() {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}

export async function isAuthenticated() {
  const store = await cookies();
  const raw = store.get(COOKIE_NAME)?.value;
  if (!raw) return false;
  const parts = raw.split('.');
  if (parts.length !== 2) return false;
  const [payload, signature] = parts;
  return sign(payload) === signature;
}
