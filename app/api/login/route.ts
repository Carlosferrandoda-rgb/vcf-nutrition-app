import { NextResponse } from 'next/server';
import { env } from '@/lib/env';
import { createSession } from '@/lib/auth';

export async function POST(request: Request) {
  const form = await request.formData();
  const username = String(form.get('username') || '');
  const password = String(form.get('password') || '');

  if (username !== env.APP_ADMIN_USER || password !== env.APP_ADMIN_PASS) {
  return NextResponse.redirect(new URL('/login', request.url), 303);
}

await createSession(username);
return NextResponse.redirect(new URL('/dashboard', request.url), 303);
}
