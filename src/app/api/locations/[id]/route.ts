export const runtime = 'edge';

import { NextResponse } from 'next/server';
import { getDb, schema } from '@/lib/supabase';
import { eq } from 'drizzle-orm';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { clientId, name, room, address, contact, notes } = body;

    if (!clientId || !name) {
      return NextResponse.json(
        { success: false, error: 'clientId e name são obrigatórios.' },
        { status: 400 }
      );
    }

    const db = getDb();
    const [updatedLocation] = await db
      .update(schema.locations)
      .set({
        clientId,
        name,
        room: room || null,
        address: address || null,
        contact: contact || null,
        notes: notes || null,
      })
      .where(eq(schema.locations.id, id))
      .returning();

    if (!updatedLocation) {
      return NextResponse.json(
        { success: false, error: 'Unidade não encontrada.' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: updatedLocation });
  } catch (err) {
    console.error('Error in API PUT /api/locations/[id]:', err);
    const msg = err instanceof Error ? err.message : 'Erro interno';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;

    const db = getDb();
    const [deletedLocation] = await db
      .delete(schema.locations)
      .where(eq(schema.locations.id, id))
      .returning();

    if (!deletedLocation) {
      return NextResponse.json(
        { success: false, error: 'Unidade não encontrada.' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: { id: deletedLocation.id } });
  } catch (err) {
    console.error('Error in API DELETE /api/locations/[id]:', err);
    const msg = err instanceof Error ? err.message : 'Erro interno';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
