'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Navigation from '@/components/Navigation';
import Link from 'next/link';
import ClientDetailsUI from '@/components/ClientDetailsUI';
import { DBClient, DBLocation } from '@/lib/types';

function ClientDetailsLoader() {
  const searchParams = useSearchParams();
  const id = searchParams.get('id');

  const [client, setClient] = useState<DBClient | null>(null);
  const [locations, setLocations] = useState<DBLocation[]>([]);
  const [loading, setLoading] = useState(!id ? false : true);
  const [errorMsg, setErrorMsg] = useState<string | null>(
    !id ? 'ID do cliente não fornecido.' : null
  );

  useEffect(() => {
    if (!id) return;

    let isMounted = true;

    async function fetchData() {
      try {
        const res = await fetch(`/api/clientes/${id}`);
        const data = await res.json();

        if (!res.ok || !data.success) {
          throw new Error(data.error || 'Cliente não encontrado.');
        }

        if (isMounted) {
          setClient(data.data.client);
          setLocations(data.data.locations);
          setLoading(false);
        }
      } catch (err) {
        console.error('Erro ao carregar dados do cliente no cliente:', err);
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
      <Navigation currentTab="clients">
        <div className="flex h-[50vh] w-full items-center justify-center bg-[#FAF8F4] select-none">
          <div className="flex flex-col items-center gap-xs">
            <span className="material-symbols-outlined animate-spin text-primary text-[32px]">sync</span>
            <span className="text-on-surface-variant font-body-md text-body-md">Carregando dados da clínica...</span>
          </div>
        </div>
      </Navigation>
    );
  }

  if (errorMsg || !client) {
    return (
      <Navigation currentTab="clients">
        <main className="px-md py-lg max-w-3xl mx-auto space-y-lg text-center flex flex-col items-center justify-center min-h-[50vh]">
          <span className="material-symbols-outlined text-outline text-6xl">domain_disabled</span>
          <h2 className="font-headline-md text-headline-md text-on-surface font-bold mt-sm">
            Clínica não encontrada
          </h2>
          <p className="text-on-surface-variant font-body-md max-w-md mt-xs">
            {errorMsg || 'Os detalhes deste cliente não puderam ser recuperados.'}
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

  return (
    <ClientDetailsUI
      client={client}
      locations={locations}
    />
  );
}

export default function ClientDetailPage() {
  return (
    <Suspense
      fallback={
        <Navigation currentTab="clients">
          <div className="flex h-[50vh] w-full items-center justify-center bg-[#FAF8F4] select-none">
            <div className="flex flex-col items-center gap-xs">
              <span className="material-symbols-outlined animate-spin text-primary text-[32px]">sync</span>
              <span className="text-on-surface-variant font-body-md text-body-md">Carregando...</span>
            </div>
          </div>
        </Navigation>
      }
    >
      <ClientDetailsLoader />
    </Suspense>
  );
}
