import { drizzle } from 'drizzle-orm/d1';
import * as schema from '@/db/schema';

const getDrizzleClient = () => {
  const d1 = (process.env as Record<string, unknown>).DB;
  if (!d1) {
    console.warn("Aviso: Binding D1 'DB' não encontrado em process.env. O Drizzle usará um proxy.");
    return new Proxy({} as Record<string, unknown>, {
      get() {
        return () => {
          throw new Error("Erro: O binding 'DB' do Cloudflare D1 não está configurado no process.env.");
        };
      }
    }) as unknown as ReturnType<typeof drizzle>;
  }
  return drizzle(d1 as unknown as Parameters<typeof drizzle>[0], { schema });
};

export const db = getDrizzleClient();
export { schema };
