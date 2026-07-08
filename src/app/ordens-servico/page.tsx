'use client';

import React, { useState, useEffect } from 'react';
import Navigation from '@/components/Navigation';
// no actions imported
import { DBWorkOrder } from '@/lib/types';
import Link from 'next/link';

interface WorkOrder {
  id: string;
  code: string;
  clientName: string;
  equipmentName: string;
  equipmentId?: string;
  defectReported: string;
  status: 'ABERTA' | 'EM ANDAMENTO' | 'AGUARDANDO PEÇA' | 'CONCLUÍDA';
  priority: 'NORMAL' | 'CRÍTICO';
  serviceDate: string;
}

type FilterTab = 'TODAS' | 'ABERTAS' | 'EM ANDAMENTO' | 'AGUARDANDO PEÇA' | 'CONCLUÍDAS';

export default function WorkOrdersPage() {
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [activeTab, setActiveTab] = useState<FilterTab>('TODAS');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchWorkOrders() {
      try {
        setLoading(true);
        let rawWos: DBWorkOrder[] = [];

        const resRaw = await fetch('/api/ordens-servico');
        const res = await resRaw.json();

        if (res.success) {
          rawWos = res.data || [];
        } else {
          console.error('Erro ao buscar ordens de serviço da API');
        }

        const formatted: WorkOrder[] = rawWos.map((wo) => {
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

          let clientName = 'Cliente Geral';
          let equipmentName = 'Equipamento';
          let equipmentId = wo.equipment_id;

          clientName = wo.clients?.name || 'Cliente Geral';
          equipmentName = wo.equipments?.name || 'Equipamento';
          equipmentId = wo.equipments?.id || wo.equipment_id;

          return {
            id: wo.id,
            code: wo.code,
            clientName,
            equipmentName,
            equipmentId,
            defectReported: wo.defect_reported,
            status: wo.status,
            priority: wo.priority,
            serviceDate: dateText,
          };
        });

        setWorkOrders(formatted);
      } catch (err) {
        console.error('Erro ao buscar ordens de serviço do D1:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchWorkOrders();
  }, []);

  const filteredWos = workOrders.filter((wo) => {
    if (activeTab === 'TODAS') return true;
    if (activeTab === 'ABERTAS') return wo.status === 'ABERTA';
    if (activeTab === 'EM ANDAMENTO') return wo.status === 'EM ANDAMENTO';
    if (activeTab === 'AGUARDANDO PEÇA') return wo.status === 'AGUARDANDO PEÇA';
    if (activeTab === 'CONCLUÍDAS') return wo.status === 'CONCLUÍDA';
    return true;
  });

  return (
    <Navigation currentTab="service">
      <main className="flex-1 pb-32 pt-lg px-md w-full max-w-[800px] mx-auto md:px-xl animate-fade-in">

        {/* Header Section */}
        <div className="mb-lg flex flex-col sm:flex-row sm:items-center sm:justify-between gap-md">
          <div>
            <h2 className="font-headline-lg text-headline-lg text-on-background mb-xs">
              Ordens de Serviço
            </h2>
            <p className="text-on-surface-variant font-body-md text-body-md">
              Gerencie e acompanhe as tarefas de manutenção ativas dos equipamentos.
            </p>
          </div>

          <Link
            prefetch={false}
            href="/os/nova"
            className="h-touch-target px-md bg-primary text-on-primary font-label-caps text-label-caps rounded-xl hover:bg-primary-container hover:text-on-primary-container transition-colors flex items-center justify-center gap-xs shadow-sm"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            Nova OS
          </Link>
        </div>

        {/* Tabs */}
        <div className="w-full overflow-x-auto no-scrollbar mb-xl border-b border-outline-variant/30">
          <div className="flex gap-lg min-w-max px-xs">
            {(['TODAS', 'ABERTAS', 'EM ANDAMENTO', 'AGUARDANDO PEÇA', 'CONCLUÍDAS'] as FilterTab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-sm py-sm border-b-2 font-label-caps text-label-caps whitespace-nowrap transition-colors cursor-pointer ${activeTab === tab
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
          <div className="text-center py-8 text-on-surface-variant font-body-md flex flex-col items-center justify-center gap-sm bg-surface-container-lowest rounded-xl border border-outline/10 shadow-sm">
            <span className="material-symbols-outlined animate-spin text-primary text-3xl">sync</span>
            <span>Carregando ordens de serviço...</span>
          </div>
        )}

        {/* OS List (Bento-style Cards) */}
        {!loading && (
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
              } else if (wo.status === 'AGUARDANDO PEÇA') {
                borderClass = 'bg-amber-600';
                statusBadgeClass = 'bg-amber-500/15 text-amber-700';
                statusLabel = 'AGUARDANDO PEÇA';
              }

              const cardContent = (
                <article
                  className={`bg-surface-container-lowest rounded-xl shadow-lg border border-outline/10 p-md flex flex-col gap-sm hover:shadow-xl transition-shadow cursor-pointer relative overflow-hidden group h-full ${wo.status === 'CONCLUÍDA' ? 'opacity-85' : ''
                    }`}
                >
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
                    <div
                      className={`flex items-center gap-xs ${wo.priority === 'CRÍTICO' && wo.status !== 'CONCLUÍDA' ? 'text-error' : 'text-outline'
                        }`}
                    >
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
                  <a href={`/os/detalhes?id=${wo.id}`} className="block h-full">
                    {cardContent}
                  </a>
                </div>
              );
            })}

            {filteredWos.length === 0 && (
              <div className="text-center py-8 text-on-surface-variant font-body-md bg-surface-container-lowest rounded-xl border border-outline/10 shadow-sm col-span-1 md:col-span-2 animate-fade-in">
                Nenhuma ordem de serviço encontrada nesta categoria.
              </div>
            )}
          </div>
        )}

        {/* Floating Action Button */}
        <Link
          prefetch={false}
          href="/os/nova"
          className="fixed bottom-[96px] md:bottom-lg right-md md:right-lg h-[56px] px-lg rounded-xl bg-primary text-on-primary shadow-lg flex items-center gap-sm hover:bg-primary-container transition-colors active:scale-95 z-40 cursor-pointer"
        >
          <span className="material-symbols-outlined">add</span>
          <span className="font-label-caps text-label-caps tracking-wider">NOVA OS</span>
        </Link>
      </main>
    </Navigation>
  );
}
