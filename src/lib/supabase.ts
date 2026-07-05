import { drizzle } from 'drizzle-orm/d1';
import * as schema from '@/db/schema';

export function getDb() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const dbBinding = (globalThis as any).DB || process.env.DB;
  if (!dbBinding) throw new Error("D1 DB binding not found.");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return drizzle(dbBinding as any, { schema });
}

export { schema };