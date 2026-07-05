export const runtime = 'edge';

import { NextResponse } from 'next/server';
import { getDb, schema } from '@/lib/supabase';
import { eq } from 'drizzle-orm';
import { DBWorkOrder } from '@/lib/types';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const db = getDb();

    const [row] = await db
      .select()
      .from(schema.workOrders)
      .leftJoin(schema.clients, eq(schema.workOrders.clientId, schema.clients.id))
      .leftJoin(schema.equipments, eq(schema.workOrders.equipmentId, schema.equipments.id))
      .where(eq(schema.workOrders.id, id))
      .limit(1);

    if (!row) {
      return NextResponse.json(
        { success: false, error: 'Ordem de serviço não encontrada.' },
        { status: 404 }
      );
    }

    const formatted: DBWorkOrder = {
      id: row.work_orders.id,
      code: row.work_orders.code,
      client_id: row.work_orders.clientId || '',
      equipment_id: row.work_orders.equipmentId || '',
      status: row.work_orders.status as 'ABERTA' | 'EM ANDAMENTO' | 'CONCLUÍDA',
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
    };

    return NextResponse.json({ success: true, data: formatted });
  } catch (err) {
    console.error('Error in API GET /api/os/[id]:', err);
    const msg = err instanceof Error ? err.message : 'Erro interno';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status, priority, defectReported, partsUsed, workNotes, imageUrl, serviceDate, technicianName } = body;

    const db = getDb();
    const [updated] = await db
      .update(schema.workOrders)
      .set({
        status: status || undefined,
        priority: priority || undefined,
        defectReported: defectReported || undefined,
        partsUsed: partsUsed === undefined ? undefined : partsUsed,
        workNotes: workNotes === undefined ? undefined : workNotes,
        imageUrl: imageUrl === undefined ? undefined : imageUrl,
        serviceDate: serviceDate === undefined ? undefined : serviceDate,
        technicianName: technicianName === undefined ? undefined : technicianName,
      })
      .where(eq(schema.workOrders.id, id))
      .returning();

    if (!updated) {
      return NextResponse.json(
        { success: false, error: 'Ordem de serviço não encontrada.' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (err) {
    console.error('Error in API PUT /api/os/[id]:', err);
    const msg = err instanceof Error ? err.message : 'Erro interno';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const db = getDb();

    const [deleted] = await db
      .delete(schema.workOrders)
      .where(eq(schema.workOrders.id, id))
      .returning();

    if (!deleted) {
      return NextResponse.json(
        { success: false, error: 'Ordem de serviço não encontrada.' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: { id: deleted.id } });
  } catch (err) {
    console.error('Error in API DELETE /api/os/[id]:', err);
    const msg = err instanceof Error ? err.message : 'Erro interno';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
