export const runtime = 'edge';
export const dynamic = 'force-dynamic';
import React from 'react';
import Navigation from '@/components/Navigation';
import { getDb, schema } from '@/lib/supabase';
import { eq } from 'drizzle-orm';
import Link from 'next/link';

// Supabase uninstalled - database migrated to Cloudflare D1 with Drizzle ORM

export const revalidate = 0; // Disable caching to get fresh data from D1

export default async function DashboardPage() {
  let totalClinics = 0;
  let totalEquipments = 0;
  let totalOpenOS = 0;
  let alerts: { id: string; name: string; location: string; status: string }[] = [];

  try {
    const db = getDb();
    
    // Buscar total de clínicas (clients)
    const clinicsResult = await db.select().from(schema.clients);
    totalClinics = clinicsResult.length;

    // Buscar total de equipamentos (equipments)
    const equipmentsResult = await db.select().from(schema.equipments);
    totalEquipments = equipmentsResult.length;

    // Buscar total de OS abertas (workOrders com status ABERTA ou EM ANDAMENTO)
    const workOrders = await db.select().from(schema.workOrders);
    totalOpenOS = workOrders.filter(
      (wo) => wo.status === 'ABERTA' || wo.status === 'EM ANDAMENTO'
    ).length;

    // Fetch equipment alerts (status = 'Pendente')
    const dbEquipments = await db
      .select({
        id: schema.equipments.id,
        name: schema.equipments.name,
        status: schema.equipments.status,
        locationName: schema.locations.name,
        locationRoom: schema.locations.room
      })
      .from(schema.equipments)
      .leftJoin(schema.locations, eq(schema.equipments.locationId, schema.locations.id))
      .where(eq(schema.equipments.status, 'Pendente'));

    if (dbEquipments && dbEquipments.length > 0) {
      alerts = dbEquipments.map((eqData) => ({
        id: eqData.id,
        name: eqData.name,
        location: eqData.locationName ? `${eqData.locationName} - ${eqData.locationRoom || ''}` : 'Unidade Geral',
        status: 'PENDENTE'
      }));
    }
  } catch (e) {
    console.error('Erro ao conectar com o D1:', e);
  }

  const currentDate = new Date().toLocaleDateString('pt-BR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  return (
    <Navigation currentTab="dashboard">
      <main className="flex-grow pb-32 pt-lg px-md w-full max-w-[800px] mx-auto md:px-xl animate-fade-in">

        {/* Tech and Date Header */}
        <header className="mb-xl flex items-center justify-between border-b border-outline-variant/30 pb-md">
          <div>
            <span className="font-label-caps text-label-caps text-on-surface-variant tracking-wider">
              TÉCNICO PARCEIRO
            </span>
            <h2 className="font-headline-lg text-headline-lg text-on-background mt-xs font-semibold">
              Marcelo T.
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

        {/* Hero Section / Mobile Quick Actions */}
        <section className="mb-xl flex flex-col md:flex-row gap-md items-center justify-between bg-surface-container-low rounded-2xl p-lg border border-outline/10 shadow-level-1">
          <div className="flex-grow text-center md:text-left mb-sm md:mb-0">
            <h3 className="font-headline-md text-headline-md text-on-surface font-bold">
              Bem-vindo ao OdontoService
            </h3>
            <p className="font-body-md text-body-md text-on-surface-variant mt-xs">
              Acesse e gerencie chamados, clientes e equipamentos clínicos em campo.
            </p>
          </div>
          {/* Mobile FAB Alternative */}
          <Link
            prefetch={false}
            href="/os/nova"
            className="md:hidden w-full h-touch-target bg-primary text-on-primary font-headline-sm text-headline-sm rounded-lg shadow-sm active:scale-95 transition-transform flex items-center justify-center space-x-2"
          >
            <span className="material-symbols-outlined" style={{ fontVariationSettings: '"FILL" 1' }}>add</span>
            <span>Novo Serviço</span>
          </Link>
        </section>

        {/* Metric Cards */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-sm md:gap-md">
          {/* Card 1: Clínicas */}
          <div className="bg-surface-container-lowest rounded-xl p-md shadow-level-1 border border-outline/10 flex flex-col justify-between min-h-[120px]">
            <div className="flex items-center space-x-2 text-primary">
              <span className="material-symbols-outlined text-xl">location_city</span>
              <span className="font-label-caps text-label-caps">Total de Clínicas</span>
            </div>
            <div className="mt-4">
              <span className="font-headline-lg text-headline-lg text-on-surface font-bold">
                {String(totalClinics).padStart(2, '0')}
              </span>
            </div>
          </div>
          {/* Card 2: Equipamentos */}
          <div className="bg-surface-container-lowest rounded-xl p-md shadow-level-1 border border-outline/10 flex flex-col justify-between min-h-[120px]">
            <div className="flex items-center space-x-2 text-tertiary">
              <span className="material-symbols-outlined text-xl">precision_manufacturing</span>
              <span className="font-label-caps text-label-caps">Total de Equipamentos</span>
            </div>
            <div className="mt-4">
              <span className="font-headline-lg text-headline-lg text-on-surface font-bold">
                {String(totalEquipments).padStart(2, '0')}
              </span>
            </div>
          </div>
          {/* Card 3: OS Abertas */}
          <div className="bg-surface-container-lowest rounded-xl p-md shadow-level-1 border border-outline/10 flex flex-col justify-between min-h-[120px]">
            <div className="flex items-center space-x-2 text-secondary">
              <span className="material-symbols-outlined text-xl">pending_actions</span>
              <span className="font-label-caps text-label-caps">OS Abertas</span>
            </div>
            <div className="mt-4">
              <span className="font-headline-lg text-headline-lg text-on-surface font-bold">
                {String(totalOpenOS).padStart(2, '0')}
              </span>
            </div>
          </div>
        </section>

        {/* Dynamic Alerts Section */}
        <section className="mt-xl">
          <div className="mb-md flex items-center space-x-2">
            <span className="material-symbols-outlined text-error">notification_important</span>
            <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold">
              Manutenções e Alertas Urgentes
            </h3>
          </div>

          <div className="space-y-sm">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className="bg-surface-container-lowest border-l-4 border-error rounded-xl p-md shadow-level-1 border-y border-r border-outline/10 flex items-center justify-between"
              >
                <div className="pr-xs">
                  <h4 className="font-headline-xs text-headline-xs text-on-surface font-semibold">
                    {alert.name}
                  </h4>
                  <p className="font-body-md text-body-md text-on-surface-variant mt-[2px]">
                    {alert.location}
                  </p>
                </div>
                <div>
                  <span className="px-sm py-1 rounded bg-error/15 text-error font-label-caps text-label-caps whitespace-nowrap">
                    {alert.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </Navigation>
  );
}
