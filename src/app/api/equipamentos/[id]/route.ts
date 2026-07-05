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
    const { name, locationId, serialNumber, installationDate, manufacturer, status, nextServiceDate } = body;

    if (!name) {
      return NextResponse.json(
        { success: false, error: 'O nome do equipamento é obrigatório.' },
        { status: 400 }
      );
    }

    const db = getDb();
    const [updated] = await db
      .update(schema.equipments)
      .set({
        name,
        locationId: locationId || null,
        serialNumber: serialNumber || null,
        installationDate: installationDate || null,
        manufacturer: manufacturer || null,
        status: status || 'Ativo',
        nextServiceDate: nextServiceDate || null,
      })
      .where(eq(schema.equipments.id, id))
      .returning();

    if (!updated) {
      return NextResponse.json(
        { success: false, error: 'Equipamento não encontrado.' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (err) {
    console.error('Error in API PUT /api/equipamentos/[id]:', err);
    const msg = err instanceof Error ? err.message : 'Erro interno';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;

    const db = getDb();
    const [deleted] = await db
      .delete(schema.equipments)
      .where(eq(schema.equipments.id, id))
      .returning();

    if (!deleted) {
      return NextResponse.json(
        { success: false, error: 'Equipamento não encontrado.' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: { id: deleted.id } });
  } catch (err) {
    console.error('Error in API DELETE /api/equipamentos/[id]:', err);
    const msg = err instanceof Error ? err.message : 'Erro interno';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
