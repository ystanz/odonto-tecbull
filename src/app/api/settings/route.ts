export const runtime = 'edge';

import { NextResponse } from 'next/server';
import { getDb, schema } from '@/lib/supabase';

export async function GET() {
  try {
    const db = getDb();
    const rows = await db.select().from(schema.settings).limit(1);
    const config = rows[0] || null;
    
    return NextResponse.json({ success: true, data: config });
  } catch (err) {
    console.error('Error in API GET /api/settings:', err);
    const msg = err instanceof Error ? err.message : 'Erro interno';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { companyName, ownerName, phone, email, address } = body;
    
    const db = getDb();
    const [updated] = await db
      .insert(schema.settings)
      .values({
        id: 1,
        companyName: companyName || null,
        ownerName: ownerName || null,
        phone: phone || null,
        email: email || null,
        address: address || null,
      })
      .onConflictDoUpdate({
        target: schema.settings.id,
        set: {
          companyName: companyName || null,
          ownerName: ownerName || null,
          phone: phone || null,
          email: email || null,
          address: address || null,
        },
      })
      .returning();

    return NextResponse.json({ success: true, data: updated });
  } catch (err) {
    console.error('Error in API PUT /api/settings:', err);
    const msg = err instanceof Error ? err.message : 'Erro interno';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
