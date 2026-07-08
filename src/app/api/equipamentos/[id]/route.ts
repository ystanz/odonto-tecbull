export const runtime = 'edge';

import { NextResponse } from 'next/server';
import { getDb, schema } from '@/lib/supabase';
import { eq, desc } from 'drizzle-orm';
import { DBClient, DBLocation } from '@/lib/types';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const db = getDb();

    // Fetch clients directly from D1 using Drizzle
    const rawClients = await db
      .select()
      .from(schema.clients)
      .orderBy(schema.clients.name);

    const clientsList: DBClient[] = rawClients.map(item => ({
      id: item.id,
      name: item.name,
      responsible_name: item.responsibleName,
      phone: item.phone,
      email: item.email,
      created_at: item.createdAt || undefined,
    }));

    // Fetch locations directly from D1 using Drizzle
    const rowsLocations = await db
      .select()
      .from(schema.locations)
      .leftJoin(schema.clients, eq(schema.locations.clientId, schema.clients.id))
      .orderBy(schema.locations.name);

    const locationsList: DBLocation[] = rowsLocations.map(row => ({
      id: row.locations.id,
      client_id: row.locations.clientId || '',
      name: row.locations.name,
      room: row.locations.room,
      address: row.locations.address,
      contact: row.locations.contact,
      notes: row.locations.notes,
      created_at: row.locations.createdAt || undefined,
      clients: row.clients ? {
        id: row.clients.id,
        name: row.clients.name,
        responsible_name: row.clients.responsibleName,
        phone: row.clients.phone,
        email: row.clients.email,
        created_at: row.clients.createdAt || undefined
      } : undefined
    }));

    // Fetch equipment with locations and clients using Drizzle join
    const rows = await db
      .select({
        id: schema.equipments.id,
        name: schema.equipments.name,
        serialNumber: schema.equipments.serialNumber,
        installationDate: schema.equipments.installationDate,
        manufacturer: schema.equipments.manufacturer,
        status: schema.equipments.status,
        nextServiceDate: schema.equipments.nextServiceDate,
        locationId: schema.equipments.locationId,
        clientId: schema.locations.clientId,
        locationName: schema.locations.name,
        locationRoom: schema.locations.room,
        clientName: schema.clients.name,
        imageData: schema.equipments.imageData
      })
      .from(schema.equipments)
      .leftJoin(schema.locations, eq(schema.equipments.locationId, schema.locations.id))
      .leftJoin(schema.clients, eq(schema.locations.clientId, schema.clients.id))
      .where(eq(schema.equipments.id, id))
      .limit(1);

    const dbEq = rows[0];

    if (!dbEq) {
      return NextResponse.json(
        { success: false, error: 'Equipamento não encontrado.' },
        { status: 404 }
      );
    }

    // Fetch completed work orders for this equipment as history
    const dbWos = await db
      .select()
      .from(schema.workOrders)
      .where(eq(schema.workOrders.equipmentId, id))
      .orderBy(desc(schema.workOrders.serviceDate));

    const timeline = dbWos.map((wo) => ({
      id: wo.id,
      date: wo.serviceDate || wo.createdAt?.split('T')[0] || 'N/A',
      title: wo.status === 'CONCLUÍDA' ? 'Manutenção Corretiva' : 'Solicitação de Reparo',
      description: wo.defectReported,
      partsUsed: wo.partsUsed || null,
      technician: wo.technicianName || 'Técnico Não Definido',
      status: wo.status,
      icon: wo.status === 'CONCLUÍDA' ? 'check_circle' : 'build'
    }));

    return NextResponse.json({
      success: true,
      data: {
        equipment: {
          id: dbEq.id,
          name: dbEq.name,
          locationId: dbEq.locationId || '',
          clientId: dbEq.clientId || '',
          serialNumber: dbEq.serialNumber || 'N/A',
          installationDate: dbEq.installationDate || 'N/A',
          manufacturer: dbEq.manufacturer || 'N/A',
          status: dbEq.status,
          nextServiceDate: dbEq.nextServiceDate || 'N/A',
          imageData: dbEq.imageData,
          locationName: dbEq.locationName
            ? `${dbEq.clientName || ''} > ${dbEq.locationName}${dbEq.locationRoom ? ` - ${dbEq.locationRoom}` : ''}`
            : 'Unidade Geral'
        },
        timeline,
        clients: clientsList,
        locations: locationsList,
      }
    });
  } catch (err) {
    console.error('Error in API GET /api/equipamentos/[id]:', err);
    const msg = err instanceof Error ? err.message : 'Erro interno';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, locationId, serialNumber, installationDate, manufacturer, status, nextServiceDate, imageData } = body;

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
        imageData: imageData !== undefined ? (imageData || null) : undefined,
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
