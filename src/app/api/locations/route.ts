export const runtime = 'edge';

import { NextResponse } from 'next/server';
import { getDb, schema } from '@/lib/supabase';

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
