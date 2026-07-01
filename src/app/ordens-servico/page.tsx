'use client';

import React, { useState, useEffect } from 'react';
import Navigation from '@/components/Navigation';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

interface WorkOrder {
  id: string;
  code: string;
  clientName: string;
  equipmentName: string;
  equipmentId?: string;
  defectReported: string;
  status: 'ABERTA' | 'EM ANDAMENTO' | 'CONCLUÍDA';
  priority: 'NORMAL' | 'CRÍTICO';
  serviceDate: string;
}

const mockWorkOrders: WorkOrder[] = [
  {
    id: '1',
    code: '#AC-2023-091',
    clientName: 'Clinica OdontoVida',
    equipmentName: 'Autoclave Sterilizer X2',
    defectReported: 'Falha no ciclo de secagem. Pressão não atinge o nível ideal na fase final do ciclo.',
    status: 'EM ANDAMENTO',
    priority: 'NORMAL',
    serviceDate: '24 Out 2023'
  },
  {
    id: '2',
    code: '#CH-2021-442',
    clientName: 'Dr. Silva - Consultório 3',
    equipmentName: 'Cadeira Odontológica Premium',
    defectReported: 'Vazamento de ar no pedal de comando e luz do refletor piscando intermitentemente.',
    status: 'ABERTA',
    priority: 'CRÍTICO',
    serviceDate: '26 Out 2023 (Hoje)'
  },
  {
    id: '3',
    code: '#CP-2022-118',
    clientName: 'Centro Sorriso Infantil',
    equipmentName: 'Compressor de Ar Duplo',
    defectReported: 'Manutenção preventiva trimestral realizada. Troca de filtros e aferição de válvulas OK.',
    status: 'CONCLUÍDA',
    priority: 'NORMAL',
    serviceDate: 'Finalizado: 23 Out 2023'
  }
];

type FilterTab = 'TODAS' | 'ABERTAS' | 'EM ANDAMENTO' | 'CONCLUÍDAS';

export default function WorkOrdersPage() {
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>(mockWorkOrders);
  const [activeTab, setActiveTab] = useState<FilterTab>('TODAS');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchWorkOrders() {
      try {
        setLoading(true);
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

        if (supabaseUrl && supabaseKey) {
          const { data: dbWos, error } = await supabase
            .from('work_orders')
            .select('*, clients(name), equipments(name, id)');

          if (error) throw error;

          if (dbWos && dbWos.length > 0) {
            const formatted: WorkOrder[] = dbWos.map((wo: any) => {
              let dateText = wo.service_date || 'N/A';
              if (wo.status === 'CONCLUÍDA') {
                dateText = `Finalizado: ${wo.service_date || ''}`;
              } else if (wo.service_date) {
                // If it is today
                const today = new Date().toISOString().split('T')[0];
                if (wo.service_date === today) {
                  dateText = `${wo.service_date} (Hoje)`;
                }
              }

              return {
                id: wo.id,
                code: wo.code,
                clientName: wo.clients?.name || 'Cliente Geral',
                equipmentName: wo.equipments?.name || 'Equipamento',
                equipmentId: wo.equipments?.id,
                defectReported: wo.defect_reported,
                status: wo.status as any,
                priority: wo.priority as any,
                serviceDate: dateText
              };
            });
            setWorkOrders(formatted);
          }
        }
      } catch (err) {
        console.error('Erro ao buscar ordens de serviço do Supabase, usando mocks:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchWorkOrders();
  }, []);

  const filteredWos = workOrders.filter(wo => {
    if (activeTab === 'TODAS') return true;
    if (activeTab === 'ABERTAS') return wo.status === 'ABERTA';
    if (activeTab === 'EM ANDAMENTO') return wo.status === 'EM ANDAMENTO';
    if (activeTab === 'CONCLUÍDAS') return wo.status === 'CONCLUÍDA';
    return true;
  });

  return (
    <Navigation currentTab="service">
      <main className="flex-1 pb-32 pt-lg px-md w-full max-w-[800px] mx-auto md:px-xl">
        {/* Header Section */}
        <div className="mb-lg">
          <h2 className="font-headline-lg text-headline-lg text-on-background mb-xs">
            Ordens de Serviço
          </h2>
          <p className="text-on-surface-variant font-body-md text-body-md">
            Gerencie e acompanhe as tarefas de manutenção ativas dos equipamentos.
          </p>
        </div>

        {/* Tabs */}
        <div className="w-full overflow-x-auto no-scrollbar mb-xl border-b border-outline-variant/30">
          <div className="flex gap-lg min-w-max px-xs">
            {(['TODAS', 'ABERTAS', 'EM ANDAMENTO', 'CONCLUÍDAS'] as FilterTab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-sm py-sm border-b-2 font-label-caps text-label-caps whitespace-nowrap transition-colors ${
                  activeTab === tab 
                    ? 'border-primary text-primary font-bold' 
                    : 'border-transparent text-on-surface-variant hover:text-primary'
                }`}
              >
                {tab.charAt(0) + tab.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Loading Indicator */}
        {loading && (
          <div className="text-center py-4 text-on-surface-variant font-body-md">
            Carregando ordens de serviço...
          </div>
        )}

        {/* OS List (Bento-style Cards) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
          {filteredWos.map((wo) => {
            // Determine left border color class
            let borderClass = 'bg-secondary-container'; // Em andamento
            let statusBadgeClass = 'bg-secondary-container/20 text-secondary-container';
            let statusLabel = 'EM ANDAMENTO';

            if (wo.status === 'ABERTA') {
              if (wo.priority === 'CRÍTICO') {
                borderClass = 'bg-error';
                statusBadgeClass = 'bg-error/15 text-error';
                statusLabel = 'ABERTA (CRÍTICO)';
              } else {
                borderClass = 'bg-primary-container';
                statusBadgeClass = 'bg-primary-container/20 text-primary-container';
                statusLabel = 'ABERTA';
              }
            } else if (wo.status === 'CONCLUÍDA') {
              borderClass = 'bg-tertiary-container';
              statusBadgeClass = 'bg-tertiary-container/15 text-tertiary-container';
              statusLabel = 'CONCLUÍDA';
            }

            const cardContent = (
              <article className={`bg-surface-container-lowest rounded-xl shadow-lg border border-outline/10 p-md flex flex-col gap-sm hover:shadow-xl transition-shadow cursor-pointer relative overflow-hidden group h-full ${
                wo.status === 'CONCLUÍDA' ? 'opacity-85' : ''
              }`}>
                <div className={`absolute inset-y-0 left-0 w-1 ${borderClass}`}></div>
                <div className="flex justify-between items-start pl-xs">
                  <div>
                    <div className="flex items-center gap-xs mb-1">
                      <span className="material-symbols-outlined text-[16px] text-on-surface-variant">person</span>
                      <span className="font-body-md text-body-md text-on-surface-variant">{wo.clientName}</span>
                    </div>
                    <h3 className="font-headline-sm text-headline-sm text-on-surface">
                      {wo.equipmentName}
                    </h3>
                    <div className="font-technical-code text-technical-code text-outline mt-1">
                      ID: {wo.code}
                    </div>
                  </div>
                  <span className={`inline-flex items-center px-2 py-1 rounded-sm font-label-caps text-[10px] ${statusBadgeClass}`}>
                    {statusLabel}
                  </span>
                </div>
                <div className="pl-xs flex-1">
                  <p className="font-body-md text-body-md text-on-surface-variant line-clamp-2">
                    {wo.defectReported}
                  </p>
                </div>
                <div className="pl-xs mt-auto pt-sm border-t border-outline-variant/20 flex justify-between items-center">
                  <div className={`flex items-center gap-xs ${wo.priority === 'CRÍTICO' && wo.status !== 'CONCLUÍDA' ? 'text-error' : 'text-outline'}`}>
                    <span className="material-symbols-outlined text-[14px]">
                      {wo.status === 'CONCLUÍDA' ? 'check_circle' : 'calendar_today'}
                    </span>
                    <span className="font-technical-code text-[12px]">{wo.serviceDate}</span>
                  </div>
                  <div className="h-8 w-8 rounded-full bg-surface-container-high flex items-center justify-center text-on-surface group-hover:bg-primary group-hover:text-on-primary transition-colors">
                    <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                  </div>
                </div>
              </article>
            );

            return (
              <div key={wo.id}>
                {wo.equipmentId ? (
                  <Link href={`/equipamentos/${wo.equipmentId}`}>
                    {cardContent}
                  </Link>
                ) : (
                  cardContent
                )}
              </div>
            );
          })}

          {filteredWos.length === 0 && (
            <div className="text-center py-8 text-on-surface-variant font-body-md bg-surface-container-lowest rounded-xl border border-outline/10 shadow-sm col-span-1 md:col-span-2">
              Nenhuma ordem de serviço encontrada nesta categoria.
            </div>
          )}
        </div>

        {/* Floating Action Button */}
        <Link 
          href="/ordens-servico/nova"
          className="fixed bottom-[96px] md:bottom-lg right-md md:right-lg h-[56px] px-lg rounded-xl bg-primary text-on-primary shadow-lg flex items-center gap-sm hover:bg-primary-container transition-colors active:scale-95 z-40"
        >
          <span className="material-symbols-outlined">add</span>
          <span className="font-label-caps text-label-caps tracking-wider">NOVA OS</span>
        </Link>
      </main>
    </Navigation>
  );
}
