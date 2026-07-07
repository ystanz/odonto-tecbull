'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Navigation from '@/components/Navigation';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
// no actions imported
import { DBClient, DBLocation, DBSettings, DBWorkOrder } from '@/lib/types';

interface ClientDetailsUIProps {
  client: DBClient;
  locations: DBLocation[];
}

export default function ClientDetailsUI({ client: initialClient, locations: initialLocations }: ClientDetailsUIProps) {
  const id = initialClient.id;
  const router = useRouter();

  // Data States
  const [client, setClient] = useState<DBClient>(initialClient);
  const [locations, setLocations] = useState<DBLocation[]>(initialLocations);
  const [workOrders, setWorkOrders] = useState<DBWorkOrder[]>([]);
  const [settings, setSettings] = useState<DBSettings | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Modal States
  const [isEditClientModalOpen, setIsEditClientModalOpen] = useState(false);
  const [isAddLocationModalOpen, setIsAddLocationModalOpen] = useState(false);
  const [isEditLocationModalOpen, setIsEditLocationModalOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<DBLocation | null>(null);

  // Client Form Fields
  const [clientName, setClientName] = useState(initialClient.name);
  const [clientResponsibleName, setClientResponsibleName] = useState(initialClient.responsible_name || '');
  const [clientPhone, setClientPhone] = useState(initialClient.phone || '');
  const [clientEmail, setClientEmail] = useState(initialClient.email || '');

  // Location Form Fields
  const [locName, setLocName] = useState('');
  const [locRoom, setLocRoom] = useState('');
  const [locAddress, setLocAddress] = useState('');
  const [locContact, setLocContact] = useState('');
  const [locNotes, setLocNotes] = useState('');

  // Action Loading states
  const [submittingClient, setSubmittingClient] = useState(false);
  const [submittingLocation, setSubmittingLocation] = useState(false);
  const [deletingClient, setDeletingClient] = useState(false);

  // Toast alert state
  const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' } | null>(null);

  const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  }, []);

  // Fetch client details & locations on refresh trigger
  const loadClientDetails = useCallback(async () => {
    if (refreshTrigger === 0) return; // Skip initial load since we have props
    try {
      setLoading(true);
      const resRaw = await fetch(`/api/clientes/${id}`);
      const res = await resRaw.json();
      if (res.success && res.data) {
        setClient(res.data.client);
        setLocations(res.data.locations);
        
        // Sync edit fields
        setClientName(res.data.client.name);
        setClientResponsibleName(res.data.client.responsible_name || '');
        setClientPhone(res.data.client.phone || '');
        setClientEmail(res.data.client.email || '');
      } else {
        showToast(res.error || 'Erro ao carregar dados do cliente.', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Erro de conexão com o banco de dados.', 'error');
    } finally {
      setLoading(false);
    }
  }, [id, refreshTrigger, showToast]);

  // Carregar configurações comerciais
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsMounted(true);
    async function fetchSettings() {
      try {
        const resRaw = await fetch('/api/settings');
        const res = await resRaw.json();
        if (res.success && res.data) {
          setSettings(res.data);
        }
      } catch (err) {
        console.error('Erro ao carregar configurações para relatório:', err);
      }
    }
    fetchSettings();
  }, []);

  // Carregar ordens de serviço do cliente
  const loadWorkOrders = useCallback(async () => {
    try {
      const resRaw = await fetch('/api/ordens-servico');
      const res = await resRaw.json();
      if (res.success && res.data) {
        const clientWos = (res.data || []).filter((wo: DBWorkOrder) => wo.client_id === id);
        setWorkOrders(clientWos);
      }
    } catch (err) {
      console.error('Erro ao carregar ordens de serviço para relatório:', err);
    }
  }, [id]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadWorkOrders();
  }, [loadWorkOrders, refreshTrigger]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadClientDetails();
  }, [loadClientDetails]);

  // Actions
  const handleEditClientSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName.trim()) return;

    try {
      setSubmittingClient(true);
      const resRaw = await fetch(`/api/clientes/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: clientName,
          responsibleName: clientResponsibleName || null,
          phone: clientPhone || null,
          email: clientEmail || null
        })
      });
      const res = await resRaw.json();
      if (res.success) {
        showToast('Dados do cliente atualizados com sucesso!');
        setIsEditClientModalOpen(false);
        router.refresh();
        setRefreshTrigger(prev => prev + 1);
      } else {
        throw new Error(res.error);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro desconhecido';
      showToast(`Erro ao editar cliente: ${msg}`, 'error');
    } finally {
      setSubmittingClient(false);
    }
  };

  const handleDeleteClient = async () => {
    if (!window.confirm('Tem certeza que deseja excluir esta clínica? Todos os locais e vínculos associados serão removidos permanentemente.')) {
      return;
    }

    try {
      setDeletingClient(true);
      const resRaw = await fetch(`/api/clientes/${id}`, {
        method: 'DELETE'
      });
      const res = await resRaw.json();
      if (res.success) {
        showToast('Clínica excluída com sucesso!');
        router.push('/clientes');
      } else {
        throw new Error(res.error);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro desconhecido';
      showToast(`Erro ao excluir clínica: ${msg}`, 'error');
      setDeletingClient(false);
    }
  };

  const handleAddLocationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!locName.trim()) return;

    try {
      setSubmittingLocation(true);
      const resRaw = await fetch('/api/locations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: id,
          name: locName,
          room: locRoom || null,
          address: locAddress || null,
          contact: locContact || null,
          notes: locNotes || null
        })
      });
      const res = await resRaw.json();
      if (res.success) {
        showToast('Unidade cadastrada com sucesso!');
        setIsAddLocationModalOpen(false);
        // Clear fields
        setLocName('');
        setLocRoom('');
        setLocAddress('');
        setLocContact('');
        setLocNotes('');
        router.refresh();
        setRefreshTrigger(prev => prev + 1);
      } else {
        throw new Error(res.error);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro desconhecido';
      showToast(`Erro ao cadastrar unidade: ${msg}`, 'error');
    } finally {
      setSubmittingLocation(false);
    }
  };

  const handleEditLocationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLocation || !locName.trim()) return;

    try {
      setSubmittingLocation(true);
      const resRaw = await fetch(`/api/locations/${editingLocation.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: id,
          name: locName,
          room: locRoom || null,
          address: locAddress || null,
          contact: locContact || null,
          notes: locNotes || null
        })
      });
      const res = await resRaw.json();
      if (res.success) {
        showToast('Unidade atualizada com sucesso!');
        setIsEditLocationModalOpen(false);
        setEditingLocation(null);
        router.refresh();
        setRefreshTrigger(prev => prev + 1);
      } else {
        throw new Error(res.error);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro desconhecido';
      showToast(`Erro ao editar unidade: ${msg}`, 'error');
    } finally {
      setSubmittingLocation(false);
    }
  };

  const handleDeleteLocation = async (locId: string) => {
    if (!window.confirm('Deseja realmente excluir esta unidade/local de atendimento?')) {
      return;
    }

    try {
      const resRaw = await fetch(`/api/locations/${locId}`, {
        method: 'DELETE'
      });
      const res = await resRaw.json();
      if (res.success) {
        showToast('Unidade excluída com sucesso!');
        router.refresh();
        setRefreshTrigger(prev => prev + 1);
      } else {
        throw new Error(res.error);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro desconhecido';
      showToast(`Erro ao excluir unidade: ${msg}`, 'error');
    }
  };

  const openEditLocationModal = (loc: DBLocation) => {
    setEditingLocation(loc);
    setLocName(loc.name);
    setLocRoom(loc.room || '');
    setLocAddress(loc.address || '');
    setLocContact(loc.contact || '');
    setLocNotes(loc.notes || '');
    setIsEditLocationModalOpen(true);
  };

  const handlePrint = () => {
    const originalTitle = document.title;
    const dateStr = new Date().toLocaleDateString('pt-BR').replace(/\//g, '-');
    const clientName = client.name.replace(/\s+/g, '_');
    document.title = `Relatorio_${clientName}_${dateStr}`;
    window.print();
    setTimeout(() => { document.title = originalTitle; }, 100);
  };

  if (!isMounted) {
    return null;
  }

  return (
    <Navigation currentTab="clients">
      <main className="flex-1 overflow-y-auto px-md py-lg pb-32 max-w-4xl mx-auto w-full space-y-lg">
        {/* Cabeçalho de Impressão Dinâmico (Exclusivo para PDF) */}
        <div className="hidden print:block print:mb-8 print:border-b print:pb-4 text-black">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <h1 className="text-2xl font-bold tracking-wide uppercase font-headline-lg">
                {settings?.companyName || 'OdontoTech Bull'}
              </h1>
              {settings?.ownerName && (
                <p className="text-sm font-semibold">{settings.ownerName}</p>
              )}
              <p className="text-xs text-gray-600">
                {settings?.phone && <span>Contato: {settings.phone}</span>}
              </p>
              {settings?.address && (
                <p className="text-xs text-gray-500 mt-1">{settings.address}</p>
              )}
            </div>
            <div className="text-right">
              <span className="text-sm font-semibold text-gray-700 block">
                Emissão: {new Date().toLocaleDateString('pt-BR')}
              </span>
            </div>
          </div>
          <h2 className="text-lg font-bold mt-4 mb-2 uppercase border-b border-gray-300 pb-1">Histórico de Serviço</h2>
        </div>

        {/* Toast Alert */}
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

        {/* Back Link */}
        <div className="flex items-center space-x-2 text-on-surface-variant font-body-md print:hidden">
          <Link prefetch={false} href="/clientes" className="hover:text-primary flex items-center">
            <span className="material-symbols-outlined text-md mr-1">arrow_back</span>
            Voltar para Clientes
          </Link>
        </div>

        {/* Loading Indicator */}
        {loading && (
          <div className="text-center py-12 text-on-surface-variant font-body-md flex flex-col items-center justify-center gap-sm bg-surface-container-lowest rounded-xl border border-outline/10 shadow-sm">
            <span className="material-symbols-outlined animate-spin text-primary text-3xl">sync</span>
            <span>Atualizando dados do cliente...</span>
          </div>
        )}

        {!loading && client && (
          <>
            {/* Client Profile Header Card */}
            <div className="bg-surface-container-lowest p-lg rounded-xl border border-outline/10 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-md relative overflow-hidden group print:shadow-none print:bg-transparent print:border-none print:rounded-none print:p-0 print:m-0 print:border-b print:border-gray-200 print:pb-4 print:mb-4">
              <div className="absolute inset-y-0 left-0 w-1.5 bg-primary print:hidden"></div>
              
              <div className="space-y-sm pl-md print:pl-0 print:flex print:flex-col print:gap-1 print:text-black">
                <div className="flex items-center gap-sm">
                  <h1 className="font-headline-md text-headline-md text-on-surface font-bold print:text-black print:text-lg">
                    {client.name}
                  </h1>
                </div>
 
                {/* Client Contact Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 gap-sm pt-xs print:grid print:grid-cols-2 print:gap-4 print:text-black print:text-sm">
                  <div className="flex items-center gap-xs text-on-surface-variant font-body-md print:text-black print:text-sm">
                    <span>
                      <strong>Responsável:</strong> {client.responsible_name || 'Não informado'}
                    </span>
                  </div>
                  <div className="flex items-center gap-xs text-on-surface-variant font-body-md print:text-black print:text-sm">
                    <span>
                      <strong>Contato:</strong> {client.phone || 'Não informado'}
                    </span>
                  </div>
                </div>
              </div>
 
              {/* Client Action Buttons */}
              <div className="flex md:flex-col lg:flex-row gap-sm pl-md md:pl-0 print:hidden">
                <button
                  onClick={handlePrint}
                  className="h-10 px-4 bg-primary text-on-primary font-label-caps text-label-caps rounded-xl hover:bg-primary-container transition-colors flex items-center justify-center gap-xs shadow-sm cursor-pointer text-sm"
                >
                  <span className="material-symbols-outlined text-[16px]">print</span>
                  Gerar Relatório
                </button>
                <button
                  onClick={() => setIsEditClientModalOpen(true)}
                  className="h-10 px-4 bg-surface-container-high border border-outline/10 text-on-surface font-label-caps text-label-caps rounded-xl hover:bg-surface-container-highest transition-colors flex items-center justify-center gap-xs shadow-sm cursor-pointer text-sm"
                >
                  <span className="material-symbols-outlined text-[16px]">edit</span>
                  Editar
                </button>
                <button
                  onClick={handleDeleteClient}
                  disabled={deletingClient}
                  className="h-10 px-4 bg-error/10 text-error font-label-caps text-label-caps rounded-xl hover:bg-error/20 transition-colors flex items-center justify-center gap-xs shadow-sm cursor-pointer text-sm disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-[16px]">delete</span>
                  Excluir
                </button>
              </div>
            </div>

            {/* Locations (Units) Section */}
            <div className="space-y-md print:mt-6 print:text-black print:shadow-none print:bg-transparent print:border-none print:rounded-none print:p-0 print:m-0">
              <div className="flex items-center justify-between">
                <h2 className="font-headline-sm text-headline-sm text-on-surface font-bold flex items-center gap-xs print:text-black print:text-sm print:font-semibold">
                  Unidades de Atendimento
                </h2>
                <button
                  onClick={() => {
                    setLocName('');
                    setLocRoom('');
                    setLocAddress('');
                    setLocContact('');
                    setLocNotes('');
                    setIsAddLocationModalOpen(true);
                  }}
                  className="h-10 px-4 bg-primary text-on-primary font-label-caps text-label-caps rounded-xl hover:bg-primary-container hover:text-on-primary-container transition-colors flex items-center justify-center gap-xs shadow-sm cursor-pointer text-sm font-semibold print:hidden"
                >
                  <span className="material-symbols-outlined text-[16px]">add_location</span>
                  Nova Unidade
                </button>
              </div>

              {locations.length === 0 ? (
                <div className="text-center py-12 text-on-surface-variant font-body-md bg-surface-container-lowest rounded-xl border border-outline/10 shadow-sm flex flex-col items-center justify-center gap-sm print:border-black print:text-black">
                  <span>Nenhuma unidade cadastrada para esta clínica parceira.</span>
                  <button
                    onClick={() => setIsAddLocationModalOpen(true)}
                    className="mt-2 text-primary font-bold hover:underline print:hidden"
                  >
                    Cadastre a primeira agora.
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-md print:grid print:grid-cols-2 print:gap-4 print:border-b print:border-gray-200 print:pb-4 print:mb-4">
                  {locations.map((loc) => (
                    <article
                      key={loc.id}
                      className="bg-surface-container-lowest rounded-xl border border-outline/10 p-md flex flex-col justify-between hover:shadow-md transition-all relative overflow-hidden group print:shadow-none print:text-black print:border-none print:p-0 print:bg-transparent print:rounded-none print:m-0 print:flex print:flex-col print:gap-1"
                    >
                      <div className="absolute inset-y-0 left-0 w-1 bg-outline/20 group-hover:bg-primary transition-colors print:hidden"></div>
                      
                      <div className="pl-xs space-y-sm print:pl-0">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold group-hover:text-primary transition-colors print:text-black print:text-sm print:font-semibold">
                              {loc.name}
                            </h3>
                            {loc.room && (
                              <span className="inline-block mt-1 px-sm py-base bg-secondary/15 text-secondary text-label-caps font-label-caps rounded print:bg-transparent print:text-black print:border print:border-gray-200 print:px-1 print:py-0 print:text-xs">
                                {loc.room}
                              </span>
                            )}
                          </div>
                          
                          {/* Unit Cards edit/delete options */}
                          <div className="flex gap-1 opacity-60 hover:opacity-100 transition-opacity print:hidden">
                            <button
                              onClick={() => openEditLocationModal(loc)}
                              className="p-1 hover:bg-surface-container-high rounded text-on-surface"
                              title="Editar Unidade"
                            >
                              <span className="material-symbols-outlined text-[18px]">edit</span>
                            </button>
                            <button
                              onClick={() => handleDeleteLocation(loc.id)}
                              className="p-1 hover:bg-error/10 text-error rounded"
                              title="Excluir Unidade"
                            >
                              <span className="material-symbols-outlined text-[18px]">delete</span>
                            </button>
                          </div>
                        </div>

                        {/* Specs of the Location */}
                        <div className="space-y-base pt-xs border-t border-outline/10 text-body-md text-on-surface-variant font-body-md print:text-black print:border-none print:p-0 print:text-sm print:flex print:flex-col print:gap-1">
                          {loc.address && (
                            <p className="flex items-start gap-xs">
                              <span><strong>Endereço:</strong> {loc.address}</span>
                            </p>
                          )}
                          {loc.notes && (
                            <p className="flex items-start gap-xs bg-surface-container-low/50 p-xs rounded border border-outline/5 print:bg-transparent print:border-0 print:p-0">
                              <span className="italic"><strong>Notas:</strong> {loc.notes}</span>
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="pl-xs pt-sm mt-md border-t border-outline/10 flex justify-between items-center print:hidden">
                        <Link
                          prefetch={false}
                          href={`/equipamentos?q=${encodeURIComponent(loc.name)}`}
                          className="text-[12px] text-primary font-label-caps text-label-caps flex items-center gap-xs hover:underline print:hidden"
                        >
                          <span>Ver Equipamentos</span>
                          <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                        </Link>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>

            {/* Tabela de Histórico de Manutenção */}
            <div className="space-y-md print:mt-6 print:text-black">
              <h2 className="font-headline-sm text-headline-sm text-on-surface font-bold flex items-center gap-xs print:text-black">
                Histórico de Manutenção ({workOrders.length})
              </h2>

              {workOrders.length === 0 ? (
                <div className="text-center py-8 text-on-surface-variant font-body-md bg-surface-container-lowest rounded-xl border border-outline/10 shadow-sm print:border-black print:text-black print:bg-transparent">
                  Nenhum chamado de manutenção registrado para esta clínica.
                </div>
              ) : (
                <div className="overflow-x-auto bg-surface-container-lowest rounded-xl border border-outline/10 shadow-sm print:shadow-none print:border-gray-200 print:text-black print:bg-transparent">
                  <table className="w-full text-left border-collapse print:text-black print:text-sm">
                    <thead>
                      <tr className="bg-surface-container-high text-on-surface font-semibold text-sm border-b border-outline/10 print:bg-transparent print:text-black print:border-gray-200">
                        <th className="p-md">Código OS</th>
                        <th className="p-md">Equipamento</th>
                        <th className="p-md">Defeito / Sintoma</th>
                        <th className="p-md">Solução / Observações</th>
                        <th className="p-md">Data do Serviço</th>
                        <th className="p-md">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {workOrders.map((wo) => (
                        <tr key={wo.id} className="border-b border-outline/5 hover:bg-surface-container-low transition-colors print:border-gray-200 print:text-black print:bg-transparent">
                          <td className="p-md font-bold text-primary print:text-black">{wo.code}</td>
                          <td className="p-md">{wo.equipments?.name || 'Equipamento Geral'}</td>
                          <td className="p-md text-sm">{wo.defect_reported}</td>
                          <td className="p-md text-sm">{wo.work_notes || 'Sem observações técnicas'}</td>
                          <td className="p-md text-sm">
                            {wo.service_date ? (
                              new Date(wo.service_date).toLocaleDateString('pt-BR')
                            ) : wo.created_at ? (
                              new Date(wo.created_at).toLocaleDateString('pt-BR')
                            ) : 'N/A'}
                          </td>
                          <td className="p-md text-xs">
                            <span className={`px-sm py-base rounded text-xs font-semibold print:p-0 print:font-normal print:bg-transparent print:text-black ${
                              wo.status === 'CONCLUÍDA' ? 'bg-tertiary/15 text-tertiary print:text-black' :
                              wo.status === 'EM ANDAMENTO' ? 'bg-secondary/15 text-secondary print:text-black' :
                              wo.status === 'AGUARDANDO PEÇA' ? 'bg-orange-500/15 text-orange-700 print:text-black' :
                              'bg-primary/15 text-primary print:text-black'
                            }`}>
                              {wo.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* MODAL: Editar Clínica Cliente */}
            {isEditClientModalOpen && (
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
                          Nome da Clínica*
                        </label>
                        <input
                          id="edit-client-name"
                          type="text"
                          required
                          placeholder="Ex: Clínica OdontoVida"
                          className="w-full px-4 h-12 bg-surface-container-lowest border border-outline/20 rounded-lg font-body-lg text-body-lg text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary shadow-sm"
                          value={clientName}
                          onChange={(e) => setClientName(e.target.value)}
                        />
                      </div>

                      <div className="flex flex-col gap-1">
                        <label htmlFor="edit-client-responsible" className="font-label-caps text-label-caps text-on-surface-variant">
                          Responsável da Clínica
                        </label>
                        <input
                          id="edit-client-responsible"
                          type="text"
                          placeholder="Ex: Dr. Roberto Santos"
                          className="w-full px-4 h-12 bg-surface-container-lowest border border-outline/20 rounded-lg font-body-lg text-body-lg text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary shadow-sm"
                          value={clientResponsibleName}
                          onChange={(e) => setClientResponsibleName(e.target.value)}
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1">
                          <label htmlFor="edit-client-phone" className="font-label-caps text-label-caps text-on-surface-variant">
                            Telefone de Contato
                          </label>
                          <input
                            id="edit-client-phone"
                            type="text"
                            placeholder="Ex: (11) 99999-9999"
                            className="w-full px-4 h-12 bg-surface-container-lowest border border-outline/20 rounded-lg font-body-lg text-body-lg text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary shadow-sm"
                            value={clientPhone}
                            onChange={(e) => setClientPhone(e.target.value)}
                          />
                        </div>

                        <div className="flex flex-col gap-1">
                          <label htmlFor="edit-client-email" className="font-label-caps text-label-caps text-on-surface-variant">
                            E-mail de Contato
                          </label>
                          <input
                            id="edit-client-email"
                            type="email"
                            placeholder="Ex: contato@sorriso.com"
                            className="w-full px-4 h-12 bg-surface-container-lowest border border-outline/20 rounded-lg font-body-lg text-body-lg text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary shadow-sm"
                            value={clientEmail}
                            onChange={(e) => setClientEmail(e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="flex justify-end gap-3 mt-4">
                        <button
                          type="button"
                          onClick={() => setIsEditClientModalOpen(false)}
                          className="h-12 px-4 rounded-lg text-on-surface-variant hover:bg-surface-container-high transition-colors font-label-caps text-label-caps cursor-pointer"
                        >
                          Cancelar
                        </button>
                        <button
                          type="submit"
                          disabled={submittingClient}
                          className="h-12 px-6 rounded-lg bg-primary text-on-primary hover:bg-primary-container font-label-caps text-label-caps transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                        >
                          {submittingClient ? 'Salvando...' : 'Salvar Alterações'}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            )}

            {/* MODAL: Nova Unidade / Local */}
            {isAddLocationModalOpen && (
              <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 p-4" onClick={() => setIsAddLocationModalOpen(false)}>
                <div className="bg-white w-[90vw] min-w-[320px] max-w-2xl rounded-xl shadow-2xl flex flex-col max-h-[90vh] animate-scale-up" onClick={(e) => e.stopPropagation()}>
                  <div className="p-6 overflow-y-auto flex flex-col gap-4">
                    <div className="flex justify-between items-center">
                      <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold">
                        Cadastrar Nova Unidade / Local
                      </h3>
                      <button
                        onClick={() => setIsAddLocationModalOpen(false)}
                        className="p-2 text-on-surface-variant hover:bg-surface-container-high rounded-full cursor-pointer transition-colors"
                      >
                        <span className="material-symbols-outlined">close</span>
                      </button>
                    </div>

                    <form onSubmit={handleAddLocationSubmit} className="flex flex-col gap-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1">
                          <label htmlFor="loc-name" className="font-label-caps text-label-caps text-on-surface-variant">
                            Nome da Unidade*
                          </label>
                          <input
                            id="loc-name"
                            type="text"
                            required
                            placeholder="Ex: Unidade Centro, Bloco B"
                            className="w-full px-4 h-12 bg-surface-container-lowest border border-outline/20 rounded-lg font-body-lg text-body-lg text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary shadow-sm"
                            value={locName}
                            onChange={(e) => setLocName(e.target.value)}
                          />
                        </div>

                        <div className="flex flex-col gap-1">
                          <label htmlFor="loc-room" className="font-label-caps text-label-caps text-on-surface-variant">
                            Sala / Consultório (Opcional)
                          </label>
                          <input
                            id="loc-room"
                            type="text"
                            placeholder="Ex: Consultório 1, Esterilização"
                            className="w-full px-4 h-12 bg-surface-container-lowest border border-outline/20 rounded-lg font-body-lg text-body-lg text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary shadow-sm"
                            value={locRoom}
                            onChange={(e) => setLocRoom(e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="flex flex-col gap-1">
                        <label htmlFor="loc-address" className="font-label-caps text-label-caps text-on-surface-variant">
                          Endereço Completo
                        </label>
                        <input
                          id="loc-address"
                          type="text"
                          placeholder="Ex: Av. Paulista, 1000, Cj 52 - Bela Vista, São Paulo - SP"
                          className="w-full px-4 h-12 bg-surface-container-lowest border border-outline/20 rounded-lg font-body-lg text-body-lg text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary shadow-sm"
                          value={locAddress}
                          onChange={(e) => setLocAddress(e.target.value)}
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1">
                          <label htmlFor="loc-contact" className="font-label-caps text-label-caps text-on-surface-variant">
                            Contato da Unidade
                          </label>
                          <input
                            id="loc-contact"
                            type="text"
                            placeholder="Ex: Falar com Mariana (Recepção)"
                            className="w-full px-4 h-12 bg-surface-container-lowest border border-outline/20 rounded-lg font-body-lg text-body-lg text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary shadow-sm"
                            value={locContact}
                            onChange={(e) => setLocContact(e.target.value)}
                          />
                        </div>

                        <div className="flex flex-col gap-1">
                          <label htmlFor="loc-notes" className="font-label-caps text-label-caps text-on-surface-variant">
                            Notas / Observações
                          </label>
                          <input
                            id="loc-notes"
                            type="text"
                            placeholder="Ex: Estacionamento conveniado no local"
                            className="w-full px-4 h-12 bg-surface-container-lowest border border-outline/20 rounded-lg font-body-lg text-body-lg text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary shadow-sm"
                            value={locNotes}
                            onChange={(e) => setLocNotes(e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="flex justify-end gap-3 mt-4">
                        <button
                          type="button"
                          onClick={() => setIsAddLocationModalOpen(false)}
                          className="h-12 px-4 rounded-lg text-on-surface-variant hover:bg-surface-container-high transition-colors font-label-caps text-label-caps cursor-pointer"
                        >
                          Cancelar
                        </button>
                        <button
                          type="submit"
                          disabled={submittingLocation || !locName.trim()}
                          className="h-12 px-6 rounded-lg bg-primary text-on-primary hover:bg-primary-container font-label-caps text-label-caps transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                        >
                          {submittingLocation ? 'Salvando...' : 'Salvar Unidade'}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            )}

            {/* MODAL: Editar Unidade / Local */}
            {isEditLocationModalOpen && editingLocation && (
              <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 p-4" onClick={() => setIsEditLocationModalOpen(false)}>
                <div className="bg-white w-[90vw] min-w-[320px] max-w-2xl rounded-xl shadow-2xl flex flex-col max-h-[90vh] animate-scale-up" onClick={(e) => e.stopPropagation()}>
                  <div className="p-6 overflow-y-auto flex flex-col gap-4">
                    <div className="flex justify-between items-center">
                      <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold">
                        Editar Unidade / Local
                      </h3>
                      <button
                        onClick={() => {
                          setIsEditLocationModalOpen(false);
                          setEditingLocation(null);
                        }}
                        className="p-2 text-on-surface-variant hover:bg-surface-container-high rounded-full cursor-pointer transition-colors"
                      >
                        <span className="material-symbols-outlined">close</span>
                      </button>
                    </div>

                    <form onSubmit={handleEditLocationSubmit} className="flex flex-col gap-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1">
                          <label htmlFor="edit-loc-name" className="font-label-caps text-label-caps text-on-surface-variant">
                            Nome da Unidade*
                          </label>
                          <input
                            id="edit-loc-name"
                            type="text"
                            required
                            placeholder="Ex: Unidade Centro, Bloco B"
                            className="w-full px-4 h-12 bg-surface-container-lowest border border-outline/20 rounded-lg font-body-lg text-body-lg text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary shadow-sm"
                            value={locName}
                            onChange={(e) => setLocName(e.target.value)}
                          />
                        </div>

                        <div className="flex flex-col gap-1">
                          <label htmlFor="edit-loc-room" className="font-label-caps text-label-caps text-on-surface-variant">
                            Sala / Consultório (Opcional)
                          </label>
                          <input
                            id="edit-loc-room"
                            type="text"
                            placeholder="Ex: Consultório 1, Esterilização"
                            className="w-full px-4 h-12 bg-surface-container-lowest border border-outline/20 rounded-lg font-body-lg text-body-lg text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary shadow-sm"
                            value={locRoom}
                            onChange={(e) => setLocRoom(e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="flex flex-col gap-1">
                        <label htmlFor="edit-loc-address" className="font-label-caps text-label-caps text-on-surface-variant">
                          Endereço Completo
                        </label>
                        <input
                          id="edit-loc-address"
                          type="text"
                          placeholder="Ex: Av. Paulista, 1000, Cj 52 - Bela Vista, São Paulo - SP"
                          className="w-full px-4 h-12 bg-surface-container-lowest border border-outline/20 rounded-lg font-body-lg text-body-lg text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary shadow-sm"
                          value={locAddress}
                          onChange={(e) => setLocAddress(e.target.value)}
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1">
                          <label htmlFor="edit-loc-contact" className="font-label-caps text-label-caps text-on-surface-variant">
                            Contato da Unidade
                          </label>
                          <input
                            id="edit-loc-contact"
                            type="text"
                            placeholder="Ex: Falar com Mariana (Recepção)"
                            className="w-full px-4 h-12 bg-surface-container-lowest border border-outline/20 rounded-lg font-body-lg text-body-lg text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary shadow-sm"
                            value={locContact}
                            onChange={(e) => setLocContact(e.target.value)}
                          />
                        </div>

                        <div className="flex flex-col gap-1">
                          <label htmlFor="edit-loc-notes" className="font-label-caps text-label-caps text-on-surface-variant">
                            Notas / Observações
                          </label>
                          <input
                            id="edit-loc-notes"
                            type="text"
                            placeholder="Ex: Estacionamento conveniado no local"
                            className="w-full px-4 h-12 bg-surface-container-lowest border border-outline/20 rounded-lg font-body-lg text-body-lg text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary shadow-sm"
                            value={locNotes}
                            onChange={(e) => setLocNotes(e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="flex justify-end gap-3 mt-4">
                        <button
                          type="button"
                          onClick={() => {
                            setIsEditLocationModalOpen(false);
                            setEditingLocation(null);
                          }}
                          className="h-12 px-4 rounded-lg text-on-surface-variant hover:bg-surface-container-high transition-colors font-label-caps text-label-caps cursor-pointer"
                        >
                          Cancelar
                        </button>
                        <button
                          type="submit"
                          disabled={submittingLocation || !locName.trim()}
                          className="h-12 px-6 rounded-lg bg-primary text-on-primary hover:bg-primary-container font-label-caps text-label-caps transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                        >
                          {submittingLocation ? 'Salvando...' : 'Salvar Alterações'}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </Navigation>
  );
}
