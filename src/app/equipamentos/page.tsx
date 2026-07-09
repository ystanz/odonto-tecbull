'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Navigation from '@/components/Navigation';
// no actions imported
import { DBEquipment, DBClient, DBLocation } from '@/lib/types';
import { compressImage } from '@/lib/imageCompression';

interface FormattedEquipment {
  id: string;
  name: string;
  locationPath: string;
  serialNumber: string;
  manufacturer: string;
  installationDate: string;
  status: string;
  nextServiceDate: string;
  imageData?: string | null;
  hasOpenOS?: boolean;
}

export default function EquipamentosPage() {
  const [equipments, setEquipments] = useState<FormattedEquipment[]>([]);
  const [clients, setClients] = useState<DBClient[]>([]);
  const [locations, setLocations] = useState<DBLocation[]>([]);
  const [searchQuery, setSearchQuery] = useState(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      return params.get('q') || '';
    }
    return '';
  });

  const [loading, setLoading] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form Fields State
  const [name, setName] = useState('');
  const [selectedClientId, setSelectedClientId] = useState('');
  const [selectedLocationId, setSelectedLocationId] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [manufacturer, setManufacturer] = useState('');
  const [installationDate, setInstallationDate] = useState('');
  const [nextServiceDate, setNextServiceDate] = useState('');
  const [status, setStatus] = useState('Ativo');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageData, setImageData] = useState<string | null>(null);
  const [compressing, setCompressing] = useState(false);

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        setCompressing(true);
        const base64Compressed = await compressImage(file);
        setImageData(base64Compressed);
        setImagePreview(base64Compressed);
      } catch (err) {
        console.error(err);
        showToast('Erro ao processar imagem.', 'error');
      } finally {
        setCompressing(false);
      }
    }
  };

  const removeImage = () => {
    setImageData(null);
    setImagePreview(null);
  };

  // Form Loading & Feedback
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' } | null>(null);

  const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  }, []);

  useEffect(() => {
    let active = true;
    async function loadData() {
      try {
        setLoading(true);
        let rawEquipments: DBEquipment[] = [];
        let rawClients: DBClient[] = [];
        let rawLocations: DBLocation[] = [];


        // Fetch from REST APIs
        const resEquipsRaw = await fetch('/api/equipamentos');
        const resEquips = await resEquipsRaw.json();
        if (resEquips.success) {
          rawEquipments = resEquips.data || [];
          const resRaw = await fetch('/api/clientes');
          const resClients = await resRaw.json();
          rawClients = resClients.success ? resClients.data || [] : [];
          const resLocsRaw = await fetch('/api/locations');
          const resLocs = await resLocsRaw.json();
          rawLocations = resLocs.success ? resLocs.data || [] : [];
        } else {
          showToast('Erro ao carregar dados do banco de dados.', 'error');
        }

        if (!active) return;
        setClients(rawClients);
        setLocations(rawLocations);

        // Format equipments to include Location Path (Client Name > Location Name)
        const formatted: FormattedEquipment[] = rawEquipments.map((eq) => {
          let locationPath = 'Unidade Geral';

          // Find location info in raw list or from Supabase join
          const loc = rawLocations.find((l) => l.id === eq.location_id) || eq.locations;
          if (loc) {
            const client = rawClients.find((c) => c.id === loc.client_id) || loc.clients;
            locationPath = client ? `${client.name} • ${loc.name}` : loc.name;
          }

          return {
            id: eq.id,
            name: eq.name,
            locationPath,
            serialNumber: eq.serial_number || 'N/A',
            manufacturer: eq.manufacturer || 'N/A',
            installationDate: eq.installation_date || 'N/A',
            status: eq.status || 'Ativo',
            nextServiceDate: eq.next_service_date || 'N/A',
            imageData: eq.image_data,
            hasOpenOS: eq.hasOpenOS,
          };
        });

        setEquipments(formatted);
      } catch (err) {
        console.error('Erro ao carregar equipamentos:', err);
        if (active) {
          showToast('Erro ao carregar dados. Usando dados locais.', 'error');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadData();

    return () => {
      active = false;
    };
  }, [refreshTrigger, showToast]);

  // Filter locations by client selection
  const filteredLocations = locations.filter((loc) => loc.client_id === selectedClientId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast('Preencha os campos obrigatórios.', 'error');
      return;
    }

    try {
      setSubmitting(true);


      const resRaw = await fetch('/api/equipamentos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          locationId: selectedLocationId || null,
          serialNumber: serialNumber || null,
          manufacturer: manufacturer || null,
          installationDate: installationDate || null,
          nextServiceDate: nextServiceDate || null,
          status,
          imageData: imageData || null,
        })
      });
      const res = await resRaw.json();
      if (res.success) {
        showToast('Equipamento cadastrado com sucesso!');
      } else {
        throw new Error(res.error);
      }

      // Reset Form fields
      setName('');
      setSelectedClientId('');
      setSelectedLocationId('');
      setSerialNumber('');
      setManufacturer('');
      setInstallationDate('');
      setNextServiceDate('');
      setStatus('Ativo');
      setImageData(null);
      setImagePreview(null);

      setIsModalOpen(false);
      setRefreshTrigger((prev) => prev + 1);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro desconhecido';
      showToast(`Erro ao cadastrar equipamento: ${msg}`, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredEquipments = equipments.filter((eq) => {
    return (
      eq.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      eq.locationPath.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  return (
    <Navigation currentTab="equipment">
      <main className="flex-1 overflow-y-auto px-md py-lg pb-32 max-w-4xl mx-auto w-full">
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

        {/* Header Section */}
        <div className="mb-lg flex flex-col sm:flex-row sm:items-center sm:justify-between gap-md">
          <div>
            <h2 className="font-headline-lg text-headline-lg text-on-background mb-xs">
              Equipamentos
            </h2>
            <p className="text-on-surface-variant font-body-md text-body-md">
              Gerencie a lista completa de ativos sob contrato de manutenção.
            </p>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="h-touch-target px-md bg-primary text-on-primary font-label-caps text-label-caps rounded-xl hover:bg-primary-container hover:text-on-primary-container transition-colors flex items-center justify-center gap-xs shadow-sm cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            + Equipamento
          </button>
        </div>

        {/* Search Bar */}
        <div className="mb-lg relative">
          <span className="material-symbols-outlined absolute left-sm top-1/2 transform -translate-y-1/2 text-outline">
            search
          </span>
          <input
            className="w-full pl-xl pr-md py-sm h-touch-target bg-surface-container-lowest border border-outline/20 rounded-lg font-body-md text-body-md text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary shadow-sm"
            placeholder="Pesquisar por nome, código ou clínica..."
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Loading Spinner */}
        {loading && (
          <div className="text-center py-8 text-on-surface-variant font-body-md flex flex-col items-center justify-center gap-sm bg-surface-container-lowest rounded-xl border border-outline/10 shadow-sm">
            <span className="material-symbols-outlined animate-spin text-primary text-3xl">sync</span>
            <span>Carregando equipamentos...</span>
          </div>
        )}

        {/* Equipment Bento List */}
        {!loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-md animate-fade-in">
            {filteredEquipments.map((eq) => {
              // Determine status styles
              let badgeClass = 'bg-emerald-100 text-emerald-800';
              let statusText = 'OK';

              if (eq.hasOpenOS) {
                badgeClass = 'bg-amber-100 text-amber-800';
                statusText = 'Ordem aberta';
              }

              return (
                <a key={eq.id} href={`/equipamentos/detalhes?id=${eq.id}`} className="group">
                  <article className="bg-surface-container-lowest rounded-xl shadow-sm border border-outline/10 p-md flex flex-col justify-between h-full hover:shadow-md hover:border-primary/20 transition-all cursor-pointer relative overflow-hidden group active:scale-[0.99]">
                    <div className="absolute inset-y-0 left-0 w-1 bg-outline/20 group-hover:bg-primary transition-colors"></div>

                    {/* Top row status */}
                    <div className="flex justify-end items-center pl-xs mb-sm">
                      <span className={`inline-flex items-center px-sm py-base rounded-full text-xs font-semibold ${badgeClass}`}>
                        {statusText}
                      </span>
                    </div>

                    {/* Mid row details */}
                    <div className="pl-xs flex-1 mb-md flex gap-md items-start">
                      {eq.imageData && (
                        <div className="w-16 h-16 bg-surface-container-high rounded-lg overflow-hidden border border-outline/10 flex-shrink-0 relative">
                           {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={eq.imageData} alt={eq.name} className="w-full h-full object-cover" />
                        </div>
                      )}
                      <div className="flex-1">
                        <h3 className="font-headline-sm text-headline-sm text-on-surface group-hover:text-primary transition-colors font-bold mb-xs">
                          {eq.name}
                        </h3>
                        <p className="font-body-md text-body-md text-on-surface-variant flex items-center gap-xs">
                          <span className="material-symbols-outlined text-[16px] text-outline">location_on</span>
                          {eq.locationPath}
                        </p>

                        {eq.serialNumber && eq.serialNumber !== 'N/A' && (
                          <p className="font-technical-code text-technical-code text-outline mt-base flex items-center gap-xs">
                            <span className="material-symbols-outlined text-[14px]">barcode_scanner</span>
                            S/N: {eq.serialNumber}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Bottom row actions */}
                    <div className="pl-xs pt-sm border-t border-outline/10 flex justify-between items-center">
                      <div className="text-[12px] text-on-surface-variant font-technical-code flex items-center gap-xs">
                        <span className="material-symbols-outlined text-[14px] text-outline">calendar_today</span>
                        <span>Preventiva: {eq.nextServiceDate}</span>
                      </div>

                      <div className="h-8 w-8 rounded-full bg-surface-container-high flex items-center justify-center text-on-surface group-hover:bg-primary group-hover:text-on-primary transition-colors">
                        <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                      </div>
                    </div>
                  </article>
                </a>
              );
            })}

            {filteredEquipments.length === 0 && (
              <div className="text-center py-8 text-on-surface-variant font-body-md bg-surface-container-lowest rounded-xl border border-outline/10 shadow-sm col-span-1 md:col-span-2">
                Nenhum equipamento encontrado com base na pesquisa.
              </div>
            )}
          </div>
        )}

        {/* Modal Form: Cadastrar Novo Equipamento */}
        {isModalOpen && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 p-4" onClick={() => setIsModalOpen(false)}>
            <div className="bg-white w-[90vw] min-w-[320px] max-w-2xl rounded-xl shadow-2xl flex flex-col max-h-[90vh] animate-scale-up" onClick={(e) => e.stopPropagation()}>
              <div className="p-6 overflow-y-auto flex flex-col gap-4">

                <div className="flex justify-between items-center">
                  <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold">
                    Cadastrar Novo Equipamento
                  </h3>
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="p-2 text-on-surface-variant hover:bg-surface-container-high rounded-full cursor-pointer transition-colors"
                  >
                    <span className="material-symbols-outlined">close</span>
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col gap-4">

                  <div className="grid grid-cols-1 gap-4">
                    {/* Name */}
                    <div className="flex flex-col gap-1">
                      <label htmlFor="eq-name" className="font-label-caps text-label-caps text-on-surface-variant">
                        Nome do Equipamento*
                      </label>
                      <input
                        id="eq-name"
                        type="text"
                        required
                        placeholder="Ex: Cadeira Gnatus G3"
                        className="w-full px-4 h-12 bg-surface-container-lowest border border-outline/20 rounded-lg font-body-lg text-body-lg text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary shadow-sm"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Client Dropdown */}
                    <div className="flex flex-col gap-1">
                      <label htmlFor="eq-client" className="font-label-caps text-label-caps text-on-surface-variant">
                        Clínica Cliente*
                      </label>
                      <div className="relative w-full">
                        <select
                          id="eq-client"
                          required
                          className="w-full h-12 px-4 bg-surface-container-lowest border border-outline/20 rounded-lg font-body-lg text-body-lg text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary appearance-none cursor-pointer"
                          value={selectedClientId}
                          onChange={(e) => {
                            setSelectedClientId(e.target.value);
                            setSelectedLocationId('');
                          }}
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

                    {/* Location Dropdown */}
                    <div className="flex flex-col gap-1">
                      <label htmlFor="eq-location" className="font-label-caps text-label-caps text-on-surface-variant">
                        Unidade / Local
                      </label>
                      <div className="relative w-full">
                        <select
                          id="eq-location"
                          disabled={!selectedClientId}
                          className="w-full h-12 px-4 bg-surface-container-lowest border border-outline/20 rounded-lg font-body-lg text-body-lg text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary appearance-none disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                          value={selectedLocationId}
                          onChange={(e) => setSelectedLocationId(e.target.value)}
                        >
                          <option value="">Selecione o local...</option>
                          {filteredLocations.map((l) => (
                            <option key={l.id} value={l.id}>
                              {l.name} {l.room ? `(${l.room})` : ''}
                            </option>
                          ))}
                        </select>
                        <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none">
                          arrow_drop_down
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Serial Number */}
                    <div className="flex flex-col gap-1">
                      <label htmlFor="eq-serial" className="font-label-caps text-label-caps text-on-surface-variant">
                        Número de Série
                      </label>
                      <input
                        id="eq-serial"
                        type="text"
                        placeholder="Ex: GN-2023-8942A"
                        className="w-full px-4 h-12 bg-surface-container-lowest border border-outline/20 rounded-lg font-body-lg text-body-lg text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary shadow-sm"
                        value={serialNumber}
                        onChange={(e) => setSerialNumber(e.target.value)}
                      />
                    </div>

                    {/* Manufacturer */}
                    <div className="flex flex-col gap-1">
                      <label htmlFor="eq-manufacturer" className="font-label-caps text-label-caps text-on-surface-variant">
                        Fabricante
                      </label>
                      <input
                        id="eq-manufacturer"
                        type="text"
                        placeholder="Ex: Gnatus, Schulz"
                        className="w-full px-4 h-12 bg-surface-container-lowest border border-outline/20 rounded-lg font-body-lg text-body-lg text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary shadow-sm"
                        value={manufacturer}
                        onChange={(e) => setManufacturer(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Installation Date */}
                    <div className="flex flex-col gap-1">
                      <label htmlFor="eq-install" className="font-label-caps text-label-caps text-on-surface-variant">
                        Data de Instalação
                      </label>
                      <input
                        id="eq-install"
                        type="date"
                        className="w-full px-4 h-12 bg-surface-container-lowest border border-outline/20 rounded-lg font-body-lg text-body-lg text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary shadow-sm"
                        value={installationDate}
                        onChange={(e) => setInstallationDate(e.target.value)}
                      />
                    </div>

                    {/* Next Service Date */}
                    <div className="flex flex-col gap-1">
                      <label htmlFor="eq-service" className="font-label-caps text-label-caps text-on-surface-variant">
                        Próxima Preventiva
                      </label>
                      <input
                        id="eq-service"
                        type="date"
                        className="w-full px-4 h-12 bg-surface-container-lowest border border-outline/20 rounded-lg font-body-lg text-body-lg text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary shadow-sm"
                        value={nextServiceDate}
                        onChange={(e) => setNextServiceDate(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Status Selection */}
                  <div className="flex flex-col gap-1">
                    <label className="font-label-caps text-label-caps text-on-surface-variant">
                      Status do Ativo
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {['Ativo', 'Pendente', 'Inativo'].map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setStatus(s)}
                          className={`h-12 rounded-lg font-label-caps text-label-caps border transition-all flex items-center justify-center cursor-pointer ${status === s
                            ? s === 'Ativo'
                              ? 'bg-tertiary/15 text-tertiary border-tertiary font-bold shadow-sm'
                              : s === 'Pendente'
                                ? 'bg-secondary/15 text-secondary border-secondary font-bold shadow-sm'
                                : 'bg-error/15 text-error border-error font-bold shadow-sm'
                            : 'bg-surface-container-lowest text-on-surface-variant border-outline/20 hover:bg-surface-container-low'
                            }`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Image Upload Field */}
                  <div className="flex flex-col gap-1">
                    <span className="font-label-caps text-label-caps text-on-surface-variant">
                      Foto do Equipamento (Opcional)
                    </span>
                    {!imagePreview ? (
                      <label className="border-2 border-dashed border-outline-variant/30 hover:border-primary/50 transition-colors rounded-xl p-md flex flex-col items-center justify-center gap-sm cursor-pointer bg-surface-container-lowest">
                        <input
                          type="file"
                          accept="image/*"
                          capture="environment"
                          className="hidden"
                          onChange={handleImageChange}
                          disabled={compressing}
                        />
                        <span className="material-symbols-outlined text-3xl text-outline-variant">
                          add_a_photo
                        </span>
                        <span className="font-body-md text-body-md font-semibold text-primary">
                          {compressing ? 'Compactando...' : 'Adicionar Foto'}
                        </span>
                      </label>
                    ) : (
                      <div className="relative rounded-xl overflow-hidden border border-outline/20 bg-surface-container-low p-xs flex items-center justify-center">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={imagePreview}
                          alt="Preview do Equipamento"
                          className="max-h-40 object-contain rounded-lg shadow-sm"
                        />
                        <button
                          type="button"
                          onClick={removeImage}
                          className="absolute top-xs right-xs w-8 h-8 bg-black/60 hover:bg-black/80 text-white rounded-full flex items-center justify-center active:scale-95 transition-all shadow-md cursor-pointer"
                          aria-label="Remover Imagem"
                        >
                          <span className="material-symbols-outlined text-[18px]">delete</span>
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end gap-3 mt-4">
                    <button
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      className="h-12 px-4 rounded-lg text-on-surface-variant hover:bg-surface-container-high transition-colors font-label-caps text-label-caps cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="h-12 px-6 rounded-lg bg-primary text-on-primary hover:bg-primary-container font-label-caps text-label-caps transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    >
                      {submitting ? 'Salvando...' : 'Cadastrar'}
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
