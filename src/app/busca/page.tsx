'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Navigation from '@/components/Navigation';

interface SearchClient {
  id: string;
  name: string;
  email: string | null;
  responsibleName: string | null;
  phone: string | null;
}

interface SearchEquipment {
  id: string;
  name: string;
  serialNumber: string | null;
  manufacturer: string | null;
  status: string;
}

interface SearchOS {
  id: string;
  code: string;
  status: 'ABERTA' | 'EM ANDAMENTO' | 'AGUARDANDO PEÇA' | 'CONCLUÍDA';
  priority: 'NORMAL' | 'CRÍTICO';
  defectReported: string;
  createdAt: string;
  clientName: string;
  equipmentName: string;
}

interface SearchResults {
  clients: SearchClient[];
  equipments: SearchEquipment[];
  os: SearchOS[];
}

function BuscaResultados() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || '';

  const [results, setResults] = useState<SearchResults | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!query.trim()) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setResults({ clients: [], equipments: [], os: [] });
      return;
    }

    async function executeSearch() {
      try {
        setLoading(true);
        setError(null);
        const resRaw = await fetch(`/api/busca?q=${encodeURIComponent(query)}`);
        const res = await resRaw.json();
        if (res.success && res.data) {
          setResults(res.data);
        } else {
          setError(res.error || 'Erro ao realizar a pesquisa.');
        }
      } catch (err) {
        console.error(err);
        setError('Erro de conexão com o servidor.');
      } finally {
        setLoading(false);
      }
    }

    executeSearch();
  }, [query]);

  return (
    <div className="space-y-xl">
      <div className="border-b border-outline-variant/30 pb-md">
        <span className="font-label-caps text-label-caps text-on-surface-variant tracking-wider">RESULTADOS DA BUSCA</span>
        <h2 className="font-headline-lg text-headline-lg text-on-background mt-xs font-semibold">
          Termo pesquisado: <span className="text-primary italic font-bold">&quot;{query}&quot;</span>
        </h2>
      </div>

      {loading && (
        <div className="text-center py-16 text-on-surface-variant font-body-md flex flex-col items-center justify-center gap-sm bg-white rounded-2xl border border-outline/10 shadow-sm">
          <span className="material-symbols-outlined animate-spin text-primary text-3xl">sync</span>
          <span>Pesquisando no banco de dados...</span>
        </div>
      )}

      {!loading && error && (
        <div className="text-center py-12 text-error font-body-md bg-error/10 border border-error/20 rounded-2xl p-lg flex flex-col items-center gap-sm">
          <span className="material-symbols-outlined text-4xl">report_off</span>
          <span className="font-semibold">{error}</span>
        </div>
      )}

      {!loading && !error && results && (
        <div className="space-y-xl">
          {/* Seção de Clientes */}
          <section className="bg-white rounded-2xl border border-outline/10 shadow-sm p-lg">
            <div className="mb-md flex items-center space-x-2 text-on-surface">
              <span className="material-symbols-outlined text-primary">person</span>
              <h3 className="font-headline-sm text-lg font-bold">
                Clientes ({results.clients.length})
              </h3>
            </div>
            {results.clients.length === 0 ? (
              <p className="text-sm text-on-surface-variant italic py-sm">Nenhum cliente correspondente.</p>
            ) : (
              <div className="overflow-x-auto w-full">
                <table className="w-full text-left border-collapse min-w-[500px]">
                  <thead>
                    <tr className="border-b border-outline/10 text-on-surface-variant font-label-caps text-label-caps text-xs">
                      <th className="py-sm pb-md font-semibold">Nome</th>
                      <th className="py-sm pb-md font-semibold">Responsável</th>
                      <th className="py-sm pb-md font-semibold">Telefone</th>
                      <th className="py-sm pb-md font-semibold">Email</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline/5">
                    {results.clients.map((c) => (
                      <tr
                        key={c.id}
                        onClick={() => router.push(`/clientes/detalhes?id=${c.id}`)}
                        className="hover:bg-surface-container-lowest/50 transition-colors cursor-pointer group"
                      >
                        <td className="py-md text-sm text-primary font-semibold group-hover:underline">{c.name}</td>
                        <td className="py-md text-sm text-on-surface-variant">{c.responsibleName || 'N/A'}</td>
                        <td className="py-md text-sm text-on-surface-variant font-technical-code">{c.phone || 'N/A'}</td>
                        <td className="py-md text-sm text-on-surface-variant">{c.email || 'N/A'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* Seção de Equipamentos */}
          <section className="bg-white rounded-2xl border border-outline/10 shadow-sm p-lg">
            <div className="mb-md flex items-center space-x-2 text-on-surface">
              <span className="material-symbols-outlined text-tertiary">precision_manufacturing</span>
              <h3 className="font-headline-sm text-lg font-bold">
                Equipamentos ({results.equipments.length})
              </h3>
            </div>
            {results.equipments.length === 0 ? (
              <p className="text-sm text-on-surface-variant italic py-sm">Nenhum equipamento correspondente.</p>
            ) : (
              <div className="overflow-x-auto w-full">
                <table className="w-full text-left border-collapse min-w-[500px]">
                  <thead>
                    <tr className="border-b border-outline/10 text-on-surface-variant font-label-caps text-label-caps text-xs">
                      <th className="py-sm pb-md font-semibold">Nome</th>
                      <th className="py-sm pb-md font-semibold">Número de Série</th>
                      <th className="py-sm pb-md font-semibold">Fabricante</th>
                      <th className="py-sm pb-md font-semibold text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline/5">
                    {results.equipments.map((e) => (
                      <tr
                        key={e.id}
                        onClick={() => router.push(`/equipamentos/detalhes?id=${e.id}`)}
                        className="hover:bg-surface-container-lowest/50 transition-colors cursor-pointer group"
                      >
                        <td className="py-md text-sm text-primary font-semibold group-hover:underline">{e.name}</td>
                        <td className="py-md text-sm text-on-surface-variant font-technical-code">{e.serialNumber || 'N/A'}</td>
                        <td className="py-md text-sm text-on-surface-variant">{e.manufacturer || 'N/A'}</td>
                        <td className="py-md text-sm text-right">
                          <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-semibold font-label-caps ${
                            e.status === 'Ativo' ? 'bg-tertiary/15 text-tertiary' : 'bg-outline/15 text-outline'
                          }`}>
                            {e.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* Seção de Ordens de Serviço */}
          <section className="bg-white rounded-2xl border border-outline/10 shadow-sm p-lg">
            <div className="mb-md flex items-center space-x-2 text-on-surface">
              <span className="material-symbols-outlined text-secondary">pending_actions</span>
              <h3 className="font-headline-sm text-lg font-bold">
                Ordens de Serviço ({results.os.length})
              </h3>
            </div>
            {results.os.length === 0 ? (
              <p className="text-sm text-on-surface-variant italic py-sm">Nenhuma ordem de serviço correspondente.</p>
            ) : (
              <div className="overflow-x-auto w-full">
                <table className="w-full text-left border-collapse min-w-[500px]">
                  <thead>
                    <tr className="border-b border-outline/10 text-on-surface-variant font-label-caps text-label-caps text-xs">
                      <th className="py-sm pb-md font-semibold">OS/ID</th>
                      <th className="py-sm pb-md font-semibold">Cliente</th>
                      <th className="py-sm pb-md font-semibold">Equipamento</th>
                      <th className="py-sm pb-md font-semibold text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline/5">
                    {results.os.map((wo) => {
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
                          <td className="py-md text-sm text-primary font-semibold group-hover:underline font-technical-code">{wo.code}</td>
                          <td className="py-md text-sm text-on-surface-variant">{wo.clientName || 'Cliente Geral'}</td>
                          <td className="py-md text-sm text-on-surface-variant">{wo.equipmentName || 'Equipamento'}</td>
                          <td className="py-md text-sm text-right">
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
    </div>
  );
}

export default function BuscaPage() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return (
      <Navigation>
        <main className="flex-grow pb-32 pt-lg px-md w-full max-w-[800px] mx-auto md:px-xl">
          <div className="text-center py-16 text-on-surface-variant font-body-md flex flex-col items-center justify-center gap-sm bg-white rounded-2xl border border-outline/10 shadow-sm">
            <span className="material-symbols-outlined animate-spin text-primary text-3xl">sync</span>
            <span>Carregando busca...</span>
          </div>
        </main>
      </Navigation>
    );
  }

  return (
    <Navigation>
      <main className="flex-grow pb-32 pt-lg px-md w-full max-w-[800px] mx-auto md:px-xl animate-fade-in">
        <Suspense fallback={
          <div className="text-center py-16 text-on-surface-variant font-body-md flex flex-col items-center justify-center gap-sm bg-white rounded-2xl border border-outline/10 shadow-sm">
            <span className="material-symbols-outlined animate-spin text-primary text-3xl">sync</span>
            <span>Carregando resultados...</span>
          </div>
        }>
          <BuscaResultados />
        </Suspense>
      </main>
    </Navigation>
  );
}
