import { getRequestContext } from '@cloudflare/next-on-pages';
import { drizzle } from 'drizzle-orm/d1';
import * as schema from '@/db/schema';

export function getDb() {
  const env = getRequestContext().env as { DB?: any };
  if (!env.DB) throw new Error("D1 DB binding not found in request context");
  return drizzle(env.DB, { schema });
}

export { schema };
