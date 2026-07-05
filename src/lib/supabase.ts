import { drizzle } from 'drizzle-orm/d1';
import * as schema from '@/db/schema';

export function getDb() {
  // @ts-ignore
  const dbBinding = (globalThis as any).DB || process.env.DB;
  if (!dbBinding) throw new Error("D1 DB binding not found.");
  return drizzle(dbBinding, { schema });
}

export { schema };