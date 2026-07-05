export const runtime = 'edge';
export const dynamic = 'force-dynamic';

import React from 'react';
import Navigation from '@/components/Navigation';
import Link from 'next/link';
import ClientDetailsUI from '@/components/ClientDetailsUI';
import { getClientDetailsAction } from '@/app/actions';
import { headers } from 'next/headers';

import { DBClient, DBLocation } from '@/lib/types';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ClientDetailPage({ params }: PageProps) {
  const { id } = await params;
  await headers(); // Hack to force Next.js and Cloudflare to treat this as a strict dynamic Edge endpoint

  let client: DBClient | null = null;
  let locations: DBLocation[] = [];
  let errorMsg = null;

  try {
    const res = await getClientDetailsAction(id);
    if (res.success && res.data) {
      client = res.data.client;
      locations = res.data.locations;
    } else {
      errorMsg = res.error || 'Cliente não encontrado.';
    }
  } catch (err) {
    console.error('Erro ao carregar dados do cliente no servidor:', err);
    errorMsg = 'Erro de conexão com o banco de dados.';
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
            {errorMsg || 'Os detalhes deste cliente não puderam ser recuperados ou o registro foi excluído.'}
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
      id={id}
      initialClient={client}
      initialLocations={locations}
    />
  );
}
