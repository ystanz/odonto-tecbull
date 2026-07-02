import React from 'react';
import Navigation from '@/components/Navigation';
import { db, schema } from '@/lib/supabase';
import { eq, desc } from 'drizzle-orm';
import Link from 'next/link';

interface EquipmentSpecs {
  code: string;
  name: string;
  locationName: string;
  serialNumber: string;
  installationDate: string;
  manufacturer: string;
  warrantyUntil: string;
  status: string;
  nextServiceDate: string;
  nextServiceDays: number;
}

interface TimelineItem {
  date: string;
  title: string;
  description: string;
  technician: string;
  status: string;
  icon: string;
}

const mockEquipment: EquipmentSpecs = {
  code: 'CD001',
  name: 'Cadeira Gnatus G3',
  locationName: 'Clínica Sorriso > Unidade Centro',
  serialNumber: 'GN-2023-8942A',
  installationDate: '2023-04-12',
  manufacturer: 'Gnatus',
  warrantyUntil: '2025-04-12',
  status: 'Ativo',
  nextServiceDate: '2024-06-15',
  nextServiceDays: 15
};

const mockTimeline: TimelineItem[] = [
  {
    date: '2024-02-10',
    title: 'Troca de Óleo do Compressor',
    description: 'Substituição do óleo sintético, limpeza de filtros e verificação de pressão.',
    technician: 'Marcos S.',
    status: 'CONCLUÍDO',
    icon: 'build'
  },
  {
    date: '2023-11-05',
    title: 'Reparo no Pedal de Comando',
    description: 'Substituição da mola de retorno e ajuste de sensibilidade do acionamento pneumático.',
    technician: 'Ana L.',
    status: 'CONCLUÍDO',
    icon: 'healing'
  },
  {
    date: '2023-04-12',
    title: 'Instalação Inicial',
    description: 'Montagem e teste de conformidade de pressão e energia na sala 01.',
    technician: 'Ana L.',
    status: 'CONCLUÍDO',
    icon: 'play_arrow'
  }
];

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EquipmentDetailPage({ params }: PageProps) {
  const { id } = await params;

  let equipment = { ...mockEquipment };
  let timeline = [...mockTimeline];
  let isDemoMode = true;

  try {
    if (typeof process !== 'undefined' && (process.env as Record<string, unknown>).DB) {
      // Fetch equipment with locations and clients using Drizzle join
      const rows = await db
        .select({
          id: schema.equipments.id,
          code: schema.equipments.code,
          name: schema.equipments.name,
          serialNumber: schema.equipments.serialNumber,
          installationDate: schema.equipments.installationDate,
          manufacturer: schema.equipments.manufacturer,
          warrantyUntil: schema.equipments.warrantyUntil,
          status: schema.equipments.status,
          nextServiceDate: schema.equipments.nextServiceDate,
          locationName: schema.locations.name,
          locationRoom: schema.locations.room,
          clientName: schema.clients.name
        })
        .from(schema.equipments)
        .leftJoin(schema.locations, eq(schema.equipments.locationId, schema.locations.id))
        .leftJoin(schema.clients, eq(schema.locations.clientId, schema.clients.id))
        .where(eq(schema.equipments.id, id))
        .limit(1);

      const dbEq = rows[0];

      if (dbEq) {
        isDemoMode = false;
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
          code: dbEq.code,
          name: dbEq.name,
          locationName: locationPath,
          serialNumber: dbEq.serialNumber || 'N/A',
          installationDate: dbEq.installationDate || 'N/A',
          manufacturer: dbEq.manufacturer || 'N/A',
          warrantyUntil: dbEq.warrantyUntil || 'N/A',
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
            technician: wo.technicianName || 'Técnico Não Definido',
            status: wo.status,
            icon: wo.status === 'CONCLUÍDA' ? 'check_circle' : 'build'
          }));
        }
      }
    }
  } catch (e) {
    console.error('Erro ao conectar D1 nos equipamentos, usando fallback:', e);
  }

  return (
    <Navigation currentTab="equipment">
      <main className="px-md py-lg max-w-3xl mx-auto space-y-lg">
        
        {/* Banner de Demonstração */}
        {isDemoMode && (
          <div className="mb-md bg-secondary-container/15 border border-secondary/20 text-secondary p-sm rounded-xl flex items-center gap-sm">
            <span className="material-symbols-outlined shrink-0" style={{ fontVariationSettings: '"FILL" 1' }}>info</span>
            <div className="font-body-md text-body-md">
              <strong>Modo de Demonstração Ativo</strong>: Cloudflare D1 não configurado. Exibindo especificações e histórico simulados.
            </div>
          </div>
        )}

        {/* Header Navigation link back */}
        <div className="flex items-center space-x-2 text-on-surface-variant font-body-md mb-xs">
          <Link href="/clientes" className="hover:text-primary flex items-center">
            <span className="material-symbols-outlined text-md mr-1">arrow_back</span>
            Voltar para Clientes
          </Link>
        </div>

        {/* Status & Image Header */}
        <div className="flex flex-col sm:flex-row items-start gap-md bg-surface-container-lowest p-md rounded-xl border border-outline/10 shadow-level-1">
          <div className="flex-shrink-0 w-24 h-24 bg-primary/10 rounded-xl overflow-hidden shadow-sm relative flex items-center justify-center text-primary">
            <span className="material-symbols-outlined text-4xl">precision_manufacturing</span>
          </div>
          <div className="flex flex-col justify-center py-xs">
            <div className={`inline-flex items-center px-sm py-base rounded-full ${
              equipment.status === 'Ativo' ? 'bg-tertiary/15 text-tertiary' : 'bg-secondary-container/15 text-secondary'
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

        {/* Technical Specs Card */}
        <div className="bg-surface-container-lowest rounded-xl shadow-[0_2px_8px_rgba(30,42,45,0.05)] p-md border border-outline/10">
          <h2 className="font-label-caps text-label-caps text-on-surface-variant mb-sm">Especificações Técnicas</h2>
          <div className="grid grid-cols-2 gap-sm">
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
            <div>
              <span className="block font-label-caps text-label-caps text-outline mb-1">Garantia</span>
              <span className="block font-technical-code text-technical-code text-on-surface">{equipment.warrantyUntil}</span>
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
          href="/os/nova"
          className="bg-primary text-on-primary rounded-xl h-[56px] px-lg flex items-center gap-sm shadow-[0_8px_24px_rgba(30,42,45,0.12)] hover:bg-primary/90 active:scale-95 transition-all"
        >
          <span className="material-symbols-outlined">add</span>
          <span className="font-label-caps text-label-caps">Registrar Atendimento</span>
        </Link>
      </div>
    </Navigation>
  );
}
