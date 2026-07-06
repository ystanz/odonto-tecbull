export const runtime = 'edge';

import { NextResponse } from 'next/server';
import { getDb, schema } from '@/lib/supabase';
import { eq, like, or } from 'drizzle-orm';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q') || '';

    if (!q.trim()) {
      return NextResponse.json({
        success: true,
        data: { clients: [], equipments: [], os: [] }
      });
    }

    const db = getDb();
    const queryTerm = `%${q}%`;

    // 1. Buscar Clientes por Nome ou Email
    const clientsList = await db
      .select()
      .from(schema.clients)
      .where(
        or(
          like(schema.clients.name, queryTerm),
          like(schema.clients.email, queryTerm)
        )
      )
      .limit(20);

    // 2. Buscar Equipamentos por Nome ou Número de Série
    const equipmentsList = await db
      .select()
      .from(schema.equipments)
      .where(
        or(
          like(schema.equipments.name, queryTerm),
          like(schema.equipments.serialNumber, queryTerm)
        )
      )
      .limit(20);

    // 3. Buscar Ordens de Serviço por Código, ID ou Defeito Relatado
    const osList = await db
      .select({
        id: schema.workOrders.id,
        code: schema.workOrders.code,
        status: schema.workOrders.status,
        priority: schema.workOrders.priority,
        defectReported: schema.workOrders.defectReported,
        createdAt: schema.workOrders.createdAt,
        clientName: schema.clients.name,
        equipmentName: schema.equipments.name,
      })
      .from(schema.workOrders)
      .leftJoin(schema.clients, eq(schema.workOrders.clientId, schema.clients.id))
      .leftJoin(schema.equipments, eq(schema.workOrders.equipmentId, schema.equipments.id))
      .where(
        or(
          like(schema.workOrders.code, queryTerm),
          like(schema.workOrders.defectReported, queryTerm),
          like(schema.workOrders.id, queryTerm)
        )
      )
      .limit(20);

    const formattedClients = clientsList.map(c => ({
      id: c.id,
      name: c.name,
      email: c.email,
      responsibleName: c.responsibleName,
      phone: c.phone,
    }));

    const formattedEquipments = equipmentsList.map(e => ({
      id: e.id,
      name: e.name,
      serialNumber: e.serialNumber,
      manufacturer: e.manufacturer,
      status: e.status,
    }));

    return NextResponse.json({
      success: true,
      data: {
        clients: formattedClients,
        equipments: formattedEquipments,
        os: osList
      }
    });
  } catch (err) {
    console.error('Error in API GET /api/busca:', err);
    const msg = err instanceof Error ? err.message : 'Erro interno';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
