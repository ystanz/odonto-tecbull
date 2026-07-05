'use client';
export const runtime = 'edge';
export const dynamic = 'force-dynamic';
import React, { useState, useEffect, useCallback } from 'react';
import Navigation from '@/components/Navigation';
import Link from 'next/link';
import {
  getClientsAction,
  createClientAction,
  updateClientAction,
  getLocationsAction,
  createLocationAction,
  getEquipmentsAction,
} from '@/app/actions';
import { DBLocation, DBEquipment, DBClient } from '@/lib/types';

interface Location {
  id: string;
  name: string;
  room: string | null;
  assetsCount: number;
  statusText: string;
}

interface ClientData {
  id: string;
  name: string;
  totalAssets: number;
  locations: Location[];
}

export default function ClientesPage() {
  const [clients, setClients] = useState<ClientData[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Modal States
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<ClientData | null>(null);
  const [isEditClientModalOpen, setIsEditClientModalOpen] = useState(false);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);

  // Form Fields
  const [newClientName, setNewClientName] = useState('');
  const [newLocationClientId, setNewLocationClientId] = useState('');
  const [newLocationName, setNewLocationName] = useState('');
  const [newLocationRoom, setNewLocationRoom] = useState('');

  // Form Actions Loading
  const [submittingClient, setSubmittingClient] = useState(false);
  const [submittingLocation, setSubmittingLocation] = useState(false);

  // Toast notifications State
  const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' } | null>(null);

  const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  }, []);

  useEffect(() => {
    let active = true;
    async function fetchData() {
      try {
        setLoading(true);
        let rawClients: DBClient[] = [];
        let rawLocations: DBLocation[] = [];
        let rawEquipments: DBEquipment[] = [];

        const resClients = await getClientsAction();
        if (resClients.success) {
          rawClients = resClients.data || [];
          const resLocs = await getLocationsAction();
          rawLocations = resLocs.success ? resLocs.data || [] : [];
          const resEquips = await getEquipmentsAction();
          rawEquipments = resEquips.success ? resEquips.data || [] : [];
        } else {
          showToast('Erro ao carregar dados do banco de dados.', 'error');
        }

        if (!active) return;

        const formattedClients: ClientData[] = rawClients.map((client) => {
          const clientLocs = rawLocations.filter((l) => l.client_id === client.id);
          let totalAssets = 0;

          const locationsList = clientLocs.map((loc) => {
            const equips = rawEquipments.filter((e) => e.location_id === loc.id);
            const count = equips.length;
            totalAssets += count;

            const pendingCount = equips.filter((e) => e.status === 'Pendente').length;
            const inactiveCount = equips.filter((e) => e.status === 'Inativo' || e.status === 'Parado').length;

            let statusText = `${count} Ativos`;
            if (pendingCount > 0) {
              statusText += ` • ${pendingCount} Pendentes`;
            } else if (inactiveCount > 0) {
              statusText += ` • ${inactiveCount} Parado`;
            } else if (count > 0) {
              statusText += ` • Tudo Ok`;
            } else {
              statusText = `Sem ativos cadastrados`;
            }

            return {
              id: loc.id,
              name: loc.name,
              room: loc.room,
              assetsCount: count,
              statusText,
            };
          });

          return {
            id: client.id,
            name: client.name,
            totalAssets,
            locations: locationsList,
          };
        });

        setClients(formattedClients);
      } catch (err) {
        console.error('Erro ao buscar dados:', err);
        if (active) {
          showToast('Erro ao buscar dados do servidor.', 'error');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    fetchData();

    return () => {
      active = false;
    };
  }, [refreshTrigger, showToast]);

  const toggleSection = (id: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleAddClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClientName.trim()) return;

    try {
      setSubmittingClient(true);
      const res = await createClientAction(newClientName);
      if (res.success) {
        showToast('Clínica cadastrada com sucesso!');
      } else {
        throw new Error(res.error);
      }
      setNewClientName('');
      setIsClientModalOpen(false);
      setRefreshTrigger((prev) => prev + 1);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro desconhecido';
      showToast(`Erro ao criar clínica: ${msg}`, 'error');
    } finally {
      setSubmittingClient(false);
    }
  };

  const handleAddLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLocationClientId || !newLocationName.trim()) return;

    try {
      setSubmittingLocation(true);
      const res = await createLocationAction(newLocationClientId, newLocationName, newLocationRoom || undefined);
      if (res.success) {
        showToast('Unidade cadastrada com sucesso!');
      } else {
        throw new Error(res.error);
      }
      setNewLocationClientId('');
      setNewLocationName('');
      setNewLocationRoom('');
      setIsLocationModalOpen(false);
      setRefreshTrigger((prev) => prev + 1);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro desconhecido';
      showToast(`Erro ao criar unidade: ${msg}`, 'error');
    } finally {
      setSubmittingLocation(false);
    }
  };

  const handleEditClientSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingClient || !newClientName.trim()) return;

    try {
      setSubmittingClient(true);
      const res = await updateClientAction(editingClient.id, newClientName);
      if (res.success) {
        showToast('Clínica atualizada com sucesso!');
      } else {
        throw new Error(res.error);
      }
      setNewClientName('');
      setIsEditClientModalOpen(false);
      setEditingClient(null);
      setRefreshTrigger((prev) => prev + 1);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro desconhecido';
      showToast(`Erro ao editar clínica: ${msg}`, 'error');
    } finally {
      setSubmittingClient(false);
    }
  };

  const filteredClients = clients.filter((client) => {
    const matchesClient = client.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesLocation = client.locations.some((loc) =>
      loc.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
    return matchesClient || matchesLocation;
  });

  return (
    <Navigation currentTab="clients">
      <main className="flex-1 overflow-y-auto px-md py-lg pb-32 max-w-4xl mx-auto w-full">
        {/* Toast Notification */}
        {toast && (
          <div
            className={`fixed top-4 right-4 z-[100] px-md py-sm rounded-lg shadow-lg text-white font-body-md animate-fade-in flex items-center gap-xs ${toast.type === 'error' ? 'bg-error' : 'bg-tertiary'
              }`}
          >
            <span className="material-symbols-outlined">
              {toast.type === 'error' ? 'error' : 'check_circle'}
            </span>
            <span>{toast.message}</span>
          </div>
        )}

        {/* Header Section */}
        <div className="mb-lg flex flex-col sm:flex-row sm:items-center sm:justify-between gap-md">
          <div>
            <h2 className="font-headline-lg text-headline-lg text-on-background mb-xs">
              Clientes e Locais
            </h2>
            <p className="text-on-surface-variant font-body-md text-body-md">
              Gerencie clínicas parceiras e acompanhe o status de seus locais de atendimento.
            </p>
          </div>

          <div className="flex gap-sm">
            <button
              onClick={() => setIsClientModalOpen(true)}
              className="flex-1 sm:flex-initial h-touch-target px-md bg-primary text-on-primary font-label-caps text-label-caps rounded-xl hover:bg-primary-container hover:text-on-primary-container transition-colors flex items-center justify-center gap-xs shadow-sm cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
              + Clínica
            </button>
            <button
              onClick={() => setIsLocationModalOpen(true)}
              className="flex-1 sm:flex-initial h-touch-target px-md bg-surface-container-high border border-outline/10 text-on-surface font-label-caps text-label-caps rounded-xl hover:bg-surface-container-highest transition-colors flex items-center justify-center gap-xs shadow-sm cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">add_location</span>
              + Unidade
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mb-lg relative">
          <span className="material-symbols-outlined absolute left-sm top-1/2 transform -translate-y-1/2 text-outline">
            search
          </span>
          <input
            className="w-full pl-xl pr-md py-sm h-touch-target bg-surface-container-lowest border border-outline/20 rounded-lg font-body-md text-body-md text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary shadow-sm"
            placeholder="Pesquisar clínicas, unidades..."
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Loading Indicator */}
        {loading && (
          <div className="text-center py-8 text-on-surface-variant font-body-md flex flex-col items-center justify-center gap-sm bg-surface-container-lowest rounded-xl border border-outline/10 shadow-sm">
            <span className="material-symbols-outlined animate-spin text-primary text-3xl">sync</span>
            <span>Carregando clínicas e unidades...</span>
          </div>
        )}

        {/* Client Cards */}
        {!loading && (
          <div className="space-y-md animate-fade-in">
            {filteredClients.map((client) => {
              const isExpanded = expandedSections[client.id] || false;
              return (
                <div
                  key={client.id}
                  className="bg-surface-container-lowest rounded-xl shadow-sm border border-outline/10 overflow-hidden"
                >
                  <div
                    className="p-md cursor-pointer flex justify-between items-center hover:bg-surface-container-low transition-colors select-none"
                    onClick={() => toggleSection(client.id)}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-headline-sm text-headline-sm text-on-surface">
                          {client.name}
                        </h3>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingClient(client);
                            setNewClientName(client.name);
                            setIsEditClientModalOpen(true);
                          }}
                          className="text-primary hover:text-primary-container p-1 rounded-full cursor-pointer hover:bg-surface-container-high transition-colors"
                          title="Editar Clínica"
                        >
                          <span className="material-symbols-outlined text-[18px]">edit</span>
                        </button>
                      </div>
                      <p className="font-body-md text-body-md text-on-surface-variant flex items-center gap-xs mt-xs">
                        <span className="material-symbols-outlined text-[16px]">precision_manufacturing</span>
                        {client.totalAssets} {client.totalAssets === 1 ? 'Equipamento' : 'Equipamentos'} no Total
                      </p>
                    </div>
                    <span
                      className="material-symbols-outlined text-outline-variant transition-transform duration-200"
                      style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
                    >
                      expand_more
                    </span>
                  </div>

                  {/* Expandable Units */}
                  {isExpanded && (
                    <div className="border-t border-outline/10 bg-surface">
                      {client.locations.length === 0 ? (
                        <div className="p-md text-center text-on-surface-variant font-body-md italic">
                          Sem unidades cadastradas
                        </div>
                      ) : (
                        client.locations.map((loc) => (
                          <div
                            key={loc.id}
                            className="p-md border-b border-outline/10 last:border-0 hover:bg-surface-container-low transition-colors flex justify-between items-center"
                          >
                            <div>
                              <p className="font-body-lg text-body-lg font-medium text-on-surface">
                                {loc.name} {loc.room && ` - ${loc.room}`}
                              </p>
                              <p className="font-technical-code text-technical-code text-on-surface-variant mt-base">
                                {loc.statusText}
                              </p>
                            </div>
                            <Link prefetch={false} href={`/equipamentos?q=${encodeURIComponent(loc.name)}`}>
                              <span className="material-symbols-outlined text-primary hover:scale-115 transition-transform p-sm">
                                chevron_right
                              </span>
                            </Link>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            {filteredClients.length === 0 && (
              <div className="text-center py-8 text-on-surface-variant font-body-md bg-surface-container-lowest rounded-xl border border-outline/10 shadow-sm">
                Nenhuma clínica encontrada para a busca.
              </div>
            )}
          </div>
        )}

        {/* Floating Action Button */}
        <Link
          prefetch={false}
          href="/os/nova"
          className="fixed bottom-[96px] right-md w-touch-target h-touch-target bg-primary text-on-primary rounded-xl shadow-lg flex items-center justify-center active:scale-95 transition-transform z-40 hover:bg-primary-container"
        >
          <span className="material-symbols-outlined">add</span>
        </Link>

        {/* MODAL 1: Cadastrar Nova Clínica */}
        {isClientModalOpen && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 p-4" onClick={() => setIsClientModalOpen(false)}>
            <div className="bg-white w-[90vw] min-w-[320px] max-w-2xl rounded-xl shadow-2xl flex flex-col max-h-[90vh] animate-scale-up" onClick={(e) => e.stopPropagation()}>
              <div className="p-6 overflow-y-auto flex flex-col gap-4">

                <div className="flex justify-between items-center">
                  <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold">
                    Nova Clínica Cliente
                  </h3>
                  <button
                    type="button"
                    onClick={() => setIsClientModalOpen(false)}
                    className="p-2 text-on-surface-variant hover:bg-surface-container-high rounded-full cursor-pointer transition-colors"
                  >
                    <span className="material-symbols-outlined">close</span>
                  </button>
                </div>

                <form onSubmit={handleAddClient} className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1">
                    <label htmlFor="client-name" className="font-label-caps text-label-caps text-on-surface-variant">
                      Nome da Clínica
                    </label>
                    <input
                      id="client-name"
                      type="text"
                      required
                      placeholder="Ex: Clínica OdontoVida"
                      className="w-full px-4 h-12 bg-surface-container-lowest border border-outline/20 rounded-lg font-body-lg text-body-lg text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary shadow-sm"
                      value={newClientName}
                      onChange={(e) => setNewClientName(e.target.value)}
                    />
                  </div>

                  <div className="flex justify-end gap-3 mt-2">
                    <button
                      type="button"
                      onClick={() => setIsClientModalOpen(false)}
                      className="h-12 px-4 rounded-lg text-on-surface-variant hover:bg-surface-container-high transition-colors font-label-caps text-label-caps cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={submittingClient || !newClientName.trim()}
                      className="h-12 px-6 rounded-lg bg-primary text-on-primary hover:bg-primary-container font-label-caps text-label-caps transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    >
                      {submittingClient ? 'Salvando...' : 'Salvar'}
                    </button>
                  </div>
                </form>

              </div>
            </div>
          </div>
        )}

        {/* MODAL 2: Cadastrar Nova Unidade / Local */}
        {isLocationModalOpen && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 p-4" onClick={() => setIsLocationModalOpen(false)}>
            <div className="bg-white w-[90vw] min-w-[320px] max-w-2xl rounded-xl shadow-2xl flex flex-col max-h-[90vh] animate-scale-up" onClick={(e) => e.stopPropagation()}>
              <div className="p-6 overflow-y-auto flex flex-col gap-4">

                <div className="flex justify-between items-center">
                  <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold">
                    Nova Unidade / Local
                  </h3>
                  <button
                    type="button"
                    onClick={() => setIsLocationModalOpen(false)}
                    className="p-2 text-on-surface-variant hover:bg-surface-container-high rounded-full cursor-pointer transition-colors"
                  >
                    <span className="material-symbols-outlined">close</span>
                  </button>
                </div>

                <form onSubmit={handleAddLocation} className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1">
                    <label htmlFor="location-client" className="font-label-caps text-label-caps text-on-surface-variant">
                      Clínica Cliente
                    </label>
                    <div className="relative w-full">
                      <select
                        id="location-client"
                        required
                        className="w-full h-12 px-4 bg-surface-container-lowest border border-outline/20 rounded-lg font-body-lg text-body-lg text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary appearance-none cursor-pointer"
                        value={newLocationClientId}
                        onChange={(e) => setNewLocationClientId(e.target.value)}
                      >
                        <option value="">Selecione uma clínica...</option>
                        {clients.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                      <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none">
                        arrow_drop_down
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label htmlFor="location-name" className="font-label-caps text-label-caps text-on-surface-variant">
                      Nome da Unidade / Prédio
                    </label>
                    <input
                      id="location-name"
                      type="text"
                      required
                      placeholder="Ex: Unidade Centro, Bloco B"
                      className="w-full px-4 h-12 bg-surface-container-lowest border border-outline/20 rounded-lg font-body-lg text-body-lg text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary shadow-sm"
                      value={newLocationName}
                      onChange={(e) => setNewLocationName(e.target.value)}
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label htmlFor="location-room" className="font-label-caps text-label-caps text-on-surface-variant">
                      Sala / Consultório (Opcional)
                    </label>
                    <input
                      id="location-room"
                      type="text"
                      placeholder="Ex: Consultório 1, Esterilização"
                      className="w-full px-4 h-12 bg-surface-container-lowest border border-outline/20 rounded-lg font-body-lg text-body-lg text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary shadow-sm"
                      value={newLocationRoom}
                      onChange={(e) => setNewLocationRoom(e.target.value)}
                    />
                  </div>

                  <div className="flex justify-end gap-3 mt-2">
                    <button
                      type="button"
                      onClick={() => setIsLocationModalOpen(false)}
                      className="h-12 px-4 rounded-lg text-on-surface-variant hover:bg-surface-container-high transition-colors font-label-caps text-label-caps cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={submittingLocation || !newLocationClientId || !newLocationName.trim()}
                      className="h-12 px-6 rounded-lg bg-primary text-on-primary hover:bg-primary-container font-label-caps text-label-caps transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    >
                      {submittingLocation ? 'Salvando...' : 'Salvar'}
                    </button>
                  </div>
                </form>

              </div>
            </div>
          </div>
        )}
        {/* MODAL EDIT: Editar Clínica Cliente */}
        {isEditClientModalOpen && editingClient && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 p-4" onClick={() => setIsEditClientModalOpen(false)}>
            <div className="bg-white w-[90vw] min-w-[320px] max-w-2xl rounded-xl shadow-2xl flex flex-col max-h-[90vh] animate-scale-up" onClick={(e) => e.stopPropagation()}>
              <div className="p-6 overflow-y-auto flex flex-col gap-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold">
                    Editar Clínica Cliente
                  </h3>
                  <button
                    onClick={() => setIsEditClientModalOpen(false)}
                    className="p-2 text-on-surface-variant hover:bg-surface-container-high rounded-full cursor-pointer transition-colors"
                  >
                    <span className="material-symbols-outlined">close</span>
                  </button>
                </div>

                <form onSubmit={handleEditClientSubmit} className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1">
                    <label htmlFor="edit-client-name" className="font-label-caps text-label-caps text-on-surface-variant">
                      Nome da Clínica
                    </label>
                    <input
                      id="edit-client-name"
                      type="text"
                      required
                      placeholder="Ex: Clínica OdontoVida"
                      className="w-full px-4 h-12 bg-surface-container-lowest border border-outline/20 rounded-lg font-body-lg text-body-lg text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary shadow-sm"
                      value={newClientName}
                      onChange={(e) => setNewClientName(e.target.value)}
                    />
                  </div>

                  <div className="flex justify-end gap-3 mt-2">
                    <button
                      type="button"
                      onClick={() => setIsEditClientModalOpen(false)}
                      className="h-12 px-4 rounded-lg text-on-surface-variant hover:bg-surface-container-high transition-colors font-label-caps text-label-caps cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={submittingClient || !newClientName.trim()}
                      className="h-12 px-6 rounded-lg bg-primary text-on-primary hover:bg-primary-container font-label-caps text-label-caps transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    >
                      {submittingClient ? 'Salvando...' : 'Salvar'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </main>
    </Navigation>
  );
}
