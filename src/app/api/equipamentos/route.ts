export const runtime = 'edge';

import { NextResponse } from 'next/server';
import { getDb, schema } from '@/lib/supabase';
import { eq, desc } from 'drizzle-orm';
import { DBEquipment } from '@/lib/types';

export async function GET() {
  try {
    const db = getDb();
    
    // Buscar OSs abertas para saber quais equipamentos possuem chamados abertos
    const openWos = await db
      .select({ equipmentId: schema.workOrders.equipmentId })
      .from(schema.workOrders)
      .where(eq(schema.workOrders.status, 'ABERTA'));
    const openWoEquipIds = new Set(openWos.map(wo => wo.equipmentId).filter(Boolean) as string[]);

    const rows = await db
      .select()
      .from(schema.equipments)
      .leftJoin(schema.locations, eq(schema.equipments.locationId, schema.locations.id))
      .leftJoin(schema.clients, eq(schema.locations.clientId, schema.clients.id))
      .orderBy(desc(schema.equipments.createdAt));

    const formatted: DBEquipment[] = rows.map((row) => ({
      id: row.equipments.id,
      name: row.equipments.name,
      location_id: row.equipments.locationId || '',
      serial_number: row.equipments.serialNumber,
      installation_date: row.equipments.installationDate,
      manufacturer: row.equipments.manufacturer,
      status: row.equipments.status,
      next_service_date: row.equipments.nextServiceDate,
      image_data: row.equipments.imageData,
      created_at: row.equipments.createdAt || undefined,
      hasOpenOS: openWoEquipIds.has(row.equipments.id),
      locations: row.locations ? {
        id: row.locations.id,
        client_id: row.locations.clientId || '',
        name: row.locations.name,
        room: row.locations.room,
        created_at: row.locations.createdAt || undefined,
        clients: row.clients ? {
          id: row.clients.id,
          name: row.clients.name,
          created_at: row.clients.createdAt || undefined
        } : undefined
      } : undefined
    }));

    return NextResponse.json({ success: true, data: formatted });
  } catch (err) {
    console.error('Error in API GET /api/equipamentos:', err);
    const msg = err instanceof Error ? err.message : 'Erro interno';
    return NextResponse.json({ success: false, error: msg, data: [] }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, locationId, serialNumber, installationDate, manufacturer, status, nextServiceDate, imageData } = body;

    if (!name) {
      return NextResponse.json(
        { success: false, error: 'O nome do equipamento é obrigatório.' },
        { status: 400 }
      );
    }

    const db = getDb();
    const [newEquipment] = await db
      .insert(schema.equipments)
      .values({
        id: crypto.randomUUID(),
        name,
        locationId: locationId || null,
        serialNumber: serialNumber || null,
        installationDate: installationDate || null,
        manufacturer: manufacturer || null,
        status: status || 'Ativo',
        nextServiceDate: nextServiceDate || null,
        imageData: imageData || null,
      })
      .returning();

    const formatted: DBEquipment = {
      id: newEquipment.id,
      name: newEquipment.name,
      location_id: newEquipment.locationId || '',
      serial_number: newEquipment.serialNumber,
      installation_date: newEquipment.installationDate,
      manufacturer: newEquipment.manufacturer,
      status: newEquipment.status,
      next_service_date: newEquipment.nextServiceDate,
      image_data: newEquipment.imageData,
      created_at: newEquipment.createdAt || undefined,
    };

    return NextResponse.json({ success: true, data: formatted });
  } catch (err) {
    console.error('Error in API POST /api/equipamentos:', err);
    const msg = err instanceof Error ? err.message : 'Erro interno';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
