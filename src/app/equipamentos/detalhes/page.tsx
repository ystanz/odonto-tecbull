'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Navigation from '@/components/Navigation';
import Link from 'next/link';
import EditEquipmentButton from '@/components/EditEquipmentButton';
import { DBClient, DBLocation } from '@/lib/types';

interface EquipmentSpecs {
  id: string;
  name: string;
  locationName: string;
  locationId: string;
  clientId: string;
  serialNumber: string;
  installationDate: string;
  manufacturer: string;
  status: string;
  nextServiceDate: string;
  imageData?: string | null;
  hasOpenOS?: boolean;
}

interface TimelineItem {
  id: string;
  date: string;
  title: string;
  description: string;
  partsUsed: string | null;
  technician: string;
  status: string;
  icon: string;
}

function EquipmentDetailsLoader() {
  const searchParams = useSearchParams();
  const id = searchParams.get('id');

  const [equipment, setEquipment] = useState<EquipmentSpecs | null>(null);
  const [timeline, setTimeline] = useState<TimelineItem[]>([]);
  const [clientsList, setClientsList] = useState<DBClient[]>([]);
  const [locationsList, setLocationsList] = useState<DBLocation[]>([]);
  const [loading, setLoading] = useState(!id ? false : true);
  const [errorMsg, setErrorMsg] = useState<string | null>(
    !id ? 'ID do equipamento não fornecido.' : null
  );

  useEffect(() => {
    if (!id) return;

    let isMounted = true;

    async function fetchData() {
      try {
        const res = await fetch(`/api/equipamentos/${id}`);
        const data = await res.json();

        if (!res.ok || !data.success) {
          throw new Error(data.error || 'Equipamento não encontrado.');
        }

        if (isMounted) {
          setEquipment(data.data.equipment);
          setTimeline(data.data.timeline);
          setClientsList(data.data.clients);
          setLocationsList(data.data.locations);
          setLoading(false);
        }
      } catch (err) {
        console.error('Erro ao buscar equipamento no cliente:', err);
        if (isMounted) {
          setErrorMsg(err instanceof Error ? err.message : 'Erro de conexão.');
          setLoading(false);
        }
      }
    }

    fetchData();

    return () => {
      isMounted = false;
    };
  }, [id]);

  if (loading) {
    return (
      <Navigation currentTab="equipment">
        <div className="flex h-[50vh] w-full items-center justify-center bg-[#FAF8F4] select-none">
          <div className="flex flex-col items-center gap-xs">
            <span className="material-symbols-outlined animate-spin text-primary text-[32px]">sync</span>
            <span className="text-on-surface-variant font-body-md text-body-md">Carregando dados do equipamento...</span>
          </div>
        </div>
      </Navigation>
    );
  }

  if (errorMsg || !equipment) {
    return (
      <Navigation currentTab="equipment">
        <main className="px-md py-lg max-w-3xl mx-auto space-y-lg text-center flex flex-col items-center justify-center min-h-[50vh]">
          <span className="material-symbols-outlined text-outline text-6xl">precision_manufacturing</span>
          <h2 className="font-headline-md text-headline-md text-on-surface font-bold mt-md">
            Equipamento não encontrado
          </h2>
          <p className="font-body-md text-body-md text-on-surface-variant max-w-md mt-xs">
            {errorMsg || 'O equipamento solicitado não foi encontrado.'}
          </p>
          <Link
            prefetch={false}
            href="/equipamentos"
            className="mt-lg h-12 px-6 bg-primary text-on-primary hover:bg-primary/95 font-label-caps text-label-caps rounded-xl transition-colors flex items-center justify-center gap-1 font-semibold shadow-sm cursor-pointer"
          >
            <span className="material-symbols-outlined">arrow_back</span>
            Voltar
          </Link>
        </main>
      </Navigation>
    );
  }

  // Calculate days to next service
  let nextServiceDays = 0;
  if (equipment.nextServiceDate && equipment.nextServiceDate !== 'N/A') {
    const serviceDate = new Date(equipment.nextServiceDate);
    const today = new Date();
    const diffTime = serviceDate.getTime() - today.getTime();
    nextServiceDays = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
  }

  const editEqData = {
    id: id || '',
    name: equipment.name,
    locationId: equipment.locationId || '',
    clientId: equipment.clientId || '',
    serialNumber: equipment.serialNumber === 'N/A' ? '' : equipment.serialNumber,
    installationDate: equipment.installationDate === 'N/A' ? '' : equipment.installationDate,
    manufacturer: equipment.manufacturer === 'N/A' ? '' : equipment.manufacturer,
    status: equipment.status,
    nextServiceDate: equipment.nextServiceDate === 'N/A' ? '' : equipment.nextServiceDate,
    imageData: equipment.imageData || null
  };

  return (
    <Navigation currentTab="equipment">
      <main className="px-md py-lg max-w-3xl mx-auto space-y-lg">

        {/* Header Navigation link back */}
        <div className="flex items-center space-x-2 text-on-surface-variant font-body-md mb-xs">
          <Link prefetch={false} href="/equipamentos" className="hover:text-primary flex items-center">
            <span className="material-symbols-outlined text-md mr-1">arrow_back</span>
            Voltar
          </Link>
        </div>

        {/* Status & Image Header */}
        <div className="flex flex-col sm:flex-row items-start justify-between gap-md bg-surface-container-lowest p-md rounded-xl border border-outline/10 shadow-level-1">
          <div className="flex flex-col sm:flex-row items-start gap-md">
            <div className="flex-shrink-0 w-24 h-24 bg-primary/10 rounded-xl overflow-hidden shadow-sm relative flex items-center justify-center text-primary border border-outline/10">
              {equipment.imageData ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={equipment.imageData} alt={equipment.name} className="w-full h-full object-cover" />
              ) : (
                <span className="material-symbols-outlined text-4xl">precision_manufacturing</span>
              )}
            </div>
            <div className="flex flex-col justify-center py-xs">
              <div className={`inline-flex items-center px-sm py-base rounded-full ${equipment.hasOpenOS ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                } mb-xs w-max text-xs font-semibold`}>
                <span>{equipment.hasOpenOS ? 'Ordem aberta' : 'OK'}</span>
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
            <span className="font-headline-md text-headline-md text-on-surface">{nextServiceDays} Dias</span>
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
            {timeline.length > 0 ? (
              timeline.map((item, index) => (
                <div key={index} className="relative flex gap-md pb-lg timeline-item">
                  <div className="timeline-line"></div>
                  <div className="relative z-10 w-6 h-6 rounded-full bg-surface-container-lowest border-2 border-primary flex items-center justify-center flex-shrink-0 mt-1 shadow-sm">
                    <span className="material-symbols-outlined text-[14px] text-primary">{item.icon}</span>
                  </div>
                  <Link href={`/os/detalhes?id=${item.id}`} className="flex-1 block hover:no-underline">
                    <div className="bg-surface-container-lowest rounded-xl shadow-[0_2px_8px_rgba(30,42,45,0.05)] p-sm border border-outline/10 hover:border-primary/50 transition-colors">
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
                    </div>
                  </Link>
                </div>
              ))
            ) : (
              <p className="text-on-surface-variant font-body-md">Nenhuma manutenção registrada para este equipamento.</p>
            )}
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

export default function EquipmentDetailPage() {
  return (
    <Suspense
      fallback={
        <Navigation currentTab="equipment">
          <div className="flex h-[50vh] w-full items-center justify-center bg-[#FAF8F4] select-none">
            <div className="flex flex-col items-center gap-xs">
              <span className="material-symbols-outlined animate-spin text-primary text-[32px]">sync</span>
              <span className="text-on-surface-variant font-body-md text-body-md">Carregando...</span>
            </div>
          </div>
        </Navigation>
      }
    >
      <EquipmentDetailsLoader />
    </Suspense>
  );
}
