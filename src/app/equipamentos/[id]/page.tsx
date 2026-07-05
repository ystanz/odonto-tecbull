export const runtime = 'edge';
export const dynamic = 'force-dynamic';
import React from 'react';
import Navigation from '@/components/Navigation';
import { getDb, schema } from '@/lib/supabase';
import { eq, desc } from 'drizzle-orm';
import Link from 'next/link';
import EditEquipmentButton from '@/components/EditEquipmentButton';
import { getClientsAction, getLocationsAction } from '@/app/actions';
import { DBClient, DBLocation } from '@/lib/types';

interface PageProps {
  params: Promise<{ id: string }>;
}

interface EquipmentSpecs {
  name: string;
  locationName: string;
  serialNumber: string;
  installationDate: string;
  manufacturer: string;
  status: string;
  nextServiceDate: string;
  nextServiceDays: number;
}

interface TimelineItem {
  date: string;
  title: string;
  description: string;
  partsUsed: string | null;
  technician: string;
  status: string;
  icon: string;
}

export default async function EquipmentDetailPage({ params }: PageProps) {
  const { id } = await params;

  let equipment: EquipmentSpecs | null = null;
  let timeline: TimelineItem[] = [];
  let clientsList: DBClient[] = [];
  let locationsList: DBLocation[] = [];
  let dbEq: any = null;

  try {
    const db = getDb();
    // Fetch clients and locations
    const resClients = await getClientsAction();
    if (resClients.success) {
        clientsList = resClients.data;
      }
      const resLocs = await getLocationsAction();
      if (resLocs.success) {
        locationsList = resLocs.data;
      }

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
          clientName: schema.clients.name
        })
        .from(schema.equipments)
        .leftJoin(schema.locations, eq(schema.equipments.locationId, schema.locations.id))
        .leftJoin(schema.clients, eq(schema.locations.clientId, schema.clients.id))
        .where(eq(schema.equipments.id, id))
        .limit(1);

      dbEq = rows[0];

      if (dbEq) {
        const locationPath = dbEq.locationName
          ? `${dbEq.clientName || ''} > ${dbEq.locationName}${dbEq.locationRoom ? ` - ${dbEq.locationRoom}` : ''}`
          : 'Unidade Geral';

        // Calculate days to next service
        let days = 0;
        if (dbEq.nextServiceDate) {
          const serviceDate = new Date(dbEq.nextServiceDate);
          const today = new Date();
          const diffTime = serviceDate.getTime() - today.getTime();
          days = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
        }

        equipment = {
          name: dbEq.name,
          locationName: locationPath,
          serialNumber: dbEq.serialNumber || 'N/A',
          installationDate: dbEq.installationDate || 'N/A',
          manufacturer: dbEq.manufacturer || 'N/A',
          status: dbEq.status,
          nextServiceDate: dbEq.nextServiceDate || 'N/A',
          nextServiceDays: days
        };

        // Fetch completed work orders for this equipment as history
        const dbWos = await db
          .select()
          .from(schema.workOrders)
          .where(eq(schema.workOrders.equipmentId, id))
          .orderBy(desc(schema.workOrders.serviceDate));

        if (dbWos && dbWos.length > 0) {
          timeline = dbWos.map((wo) => ({
            date: wo.serviceDate || wo.createdAt?.split('T')[0] || 'N/A',
            title: wo.status === 'CONCLUÍDA' ? 'Manutenção Corretiva' : 'Solicitação de Reparo',
            description: wo.defectReported,
            partsUsed: wo.partsUsed || null,
            technician: wo.technicianName || 'Técnico Não Definido',
            status: wo.status,
            icon: wo.status === 'CONCLUÍDA' ? 'check_circle' : 'build'
          }));
        }
      }
  } catch (e) {
    console.error('Erro ao conectar D1 nos equipamentos:', e);
  }

  if (!equipment) {
    return (
      <Navigation currentTab="equipment">
        <main className="px-md py-lg max-w-3xl mx-auto space-y-lg text-center flex flex-col items-center justify-center min-h-[50vh]">
          <span className="material-symbols-outlined text-outline text-6xl">precision_manufacturing</span>
          <h2 className="font-headline-md text-headline-md text-on-surface font-bold mt-md">
            Equipamento não encontrado
          </h2>
          <p className="font-body-md text-body-md text-on-surface-variant max-w-md mt-xs">
            O equipamento solicitado não foi encontrado no banco de dados. Ele pode ter sido excluído ou o ID está incorreto.
          </p>
          <Link
            prefetch={false}
            href="/clientes"
            className="mt-lg h-12 px-6 bg-primary text-on-primary hover:bg-primary/95 font-label-caps text-label-caps rounded-xl transition-colors flex items-center justify-center gap-1 font-semibold shadow-sm cursor-pointer"
          >
            <span className="material-symbols-outlined">arrow_back</span>
            Voltar para Clientes
          </Link>
        </main>
      </Navigation>
    );
  }

  const editEqData = {
    id: id,
    name: equipment.name,
    locationId: dbEq ? (dbEq.locationId || '') : '',
    clientId: dbEq ? (dbEq.clientId || '') : '',
    serialNumber: equipment.serialNumber === 'N/A' ? '' : equipment.serialNumber,
    installationDate: equipment.installationDate === 'N/A' ? '' : equipment.installationDate,
    manufacturer: equipment.manufacturer === 'N/A' ? '' : equipment.manufacturer,
    status: equipment.status,
    nextServiceDate: equipment.nextServiceDate === 'N/A' ? '' : equipment.nextServiceDate,
  };

  return (
    <Navigation currentTab="equipment">
      <main className="px-md py-lg max-w-3xl mx-auto space-y-lg">

        {/* Header Navigation link back */}
        <div className="flex items-center space-x-2 text-on-surface-variant font-body-md mb-xs">
          <Link prefetch={false} href="/clientes" className="hover:text-primary flex items-center">
            <span className="material-symbols-outlined text-md mr-1">arrow_back</span>
            Voltar para Clientes
          </Link>
        </div>

        {/* Status & Image Header */}
        <div className="flex flex-col sm:flex-row items-start justify-between gap-md bg-surface-container-lowest p-md rounded-xl border border-outline/10 shadow-level-1">
          <div className="flex flex-col sm:flex-row items-start gap-md">
            <div className="flex-shrink-0 w-24 h-24 bg-primary/10 rounded-xl overflow-hidden shadow-sm relative flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-4xl">precision_manufacturing</span>
            </div>
            <div className="flex flex-col justify-center py-xs">
              <div className={`inline-flex items-center px-sm py-base rounded-full ${equipment.status === 'Ativo' ? 'bg-tertiary/15 text-tertiary' : 'bg-secondary-container/15 text-secondary'
                } mb-xs w-max`}>
                <span className={`w-2 h-2 rounded-full ${equipment.status === 'Ativo' ? 'bg-tertiary' : 'bg-secondary'} mr-2`}></span>
                <span className="font-label-caps text-label-caps">{equipment.status}</span>
              </div>
              <h1 className="font-headline-sm text-headline-sm text-on-surface mb-1">
                {equipment.name}
              </h1>
              <p className="font-body-md text-body-md text-on-surface-variant flex items-center gap-1">
                <span className="material-symbols-outlined text-[16px]">location_on</span>
                {equipment.locationName}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 self-stretch sm:self-auto justify-end mt-xs sm:mt-0">
            <Link
              prefetch={false}
              href={`/os/nova?eqId=${id}`}
              className="h-10 px-4 bg-primary text-on-primary hover:bg-primary/95 font-label-caps text-label-caps rounded-xl transition-colors flex items-center justify-center gap-1 cursor-pointer font-semibold shadow-sm text-sm"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
              <span>Registrar Atendimento</span>
            </Link>

            <EditEquipmentButton
              equipment={editEqData}
              clients={clientsList}
              locations={locationsList}
            />
          </div>
        </div>

        {/* Technical Specs Card */}
        <div className="bg-surface-container-lowest rounded-xl shadow-[0_2px_8px_rgba(30,42,45,0.05)] p-md border border-outline/10">
          <h2 className="font-label-caps text-label-caps text-on-surface-variant mb-sm">Especificações Técnicas</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-sm">
            <div>
              <span className="block font-label-caps text-label-caps text-outline mb-1">Serial Number</span>
              <span className="block font-technical-code text-technical-code text-on-surface">{equipment.serialNumber}</span>
            </div>
            <div>
              <span className="block font-label-caps text-label-caps text-outline mb-1">Data da Instalação</span>
              <span className="block font-technical-code text-technical-code text-on-surface">{equipment.installationDate}</span>
            </div>
            <div>
              <span className="block font-label-caps text-label-caps text-outline mb-1">Fabricante</span>
              <span className="block font-body-md text-body-md text-on-surface">{equipment.manufacturer}</span>
            </div>
          </div>
        </div>

        {/* Preventative Maintenance Progress Card */}
        <div className="bg-surface-container-lowest rounded-xl shadow-[0_2px_8px_rgba(30,42,45,0.05)] p-md border border-outline/10 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-sm">
            <span className="material-symbols-outlined text-secondary" style={{ fontVariationSettings: '"FILL" 1' }}>warning</span>
          </div>
          <h2 className="font-label-caps text-label-caps text-on-surface-variant mb-sm">Próxima Preventiva</h2>
          <div className="flex items-end justify-between mb-2">
            <span className="font-headline-md text-headline-md text-on-surface">{equipment.nextServiceDays} Dias</span>
            <span className="font-technical-code text-technical-code text-secondary">{equipment.nextServiceDate}</span>
          </div>
          <div className="w-full bg-surface-variant rounded-full h-2 mt-sm overflow-hidden">
            <div className="bg-secondary h-2 rounded-full" style={{ width: '85%' }}></div>
          </div>
          <p className="font-body-md text-body-md text-on-surface-variant mt-sm">Agendado para revisão geral do sistema hidráulico e elétrico.</p>
        </div>

        {/* Vertical Maintenance Timeline */}
        <div className="mt-lg">
          <h2 className="font-headline-sm text-headline-sm text-on-surface mb-md">Histórico de Manutenção</h2>
          <div className="relative pl-xs">
            {timeline.map((item, index) => (
              <div key={index} className="relative flex gap-md pb-lg timeline-item">
                <div className="timeline-line"></div>
                <div className="relative z-10 w-6 h-6 rounded-full bg-surface-container-lowest border-2 border-primary flex items-center justify-center flex-shrink-0 mt-1 shadow-sm">
                  <span className="material-symbols-outlined text-[14px] text-primary">{item.icon}</span>
                </div>
                <div className="flex-1 bg-surface-container-lowest rounded-xl shadow-[0_2px_8px_rgba(30,42,45,0.05)] p-sm border border-outline/10">
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-technical-code text-technical-code text-on-surface-variant">{item.date}</span>
                    <div className="inline-flex items-center px-2 py-0.5 rounded-sm bg-tertiary/15">
                      <span className="font-technical-code text-[10px] text-tertiary">{item.status}</span>
                    </div>
                  </div>
                  <h3 className="font-body-md text-body-md font-medium text-on-surface mb-1">{item.title}</h3>
                  <p className="font-body-md text-body-md text-on-surface-variant mb-sm">{item.description}</p>
                  {item.partsUsed && (
                    <div className="mb-sm flex items-center gap-xs text-[12px] text-on-surface-variant bg-surface p-xs rounded border border-outline/5">
                      <span className="material-symbols-outlined text-[16px] text-primary">build_circle</span>
                      <span><strong>Peças Utilizadas:</strong> {item.partsUsed}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-xs">
                    <div className="w-6 h-6 rounded-full bg-surface-variant overflow-hidden flex items-center justify-center">
                      <span className="material-symbols-outlined text-[16px] text-on-surface-variant">person</span>
                    </div>
                    <span className="font-label-caps text-label-caps text-on-surface-variant">Tech: {item.technician}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* FAB Mobile Only */}
      <div className="fixed bottom-[88px] right-md z-40 md:hidden">
        <Link
          prefetch={false}
          href={`/os/nova?eqId=${id}`}
          className="bg-primary text-on-primary rounded-xl h-[56px] px-lg flex items-center gap-sm shadow-[0_8px_24px_rgba(30,42,45,0.12)] hover:bg-primary/90 active:scale-95 transition-all"
        >
          <span className="material-symbols-outlined">add</span>
          <span className="font-label-caps text-label-caps">Registrar Atendimento</span>
        </Link>
      </div>
    </Navigation>
  );
}
