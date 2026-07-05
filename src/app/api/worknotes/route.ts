export const runtime = 'edge';

import { NextResponse } from 'next/server';
import { getDb, schema } from '@/lib/supabase';
import { eq } from 'drizzle-orm';
import { DBWorkNote } from '@/lib/types';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const osId = searchParams.get('os_id');

    if (!osId) {
      return NextResponse.json(
        { success: false, error: 'O parâmetro os_id é obrigatório.' },
        { status: 400 }
      );
    }

    const db = getDb();
    const list = await db
      .select()
      .from(schema.workNotes)
      .where(eq(schema.workNotes.osId, osId))
      .orderBy(schema.workNotes.createdAt); // Ordem cronológica ascendente

    const formatted: DBWorkNote[] = list.map((n) => ({
      id: n.id,
      os_id: n.osId,
      note: n.note,
      created_at: n.createdAt || undefined,
    }));

    return NextResponse.json({ success: true, data: formatted });
  } catch (err) {
    console.error('Error in API GET /api/worknotes:', err);
    const msg = err instanceof Error ? err.message : 'Erro interno';
    return NextResponse.json({ success: false, error: msg, data: [] }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { osId, note } = body;

    if (!osId || !note) {
      return NextResponse.json(
        { success: false, error: 'osId e note são obrigatórios.' },
        { status: 400 }
      );
    }

    const db = getDb();
    const [newNote] = await db
      .insert(schema.workNotes)
      .values({
        id: crypto.randomUUID(),
        osId,
        note,
      })
      .returning();

    const formatted: DBWorkNote = {
      id: newNote.id,
      os_id: newNote.osId,
      note: newNote.note,
      created_at: newNote.createdAt || undefined,
    };

    return NextResponse.json({ success: true, data: formatted });
  } catch (err) {
    console.error('Error in API POST /api/worknotes:', err);
    const msg = err instanceof Error ? err.message : 'Erro interno';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
