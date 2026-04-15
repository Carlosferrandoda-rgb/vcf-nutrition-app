import { z } from 'zod';

const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(10),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(10),
  APP_ADMIN_USER: z.string().min(1),
  APP_ADMIN_PASS: z.string().min(8),
  SESSION_SECRET: z.string().min(12),
});

export const env = envSchema.parse({
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  APP_ADMIN_USER: process.env.APP_ADMIN_USER,
  APP_ADMIN_PASS: process.env.APP_ADMIN_PASS,
  SESSION_SECRET: process.env.SESSION_SECRET,
});
