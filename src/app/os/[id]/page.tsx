export const runtime = 'edge';
export const dynamic = 'force-dynamic';

import React from 'react';
import Navigation from '@/components/Navigation';
import Link from 'next/link';
import OSDetailsUI from '@/components/OSDetailsUI';
import { getDb, schema } from '@/lib/supabase';
import { eq, desc } from 'drizzle-orm';
import { headers } from 'next/headers';
import { DBWorkOrder, DBWorkNote } from '@/lib/types';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function OSDetailPage({ params }: PageProps) {
  const { id } = await params;
  await headers(); // Hack to force Next.js and Cloudflare to treat this as dynamic

  let workOrder: DBWorkOrder | null = null;
  let notes: DBWorkNote[] = [];
  let errorMsg = null;

  try {
    const db = getDb();
    
    // Buscar OS com relacionamentos de cliente e equipamento
    const [row] = await db
      .select()
      .from(schema.workOrders)
      .leftJoin(schema.clients, eq(schema.workOrders.clientId, schema.clients.id))
      .leftJoin(schema.equipments, eq(schema.workOrders.equipmentId, schema.equipments.id))
      .where(eq(schema.workOrders.id, id))
      .limit(1);

    if (row) {
      workOrder = {
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

      // Buscar notas internas do chamado
      const list = await db
        .select()
        .from(schema.workNotes)
        .where(eq(schema.workNotes.osId, id))
        .orderBy(desc(schema.workNotes.createdAt));

      notes = list.map((n) => ({
        id: n.id,
        os_id: n.osId,
        note: n.note,
        created_at: n.createdAt || undefined,
      }));
    } else {
      errorMsg = 'Ordem de serviço não encontrada.';
    }
  } catch (err) {
    console.error('Erro ao buscar ordem de serviço no servidor:', err);
    errorMsg = 'Erro de conexão com o banco de dados.';
  }

  if (errorMsg || !workOrder) {
    return (
      <Navigation currentTab="service">
        <main className="px-md py-lg max-w-3xl mx-auto space-y-lg text-center flex flex-col items-center justify-center min-h-[50vh]">
          <span className="material-symbols-outlined text-outline text-6xl">report_off</span>
          <h2 className="font-headline-md text-headline-md text-on-surface font-bold mt-sm">
            Chamado não encontrado
          </h2>
          <p className="text-on-surface-variant font-body-md max-w-md mt-xs">
            {errorMsg || 'A ordem de serviço solicitada não pôde ser recuperada ou foi removida.'}
          </p>
          <Link
            prefetch={false}
            href="/ordens-servico"
            className="mt-lg h-12 px-6 bg-primary text-on-primary hover:bg-primary/95 font-label-caps text-label-caps rounded-xl transition-colors flex items-center justify-center gap-1 font-semibold shadow-sm cursor-pointer"
          >
            <span className="material-symbols-outlined">arrow_back</span>
            Voltar para Ordens de Serviço
          </Link>
        </main>
      </Navigation>
    );
  }

  return (
    <OSDetailsUI
      initialWorkOrder={workOrder}
      initialWorkNotes={notes}
    />
  );
}
