export const runtime = 'edge';

import { NextResponse } from 'next/server';
import { getDb, schema } from '@/lib/supabase';
import { eq, desc } from 'drizzle-orm';
import { DBWorkOrder } from '@/lib/types';

export async function GET() {
  try {
    const db = getDb();
    const rows = await db
      .select()
      .from(schema.workOrders)
      .leftJoin(schema.clients, eq(schema.workOrders.clientId, schema.clients.id))
      .leftJoin(schema.equipments, eq(schema.workOrders.equipmentId, schema.equipments.id))
      .orderBy(desc(schema.workOrders.createdAt));

    const formatted: DBWorkOrder[] = rows.map((row) => ({
      id: row.work_orders.id,
      code: row.work_orders.code,
      client_id: row.work_orders.clientId || '',
      equipment_id: row.work_orders.equipmentId || '',
      status: row.work_orders.status as 'ABERTA' | 'EM ANDAMENTO' | 'AGUARDANDO PEÇA' | 'CONCLUÍDA',
      priority: row.work_orders.priority as 'NORMAL' | 'CRÍTICO',
      defect_reported: row.work_orders.defectReported,
      parts_used: row.work_orders.partsUsed,
      work_notes: row.work_orders.workNotes,
      image_url: row.work_orders.imageUrl,
      service_date: row.work_orders.serviceDate,
      technician_name: row.work_orders.technicianName,
      created_at: row.work_orders.createdAt || undefined,
      clients: row.clients ? {
        id: row.clients.id,
        name: row.clients.name,
        created_at: row.clients.createdAt || undefined
      } : undefined,
      equipments: row.equipments ? {
        id: row.equipments.id,
        name: row.equipments.name,
        location_id: row.equipments.locationId || '',
        serial_number: row.equipments.serialNumber,
        installation_date: row.equipments.installationDate,
        manufacturer: row.equipments.manufacturer,
        status: row.equipments.status,
        next_service_date: row.equipments.nextServiceDate,
        created_at: row.equipments.createdAt || undefined
      } : undefined
    }));

    return NextResponse.json({ success: true, data: formatted });
  } catch (err) {
    console.error('Error in API GET /api/ordens-servico:', err);
    const msg = err instanceof Error ? err.message : 'Erro interno';
    return NextResponse.json({ success: false, error: msg, data: [] }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      code,
      clientId,
      equipmentId,
      status,
      priority,
      defectReported,
      partsUsed,
      workNotes,
      imageUrl,
      serviceDate,
      technicianName,
    } = body;

    if (!code || !clientId || !equipmentId || !defectReported) {
      return NextResponse.json(
        { success: false, error: 'code, clientId, equipmentId e defectReported são obrigatórios.' },
        { status: 400 }
      );
    }

    const db = getDb();
    const [newWorkOrder] = await db
      .insert(schema.workOrders)
      .values({
        id: crypto.randomUUID(),
        code,
        clientId,
        equipmentId,
        status: status || 'ABERTA',
        priority: priority || 'NORMAL',
        defectReported,
        partsUsed: partsUsed || null,
        workNotes: workNotes || null,
        imageUrl: imageUrl || null,
        serviceDate: serviceDate || null,
        technicianName: technicianName || null,
      })
      .returning();

    const formatted: DBWorkOrder = {
      id: newWorkOrder.id,
      code: newWorkOrder.code,
      client_id: newWorkOrder.clientId || '',
      equipment_id: newWorkOrder.equipmentId || '',
      status: newWorkOrder.status as 'ABERTA' | 'EM ANDAMENTO' | 'AGUARDANDO PEÇA' | 'CONCLUÍDA',
      priority: newWorkOrder.priority as 'NORMAL' | 'CRÍTICO',
      defect_reported: newWorkOrder.defectReported,
      parts_used: newWorkOrder.partsUsed,
      work_notes: newWorkOrder.workNotes,
      image_url: newWorkOrder.imageUrl,
      service_date: newWorkOrder.serviceDate,
      technician_name: newWorkOrder.technicianName,
      created_at: newWorkOrder.createdAt || undefined,
    };

    return NextResponse.json({ success: true, data: formatted });
  } catch (err) {
    console.error('Error in API POST /api/ordens-servico:', err);
    const msg = err instanceof Error ? err.message : 'Erro interno';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
