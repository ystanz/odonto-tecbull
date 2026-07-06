export const runtime = 'edge';

import { NextResponse } from 'next/server';
import { getDb, schema } from '@/lib/supabase';
import { eq, desc } from 'drizzle-orm';

export async function GET() {
  try {
    const db = getDb();

    // 1. Buscar total de clientes (clinics)
    const dbClients = await db.select().from(schema.clients);
    const totalClients = dbClients.length;

    // 2. Buscar total de equipamentos
    const dbEquipments = await db.select().from(schema.equipments);
    const totalEquipments = dbEquipments.length;

    // 3. Buscar total de ordens de serviço ativas (ABERTA, EM ANDAMENTO ou AGUARDANDO PEÇA)
    const dbWorkOrders = await db.select().from(schema.workOrders);
    const activeWorkOrders = dbWorkOrders.filter(
      (wo) => wo.status === 'ABERTA' || wo.status === 'EM ANDAMENTO' || wo.status === 'AGUARDANDO PEÇA'
    ).length;

    // 4. Buscar os 5 últimos chamados criados ordenados por data de criação decrescente
    const recentWos = await db
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
      .orderBy(desc(schema.workOrders.createdAt))
      .limit(5);

    return NextResponse.json({
      success: true,
      data: {
        totalClients,
        totalEquipments,
        activeWorkOrders,
        recentWorkOrders: recentWos,
      },
    });
  } catch (err) {
    console.error('Error in API GET /api/dashboard:', err);
    const msg = err instanceof Error ? err.message : 'Erro interno';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
