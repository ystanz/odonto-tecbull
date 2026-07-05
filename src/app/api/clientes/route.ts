export const runtime = 'edge';

import { NextResponse } from 'next/server';
import { getDb, schema } from '@/lib/supabase';
import { DBClient } from '@/lib/types';

export async function GET() {
  try {
    const db = getDb();
    const data = await db
      .select()
      .from(schema.clients)
      .orderBy(schema.clients.name);

    const formatted: DBClient[] = data.map(item => ({
      id: item.id,
      name: item.name,
      responsible_name: item.responsibleName,
      phone: item.phone,
      email: item.email,
      created_at: item.createdAt || undefined,
    }));

    return NextResponse.json({ success: true, data: formatted });
  } catch (err) {
    console.error('Error in API GET /api/clientes:', err);
    const msg = err instanceof Error ? err.message : 'Erro interno';
    return NextResponse.json({ success: false, error: msg, data: [] }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, responsibleName, phone, email } = body;

    if (!name) {
      return NextResponse.json(
        { success: false, error: 'O nome da clínica é obrigatório.' },
        { status: 400 }
      );
    }

    const db = getDb();
    const [newClient] = await db
      .insert(schema.clients)
      .values({
        id: crypto.randomUUID(),
        name,
        responsibleName: responsibleName || null,
        phone: phone || null,
        email: email || null,
      })
      .returning();

    const formatted: DBClient = {
      id: newClient.id,
      name: newClient.name,
      responsible_name: newClient.responsibleName,
      phone: newClient.phone,
      email: newClient.email,
      created_at: newClient.createdAt || undefined,
    };

    return NextResponse.json({ success: true, data: formatted });
  } catch (err) {
    console.error('Error in API POST /api/clientes:', err);
    const msg = err instanceof Error ? err.message : 'Erro interno';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
