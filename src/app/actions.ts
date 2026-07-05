'use server';

import { getDb, schema } from '@/lib/supabase';
import { eq } from 'drizzle-orm';
import { DBClient, DBLocation } from '@/lib/types';

// Helper to check if D1 DB is configured in wrangler/Cloudflare environment
function isConfigured() {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const dbBinding = (globalThis as any).DB || process.env.DB;
    return !!dbBinding;
  } catch {
    return false;
  }
}

export async function getClientDetailsAction(id: string) {
  try {
    if (!isConfigured()) {
      return { success: false, error: 'DB_NOT_CONFIGURED' };
    }

    const db = getDb();
    const [client] = await db
      .select()
      .from(schema.clients)
      .where(eq(schema.clients.id, id))
      .limit(1);

    if (!client) {
      return { success: false, error: 'Client not found' };
    }

    const locationsList = await db
      .select()
      .from(schema.locations)
      .where(eq(schema.locations.clientId, id))
      .orderBy(schema.locations.name);

    return {
      success: true,
      data: {
        client: {
          id: client.id,
          name: client.name,
          responsible_name: client.responsibleName,
          phone: client.phone,
          email: client.email,
          created_at: client.createdAt || undefined
        } as DBClient,
        locations: locationsList.map(loc => ({
          id: loc.id,
          client_id: loc.clientId || '',
          name: loc.name,
          room: loc.room,
          address: loc.address,
          contact: loc.contact,
          notes: loc.notes,
          created_at: loc.createdAt || undefined
        } as DBLocation))
      }
    };
  } catch (err) {
    console.error('Error fetching client details:', err);
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return { success: false, error: msg };
  }
}

