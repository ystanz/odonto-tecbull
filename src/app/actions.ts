'use server';

import { getDb, schema } from '@/lib/supabase';
import { eq, desc } from 'drizzle-orm';
import { DBClient, DBLocation, DBEquipment, DBWorkOrder } from '@/lib/types';

// export const runtime = 'edge';

// Helper to check if D1 DB is configured in wrangler/Cloudflare environment
function isConfigured() {
  try {
    const dbBinding = (globalThis as any).DB || process.env.DB;
    return !!dbBinding;
  } catch {
    return false;
  }
}

export async function getClientsAction() {
  try {
    if (!isConfigured()) {
      return { success: false, error: 'DB_NOT_CONFIGURED', data: [] };
    }

    const db = getDb();
    const data = await db
      .select()
      .from(schema.clients)
      .orderBy(schema.clients.name);

    // Mapeando schema.clients para DBClient
    const formatted: DBClient[] = data.map(item => ({
      id: item.id,
      name: item.name,
      created_at: item.createdAt || undefined
    }));

    return { success: true, data: formatted };
  } catch (err) {
    console.error('Error fetching clients:', err);
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return { success: false, error: msg, data: [] };
  }
}

export async function createClientAction(name: string) {
  try {
    if (!isConfigured()) {
      return { success: false, error: 'DB_NOT_CONFIGURED' };
    }

    const db = getDb();
    const [data] = await db
      .insert(schema.clients)
      .values({ name })
      .returning();

    return { 
      success: true, 
      data: {
        id: data.id,
        name: data.name,
        created_at: data.createdAt || undefined
      } as DBClient 
    };
  } catch (err) {
    console.error('Error creating client:', err);
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return { success: false, error: msg };
  }
}

export async function getLocationsAction() {
  try {
    if (!isConfigured()) {
      return { success: false, error: 'DB_NOT_CONFIGURED', data: [] };
    }

    const db = getDb();
    const rows = await db
      .select()
      .from(schema.locations)
      .leftJoin(schema.clients, eq(schema.locations.clientId, schema.clients.id))
      .orderBy(schema.locations.name);

    const formatted: DBLocation[] = rows.map((row) => ({
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
    }));

    return { success: true, data: formatted };
  } catch (err) {
    console.error('Error fetching locations:', err);
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return { success: false, error: msg, data: [] };
  }
}

export async function createLocationAction(clientId: string, name: string, room?: string) {
  try {
    if (!isConfigured()) {
      return { success: false, error: 'DB_NOT_CONFIGURED' };
    }

    const db = getDb();
    const [data] = await db
      .insert(schema.locations)
      .values({ clientId, name, room: room || null })
      .returning();

    return { 
      success: true, 
      data: {
        id: data.id,
        client_id: data.clientId || '',
        name: data.name,
        room: data.room,
        created_at: data.createdAt || undefined
      } as DBLocation 
    };
  } catch (err) {
    console.error('Error creating location:', err);
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return { success: false, error: msg };
  }
}

export async function getEquipmentsAction() {
  try {
    if (!isConfigured()) {
      return { success: false, error: 'DB_NOT_CONFIGURED', data: [] };
    }

    const db = getDb();
    const rows = await db
      .select()
      .from(schema.equipments)
      .leftJoin(schema.locations, eq(schema.equipments.locationId, schema.locations.id))
      .leftJoin(schema.clients, eq(schema.locations.clientId, schema.clients.id))
      .orderBy(desc(schema.equipments.createdAt));

    const formatted: DBEquipment[] = rows.map((row) => ({
      id: row.equipments.id,
      code: row.equipments.code,
      name: row.equipments.name,
      location_id: row.equipments.locationId || '',
      serial_number: row.equipments.serialNumber,
      installation_date: row.equipments.installationDate,
      manufacturer: row.equipments.manufacturer,
      warranty_until: row.equipments.warrantyUntil,
      status: row.equipments.status,
      next_service_date: row.equipments.nextServiceDate,
      created_at: row.equipments.createdAt || undefined,
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

    return { success: true, data: formatted };
  } catch (err) {
    console.error('Error fetching equipments:', err);
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return { success: false, error: msg, data: [] };
  }
}

export async function createEquipmentAction(equipmentData: {
  code?: string | null;
  name: string;
  location_id: string;
  serial_number?: string | null;
  installation_date?: string | null;
  manufacturer?: string | null;
  warranty_until?: string | null;
  status?: string;
  next_service_date?: string | null;
}) {
  try {
    if (!isConfigured()) {
      return { success: false, error: 'DB_NOT_CONFIGURED' };
    }

    const db = getDb();
    const [data] = await db
      .insert(schema.equipments)
      .values({
        code: equipmentData.code || null,
        name: equipmentData.name,
        locationId: equipmentData.location_id,
        serialNumber: equipmentData.serial_number || null,
        installationDate: equipmentData.installation_date || null,
        manufacturer: equipmentData.manufacturer || null,
        warrantyUntil: equipmentData.warranty_until || null,
        status: equipmentData.status || 'Ativo',
        nextServiceDate: equipmentData.next_service_date || null,
      })
      .returning();

    return { 
      success: true, 
      data: {
        id: data.id,
        code: data.code,
        name: data.name,
        location_id: data.locationId || '',
        serial_number: data.serialNumber,
        installation_date: data.installationDate,
        manufacturer: data.manufacturer,
        warranty_until: data.warrantyUntil,
        status: data.status,
        next_service_date: data.nextServiceDate,
        created_at: data.createdAt || undefined
      } as DBEquipment 
    };
  } catch (err) {
    console.error('Error creating equipment:', err);
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return { success: false, error: msg };
  }
}

export async function getWorkOrdersAction() {
  try {
    if (!isConfigured()) {
      return { success: false, error: 'DB_NOT_CONFIGURED', data: [] };
    }

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
        code: row.equipments.code,
        name: row.equipments.name,
        location_id: row.equipments.locationId || '',
        serial_number: row.equipments.serialNumber,
        installation_date: row.equipments.installationDate,
        manufacturer: row.equipments.manufacturer,
        warranty_until: row.equipments.warrantyUntil,
        status: row.equipments.status,
        next_service_date: row.equipments.nextServiceDate,
        created_at: row.equipments.createdAt || undefined
      } : undefined
    }));

    return { success: true, data: formatted };
  } catch (err) {
    console.error('Error fetching work orders:', err);
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return { success: false, error: msg, data: [] };
  }
}

export async function createWorkOrderAction(workOrderData: {
  code: string;
  client_id: string;
  equipment_id: string;
  status: 'ABERTA' | 'EM ANDAMENTO' | 'CONCLUÍDA';
  priority: 'NORMAL' | 'CRÍTICO';
  defect_reported: string;
  parts_used?: string | null;
  work_notes?: string | null;
  image_url?: string | null;
  service_date?: string | null;
  technician_name?: string | null;
}) {
  try {
    if (!isConfigured()) {
      return { success: false, error: 'DB_NOT_CONFIGURED' };
    }

    const db = getDb();
    const [data] = await db
      .insert(schema.workOrders)
      .values({
        code: workOrderData.code,
        clientId: workOrderData.client_id,
        equipmentId: workOrderData.equipment_id,
        status: workOrderData.status || 'ABERTA',
        priority: workOrderData.priority || 'NORMAL',
        defectReported: workOrderData.defect_reported,
        partsUsed: workOrderData.parts_used || null,
        workNotes: workOrderData.work_notes || null,
        imageUrl: workOrderData.image_url || null,
        serviceDate: workOrderData.service_date || null,
        technicianName: workOrderData.technician_name || null,
      })
      .returning();

    return { 
      success: true, 
      data: {
        id: data.id,
        code: data.code,
        client_id: data.clientId || '',
        equipment_id: data.equipmentId || '',
        status: data.status as 'ABERTA' | 'EM ANDAMENTO' | 'CONCLUÍDA',
        priority: data.priority as 'NORMAL' | 'CRÍTICO',
        defect_reported: data.defectReported,
        parts_used: data.partsUsed,
        work_notes: data.workNotes,
        image_url: data.imageUrl,
        service_date: data.serviceDate,
        technician_name: data.technicianName,
        created_at: data.createdAt || undefined
      } as DBWorkOrder 
    };
  } catch (err) {
    console.error('Error creating work order:', err);
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return { success: false, error: msg };
  }
}

export async function updateClientAction(id: string, name: string) {
  try {
    if (!isConfigured()) {
      return { success: false, error: 'DB_NOT_CONFIGURED' };
    }

    const db = getDb();
    const [data] = await db
      .update(schema.clients)
      .set({ name })
      .where(eq(schema.clients.id, id))
      .returning();

    if (!data) {
      return { success: false, error: 'Client not found' };
    }

    return {
      success: true,
      data: {
        id: data.id,
        name: data.name,
        created_at: data.createdAt || undefined
      } as DBClient
    };
  } catch (err) {
    console.error('Error updating client:', err);
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return { success: false, error: msg };
  }
}

export async function deleteClientAction(id: string) {
  try {
    if (!isConfigured()) {
      return { success: false, error: 'DB_NOT_CONFIGURED' };
    }

    const db = getDb();
    const [data] = await db
      .delete(schema.clients)
      .where(eq(schema.clients.id, id))
      .returning();

    if (!data) {
      return { success: false, error: 'Client not found' };
    }

    return { success: true, data: { id: data.id } };
  } catch (err) {
    console.error('Error deleting client:', err);
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return { success: false, error: msg };
  }
}

export async function updateLocationAction(id: string, clientId: string, name: string, room?: string) {
  try {
    if (!isConfigured()) {
      return { success: false, error: 'DB_NOT_CONFIGURED' };
    }

    const db = getDb();
    const [data] = await db
      .update(schema.locations)
      .set({ clientId, name, room: room || null })
      .where(eq(schema.locations.id, id))
      .returning();

    if (!data) {
      return { success: false, error: 'Location not found' };
    }

    return {
      success: true,
      data: {
        id: data.id,
        client_id: data.clientId || '',
        name: data.name,
        room: data.room,
        created_at: data.createdAt || undefined
      } as DBLocation
    };
  } catch (err) {
    console.error('Error updating location:', err);
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return { success: false, error: msg };
  }
}

export async function deleteLocationAction(id: string) {
  try {
    if (!isConfigured()) {
      return { success: false, error: 'DB_NOT_CONFIGURED' };
    }

    const db = getDb();
    const [data] = await db
      .delete(schema.locations)
      .where(eq(schema.locations.id, id))
      .returning();

    if (!data) {
      return { success: false, error: 'Location not found' };
    }

    return { success: true, data: { id: data.id } };
  } catch (err) {
    console.error('Error deleting location:', err);
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return { success: false, error: msg };
  }
}

export async function updateEquipmentAction(
  id: string,
  equipmentData: {
    code?: string | null;
    name: string;
    location_id: string;
    serial_number?: string | null;
    installation_date?: string | null;
    manufacturer?: string | null;
    warranty_until?: string | null;
    status?: string;
    next_service_date?: string | null;
  }
) {
  try {
    if (!isConfigured()) {
      return { success: false, error: 'DB_NOT_CONFIGURED' };
    }

    const db = getDb();
    const [data] = await db
      .update(schema.equipments)
      .set({
        code: equipmentData.code || null,
        name: equipmentData.name,
        locationId: equipmentData.location_id,
        serialNumber: equipmentData.serial_number || null,
        installationDate: equipmentData.installation_date || null,
        manufacturer: equipmentData.manufacturer || null,
        warrantyUntil: equipmentData.warranty_until || null,
        status: equipmentData.status || 'Ativo',
        nextServiceDate: equipmentData.next_service_date || null,
      })
      .where(eq(schema.equipments.id, id))
      .returning();

    if (!data) {
      return { success: false, error: 'Equipment not found' };
    }

    return {
      success: true,
      data: {
        id: data.id,
        code: data.code,
        name: data.name,
        location_id: data.locationId || '',
        serial_number: data.serialNumber,
        installation_date: data.installationDate,
        manufacturer: data.manufacturer,
        warranty_until: data.warrantyUntil,
        status: data.status,
        next_service_date: data.nextServiceDate,
        created_at: data.createdAt || undefined
      } as DBEquipment
    };
  } catch (err) {
    console.error('Error updating equipment:', err);
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return { success: false, error: msg };
  }
}

export async function deleteEquipmentAction(id: string) {
  try {
    if (!isConfigured()) {
      return { success: false, error: 'DB_NOT_CONFIGURED' };
    }

    const db = getDb();
    const [data] = await db
      .delete(schema.equipments)
      .where(eq(schema.equipments.id, id))
      .returning();

    if (!data) {
      return { success: false, error: 'Equipment not found' };
    }

    return { success: true, data: { id: data.id } };
  } catch (err) {
    console.error('Error deleting equipment:', err);
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return { success: false, error: msg };
  }
}

