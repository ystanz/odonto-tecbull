'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Navigation from '@/components/Navigation';
import Link from 'next/link';
import OSDetailsUI from '@/components/OSDetailsUI';
import { DBWorkOrder, DBWorkNote } from '@/lib/types';

function OSDetailsLoader() {
  const searchParams = useSearchParams();
  const id = searchParams.get('id');

  const [workOrder, setWorkOrder] = useState<DBWorkOrder | null>(null);
  const [notes, setNotes] = useState<DBWorkNote[]>([]);
  const [loading, setLoading] = useState(!id ? false : true);
  const [errorMsg, setErrorMsg] = useState<string | null>(
    !id ? 'ID da ordem de serviço não fornecido.' : null
  );

  useEffect(() => {
    if (!id) return;

    let isMounted = true;

    async function fetchData() {
      try {
        // Fetch OS details
        const osRes = await fetch(`/api/os/${id}`);
        const osData = await osRes.json();

        if (!osRes.ok || !osData.success) {
          throw new Error(osData.error || 'Ordem de serviço não encontrada.');
        }

        // Fetch Work Notes
        const notesRes = await fetch(`/api/worknotes?os_id=${id}`);
        const notesData = await notesRes.json();

        if (isMounted) {
          setWorkOrder(osData.data);
          if (notesData.success && notesData.data) {
            setNotes(notesData.data);
          }
          setLoading(false);
        }
      } catch (err) {
        console.error('Erro ao buscar ordem de serviço no cliente:', err);
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
      <Navigation currentTab="service">
        <div className="flex h-[50vh] w-full items-center justify-center bg-[#FAF8F4] select-none">
          <div className="flex flex-col items-center gap-xs">
            <span className="material-symbols-outlined animate-spin text-primary text-[32px]">sync</span>
            <span className="text-on-surface-variant font-body-md text-body-md">Carregando dados da OS...</span>
          </div>
        </div>
      </Navigation>
    );
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

export default function OSDetailPage() {
  return (
    <Suspense
      fallback={
        <Navigation currentTab="service">
          <div className="flex h-[50vh] w-full items-center justify-center bg-[#FAF8F4] select-none">
            <div className="flex flex-col items-center gap-xs">
              <span className="material-symbols-outlined animate-spin text-primary text-[32px]">sync</span>
              <span className="text-on-surface-variant font-body-md text-body-md">Carregando...</span>
            </div>
          </div>
        </Navigation>
      }
    >
      <OSDetailsLoader />
    </Suspense>
  );
}
