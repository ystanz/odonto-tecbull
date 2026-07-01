import React from 'react';
import Navigation from '@/components/Navigation';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

// Mock data as fallback
const mockStats = {
  todayServices: 12,
  pendingServices: 4,
  inMaintenance: 3,
  revenue: 'R$ 4.2k'
};

const mockAlerts = [
  {
    id: 'COMP-402',
    name: 'Compressor Lubrification',
    location: 'Clinic Alpha - Main Operatory',
    status: 'DUE SOON'
  },
  {
    id: 'STER-105',
    name: 'Autoclave Filter Replacement',
    location: 'Clinic Beta - Sterilization Room',
    status: 'PENDING'
  },
  {
    id: 'CHAIR-88',
    name: 'Dental Chair Hydraulics Check',
    location: 'Clinic Gamma - Room 3',
    status: 'PENDING'
  }
];

export const revalidate = 0; // Disable caching to get fresh data from Supabase

export default async function DashboardPage() {
  let stats = { ...mockStats };
  let alerts = [...mockAlerts];
  let isFromSupabase = false;

  try {
    // Check if Supabase variables are set by attempting a quick fetch
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      // Fetch total work orders
      const { data: workOrders, error: woError } = await supabase
        .from('work_orders')
        .select('*');

      if (!woError && workOrders) {
        isFromSupabase = true;
        
        const open = workOrders.filter(wo => wo.status === 'ABERTA').length;
        const inProgress = workOrders.filter(wo => wo.status === 'EM ANDAMENTO').length;
        const completed = workOrders.filter(wo => wo.status === 'CONCLUÍDA').length;
        
        stats.todayServices = workOrders.length; // Total registered
        stats.pendingServices = open;
        stats.inMaintenance = inProgress;
        stats.revenue = `R$ ${(completed * 1.4).toFixed(1)}k`; // Estimated based on completed
      }

      // Fetch equipment alerts (status = 'Pendente')
      const { data: dbEquipments, error: eqError } = await supabase
        .from('equipments')
        .select('*, locations(name, room)')
        .eq('status', 'Pendente');

      if (!eqError && dbEquipments && dbEquipments.length > 0) {
        alerts = dbEquipments.map((eq: any) => ({
          id: eq.code,
          name: eq.name,
          location: eq.locations ? `${eq.locations.name} - ${eq.locations.room || ''}` : 'Unidade Geral',
          status: 'PENDING'
        }));
      }
    }
  } catch (e) {
    console.error('Erro ao conectar com o Supabase, utilizando dados simulados:', e);
  }

  const currentDate = new Date().toLocaleDateString('pt-BR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  return (
    <Navigation currentTab="dashboard">
      <main className="p-md md:p-lg max-w-7xl mx-auto space-y-lg">
        {/* Header Section */}
        <section className="flex flex-col md:flex-row md:items-center md:justify-between mb-lg space-y-4 md:space-y-0">
          <div>
            <h2 className="font-headline-lg text-headline-lg text-primary">Olá, Marcelo</h2>
            <p className="font-body-md text-body-md text-on-surface-variant mt-1">
              {currentDate} {isFromSupabase && <span className="text-xs text-tertiary-container font-semibold ml-2">(Supabase Conectado)</span>}
            </p>
          </div>
          {/* Mobile FAB Alternative */}
          <Link 
            href="/ordens-servico/nova"
            className="md:hidden w-full h-touch-target bg-primary text-on-primary font-headline-sm text-headline-sm rounded-lg shadow-sm active:scale-95 transition-transform flex items-center justify-center space-x-2"
          >
            <span className="material-symbols-outlined" style={{ fontVariationSettings: '"FILL" 1' }}>add</span>
            <span>Novo Serviço</span>
          </Link>
        </section>

        {/* Quick Stats Bento Grid */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-sm md:gap-md">
          {/* Stat 1 */}
          <div className="bg-surface-container-lowest rounded-xl p-md shadow-level-1 border border-outline/10 flex flex-col justify-between min-h-[120px]">
            <div className="flex items-center space-x-2 text-primary-container">
              <span className="material-symbols-outlined text-xl">calendar_today</span>
              <span className="font-label-caps text-label-caps">Serviços HOJE</span>
            </div>
            <div className="mt-4">
              <span className="font-headline-lg text-headline-lg text-primary">
                {String(stats.todayServices).padStart(2, '0')}
              </span>
            </div>
          </div>
          {/* Stat 2 */}
          <div className="bg-surface-container-lowest rounded-xl p-md shadow-level-1 border border-outline/10 flex flex-col justify-between min-h-[120px]">
            <div className="flex items-center space-x-2 text-secondary-container">
              <span className="material-symbols-outlined text-xl">pending_actions</span>
              <span className="font-label-caps text-label-caps">PENDENTES</span>
            </div>
            <div className="mt-4">
              <span className="font-headline-lg text-headline-lg text-on-surface">
                {String(stats.pendingServices).padStart(2, '0')}
              </span>
            </div>
          </div>
          {/* Stat 3 */}
          <div className="bg-surface-container-lowest rounded-xl p-md shadow-level-1 border border-outline/10 flex flex-col justify-between min-h-[120px]">
            <div className="flex items-center space-x-2 text-tertiary-container">
              <span className="material-symbols-outlined text-xl">build</span>
              <span className="font-label-caps text-label-caps">EM MANUT.</span>
            </div>
            <div className="mt-4">
              <span className="font-headline-lg text-headline-lg text-on-surface">
                {String(stats.inMaintenance).padStart(2, '0')}
              </span>
            </div>
          </div>
          {/* Stat 4 */}
          <div className="bg-surface-container-lowest rounded-xl p-md shadow-level-1 border border-outline/10 flex flex-col justify-between min-h-[120px]">
            <div className="flex items-center space-x-2 text-primary-container">
              <span className="material-symbols-outlined text-xl">payments</span>
              <span className="font-label-caps text-label-caps">FATURAMENTO</span>
            </div>
            <div className="mt-4">
              <span className="font-headline-lg text-headline-lg text-primary">
                {stats.revenue}
              </span>
            </div>
          </div>
        </section>

        {/* Preventive Maintenance Alert List */}
        <section className="mt-lg bg-surface-container-lowest rounded-xl shadow-level-1 border border-outline/10 overflow-hidden">
          <div className="p-md border-b border-outline/10 flex items-center space-x-3 bg-surface-container/50">
            <span className="material-symbols-outlined text-secondary-container" style={{ fontVariationSettings: '"FILL" 1' }}>warning</span>
            <h3 className="font-headline-sm text-headline-sm text-on-surface">Alertas de Manutenção Preventiva</h3>
          </div>
          <div className="p-md space-y-4">
            {alerts.map((alert, index) => (
              <div key={alert.id} className="flex items-start space-x-4 relative">
                {index < alerts.length - 1 && (
                  <div className="absolute left-4 top-8 bottom-[-16px] w-[2px] bg-outline/15 z-0"></div>
                )}
                <div className="w-8 h-8 rounded-full bg-secondary-container/15 flex items-center justify-center z-10 shrink-0">
                  <span className="material-symbols-outlined text-secondary text-sm">notifications</span>
                </div>
                <div className="flex-1 bg-surface-container-low p-sm rounded-lg border border-outline/10">
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-technical-code text-technical-code text-on-surface-variant">
                      ID: {alert.id}
                    </span>
                    <span className="font-label-caps text-label-caps bg-secondary-container/15 text-secondary px-2 py-1 rounded">
                      {alert.status}
                    </span>
                  </div>
                  <h4 className="font-headline-sm text-headline-sm text-primary mb-1">
                    {alert.name}
                  </h4>
                  <p className="font-body-md text-body-md text-on-surface-variant">
                    {alert.location}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </Navigation>
  );
}
