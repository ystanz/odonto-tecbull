export const runtime = 'edge';

import { NextResponse } from 'next/server';
import { getDb, schema } from '@/lib/supabase';
import { eq } from 'drizzle-orm';
import { DBLocation } from '@/lib/types';

export async function GET() {
  try {
    const db = getDb();
    const rows = await db
      .select()
      .from(schema.locations)
      .leftJoin(schema.clients, eq(schema.locations.clientId, schema.clients.id))
      .orderBy(schema.locations.name);

    const formatted: DBLocation[] = rows.map((row) => ({
      id: row.locations.id,
      client_id: row.locations.clientId || '',
      name: row.locations.name,
      room: row.locations.room,
      address: row.locations.address,
      contact: row.locations.contact,
      notes: row.locations.notes,
      created_at: row.locations.createdAt || undefined,
      clients: row.clients ? {
        id: row.clients.id,
        name: row.clients.name,
        responsible_name: row.clients.responsibleName,
        phone: row.clients.phone,
        email: row.clients.email,
        created_at: row.clients.createdAt || undefined
      } : undefined
    }));

    return NextResponse.json({ success: true, data: formatted });
  } catch (err) {
    console.error('Error in API GET /api/locations:', err);
    const msg = err instanceof Error ? err.message : 'Erro interno';
    return NextResponse.json({ success: false, error: msg, data: [] }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { clientId, name, room, address, contact, notes } = body;

    if (!clientId || !name) {
      return NextResponse.json(
        { success: false, error: 'clientId e name são obrigatórios.' },
        { status: 400 }
      );
    }

    const db = getDb();
    const [newLocation] = await db
      .insert(schema.locations)
      .values({
        id: crypto.randomUUID(),
        clientId,
        name,
        room: room || null,
        address: address || null,
        contact: contact || null,
        notes: notes || null,
      })
      .returning();

    return NextResponse.json({ success: true, data: newLocation });
  } catch (err) {
    console.error('Error in API POST /api/locations:', err);
    const msg = err instanceof Error ? err.message : 'Erro interno';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
