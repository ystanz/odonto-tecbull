'use client';

import React, { useState, useEffect } from 'react';
import Navigation from '@/components/Navigation';
import { useRouter } from 'next/navigation';

interface RecentWorkOrder {
  id: string;
  code: string;
  status: 'ABERTA' | 'EM ANDAMENTO' | 'AGUARDANDO PEÇA' | 'CONCLUÍDA';
  priority: 'NORMAL' | 'CRÍTICO';
  defectReported: string;
  createdAt: string;
  clientName: string;
  equipmentName: string;
}

interface DashboardData {
  totalClients: number;
  totalEquipments: number;
  activeWorkOrders: number;
  recentWorkOrders: RecentWorkOrder[];
}

export default function DashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted) return;

    async function fetchDashboardData() {
      try {
        setLoading(true);
        const resRaw = await fetch('/api/dashboard');
        const res = await resRaw.json();
        if (res.success && res.data) {
          setData(res.data);
        } else {
          setError(res.error || 'Erro ao carregar os dados do dashboard.');
        }
      } catch (err) {
        console.error(err);
        setError('Erro de conexão com o servidor.');
      } finally {
        setLoading(false);
      }
    }

    fetchDashboardData();
  }, [isMounted]);

  const currentDate = new Date().toLocaleDateString('pt-BR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'N/A';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch {
      return dateStr;
    }
  };

  // Renderiza um skeleton estático no servidor e na hidratação inicial do cliente
  if (!isMounted) {
    return (
      <Navigation currentTab="dashboard">
        <main className="flex-grow pb-32 pt-lg px-md w-full max-w-[800px] mx-auto md:px-xl">
          <header className="mb-xl flex items-center justify-between border-b border-outline-variant/30 pb-md">
            <div>
              <span className="font-label-caps text-label-caps text-on-surface-variant tracking-wider">
                Olá,
              </span>
              <h2 className="font-headline-lg text-headline-lg text-on-background mt-xs font-semibold">
                Marcelo
              </h2>
            </div>
            <div className="text-right">
              <span className="font-label-caps text-label-caps text-on-surface-variant block tracking-wider">
                DATA DE HOJE
              </span>
              <span className="font-headline-sm text-headline-sm text-primary font-bold mt-xs block">
                ...
              </span>
            </div>
          </header>

          <div className="text-center py-16 text-on-surface-variant font-body-md flex flex-col items-center justify-center gap-sm bg-white rounded-2xl border border-outline/10 shadow-sm">
            <span className="material-symbols-outlined animate-spin text-primary text-3xl">sync</span>
            <span>Carregando dados operacionais...</span>
          </div>
        </main>
      </Navigation>
    );
  }

  return (
    <Navigation currentTab="dashboard">
      <main className="flex-grow pb-32 pt-lg px-md w-full max-w-[800px] mx-auto md:px-xl animate-fade-in">
        {/* Tech and Date Header */}
        <header className="mb-xl flex items-center justify-between border-b border-outline-variant/30 pb-md">
          <div>
            <span className="font-label-caps text-label-caps text-on-surface-variant tracking-wider">
              Olá,
            </span>
            <h2 className="font-headline-lg text-headline-lg text-on-background mt-xs font-semibold">
              Marcelo
            </h2>
          </div>
          <div className="text-right">
            <span className="font-label-caps text-label-caps text-on-surface-variant block tracking-wider">
              DATA DE HOJE
            </span>
            <span className="font-headline-sm text-headline-sm text-primary font-bold mt-xs block">
              {currentDate}
            </span>
          </div>
        </header>

        {/* Loading Indicator */}
        {loading && (
          <div className="text-center py-16 text-on-surface-variant font-body-md flex flex-col items-center justify-center gap-sm bg-white rounded-2xl border border-outline/10 shadow-sm">
            <span className="material-symbols-outlined animate-spin text-primary text-3xl">sync</span>
            <span>Carregando dados operacionais em tempo real...</span>
          </div>
        )}

        {/* Error Indicator */}
        {!loading && error && (
          <div className="text-center py-12 text-error font-body-md bg-error/10 border border-error/20 rounded-2xl p-lg flex flex-col items-center gap-sm">
            <span className="material-symbols-outlined text-4xl">report_off</span>
            <span className="font-semibold">{error}</span>
            <button
              onClick={() => window.location.reload()}
              className="mt-xs px-4 py-2 bg-error text-white font-label-caps text-label-caps rounded-xl shadow hover:bg-error/95 transition-all text-xs"
            >
              Tentar Novamente
            </button>
          </div>
        )}

        {/* Dashboard Content */}
        {!loading && !error && data && (
          <div className="space-y-xl">
            {/* Metric Cards Grid */}
            <section className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {/* Card 1: Clínicas */}
              <div className="bg-white rounded-xl p-md shadow-level-1 border border-outline/10 flex flex-col justify-between min-h-[120px]">
                <div className="flex items-center space-x-2 text-primary">
                  <span className="material-symbols-outlined text-xl">location_city</span>
                  <span className="font-label-caps text-label-caps font-semibold">Total de Clínicas</span>
                </div>
                <div className="mt-4">
                  <span className="font-headline-lg text-3xl text-on-surface font-extrabold">
                    {String(data.totalClients).padStart(2, '0')}
                  </span>
                </div>
              </div>

              {/* Card 2: Equipamentos */}
              <div className="bg-white rounded-xl p-md shadow-level-1 border border-outline/10 flex flex-col justify-between min-h-[120px]">
                <div className="flex items-center space-x-2 text-tertiary">
                  <span className="material-symbols-outlined text-xl">precision_manufacturing</span>
                  <span className="font-label-caps text-label-caps font-semibold">Equipamentos</span>
                </div>
                <div className="mt-4">
                  <span className="font-headline-lg text-3xl text-on-surface font-extrabold">
                    {String(data.totalEquipments).padStart(2, '0')}
                  </span>
                </div>
              </div>

              {/* Card 3: OS Ativas */}
              <div className="bg-white rounded-xl p-md shadow-level-1 border border-outline/10 flex flex-col justify-between min-h-[120px]">
                <div className="flex items-center space-x-2 text-secondary">
                  <span className="material-symbols-outlined text-xl">pending_actions</span>
                  <span className="font-label-caps text-label-caps font-semibold">OS Ativas</span>
                </div>
                <div className="mt-4">
                  <span className="font-headline-lg text-3xl text-on-surface font-extrabold">
                    {String(data.activeWorkOrders).padStart(2, '0')}
                  </span>
                </div>
              </div>
            </section>

            {/* Recent OS Table Section */}
            <section className="bg-white rounded-2xl border border-outline/10 shadow-sm p-lg">
              <div className="mb-md flex items-center justify-between">
                <div className="flex items-center space-x-2 text-on-surface">
                  <span className="material-symbols-outlined text-primary">history</span>
                  <h3 className="font-headline-sm text-lg font-bold">
                    Últimos Chamados / Ordens de Serviço
                  </h3>
                </div>
                <button
                  onClick={() => router.push('/ordens-servico')}
                  className="text-xs text-primary font-bold hover:underline font-label-caps text-label-caps flex items-center gap-base"
                >
                  Ver Todos
                  <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </button>
              </div>

              {data.recentWorkOrders.length === 0 ? (
                <div className="text-center py-8 text-on-surface-variant font-body-md italic flex flex-col items-center justify-center gap-sm">
                  <span className="material-symbols-outlined text-outline text-4xl">chat_bubble_outline</span>
                  <span>Nenhum chamado aberto recentemente no sistema.</span>
                </div>
              ) : (
                <div className="overflow-x-auto w-full">
                  <table className="w-full text-left border-collapse min-w-[600px]">
                    <thead>
                      <tr className="border-b border-outline/10 text-on-surface-variant font-label-caps text-label-caps text-xs">
                        <th className="py-sm pb-md font-semibold">OS/ID</th>
                        <th className="py-sm pb-md font-semibold">Cliente</th>
                        <th className="py-sm pb-md font-semibold">Equipamento</th>
                        <th className="py-sm pb-md font-semibold">Data</th>
                        <th className="py-sm pb-md font-semibold text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline/5">
                      {data.recentWorkOrders.map((wo) => {
                        let statusBadgeClass = 'bg-primary/15 text-primary';
                        if (wo.status === 'EM ANDAMENTO') {
                          statusBadgeClass = 'bg-secondary/15 text-secondary';
                        } else if (wo.status === 'AGUARDANDO PEÇA') {
                          statusBadgeClass = 'bg-orange-500/15 text-orange-700';
                        } else if (wo.status === 'CONCLUÍDA') {
                          statusBadgeClass = 'bg-tertiary/15 text-tertiary';
                        }

                        return (
                          <tr
                            key={wo.id}
                            onClick={() => router.push(`/os/detalhes?id=${wo.id}`)}
                            className="hover:bg-surface-container-lowest/50 transition-colors cursor-pointer group"
                          >
                            <td className="py-md font-technical-code text-sm">
                              <span className="block text-primary hover:underline font-semibold">
                                {wo.code}
                              </span>
                            </td>
                            <td className="py-md font-body-md text-sm text-on-surface-variant group-hover:text-on-surface transition-colors">
                              {wo.clientName || 'Cliente Geral'}
                            </td>
                            <td className="py-md font-body-md text-sm text-on-surface-variant group-hover:text-on-surface transition-colors">
                              {wo.equipmentName || 'Equipamento'}
                            </td>
                            <td className="py-md font-technical-code text-sm text-on-surface-variant group-hover:text-on-surface transition-colors">
                              {formatDate(wo.createdAt)}
                            </td>
                            <td className="py-md text-right">
                              <span className={`inline-flex items-center px-sm py-base rounded-full text-[10px] font-semibold font-label-caps ${statusBadgeClass}`}>
                                {wo.status}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </div>
        )}
      </main>
    </Navigation>
  );
}
