'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Navigation from '@/components/Navigation';
import Link from 'next/link';
// no actions imported
import { DBLocation, DBEquipment, DBClient } from '@/lib/types';
// Supabase uninstalled - database migrated to Cloudflare D1 with Drizzle ORM

export default function NovaOSPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Data lists
  const [locations, setLocations] = useState<DBLocation[]>([]);
  const [equipments, setEquipments] = useState<DBEquipment[]>([]);
  const [clients, setClients] = useState<DBClient[]>([]);

  // Form Fields
  const [selectedLocationId, setSelectedLocationId] = useState('');
  const [selectedEquipmentId, setSelectedEquipmentId] = useState('');
  const [defectReported, setDefectReported] = useState('');
  const [partsUsed, setPartsUsed] = useState('');
  const [workNotes, setWorkNotes] = useState('');
  const [priority, setPriority] = useState<'NORMAL' | 'CRÍTICO'>('NORMAL');

  // Image Upload State
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Notification State
  const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' } | null>(null);

  const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  }, []);

  // Fetch initial select lists
  useEffect(() => {
    let active = true;
    async function loadData() {
      try {
        let rawLocations: DBLocation[] = [];
        let rawEquipments: DBEquipment[] = [];
        let rawClients: DBClient[] = [];
        setLoading(true);
        // Fetch from REST APIs
        const resLocsRaw = await fetch('/api/locations');
        const resLocs = await resLocsRaw.json();
        if (resLocs.success) {
          rawLocations = resLocs.data || [];
          const resEquipsRaw = await fetch('/api/equipamentos');
          const resEquips = await resEquipsRaw.json();
          rawEquipments = resEquips.success ? resEquips.data || [] : [];
          const resRaw = await fetch('/api/clientes');
          const resClients = await resRaw.json();
          rawClients = resClients.success ? resClients.data || [] : [];
        } else {
          showToast('Erro ao carregar dados do banco de dados.', 'error');
        }

        if (!active) return;
        setLocations(rawLocations);
        setEquipments(rawEquipments);
        setClients(rawClients);

        // Read eqId query parameter to pre-fill location and equipment selection
        if (typeof window !== 'undefined') {
          const params = new URLSearchParams(window.location.search);
          const eqId = params.get('eqId');
          if (eqId) {
            const foundEquip = rawEquipments.find((e) => e.id === eqId);
            if (foundEquip) {
              setSelectedLocationId(foundEquip.location_id || '');
              setSelectedEquipmentId(eqId);
            }
          }
        }
      } catch (err) {
        console.error('Erro ao buscar listas do D1:', err);
        if (active) {
          showToast('Erro ao carregar locais. Usando dados locais.', 'error');
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
  }, [showToast]);

  // Dynamic Equipments list filtered by location
  const filteredEquipments = equipments.filter((eq) => (eq.location_id || '') === selectedLocationId);

  // Selected location details helper
  const getLocationLabel = (loc: DBLocation) => {
    const client = clients.find((c) => c.id === loc.client_id) || loc.clients;
    const clientPart = client ? client.name : 'Clínica Geral';
    const roomPart = loc.room ? ` - ${loc.room}` : '';
    return `${clientPart} > ${loc.name}${roomPart}`;
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
  };

  const handleUploadImage = async (file: File): Promise<string | null> => {
    try {
      setUploadProgress(20);
      await new Promise((resolve) => setTimeout(resolve, 150));
      setUploadProgress(60);
      await new Promise((resolve) => setTimeout(resolve, 150));
      setUploadProgress(100);
      // Generate a local blob URL valid for the browser session
      return URL.createObjectURL(file);
    } catch (err) {
      console.error('Erro no upload de imagem:', err);
      return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLocationId || !selectedEquipmentId || !defectReported.trim()) {
      showToast('Por favor, preencha todos os campos obrigatórios.', 'error');
      return;
    }

    try {
      setSubmitting(true);

      // 1. Upload image if selected
      let uploadedUrl: string | null = null;
      if (selectedImage) {
        uploadedUrl = await handleUploadImage(selectedImage);
      }

      // 2. Fetch Client ID from the selected location
      const selectedLoc = locations.find((l) => l.id === selectedLocationId);
      const clientId = selectedLoc ? selectedLoc.client_id : '';

      // 3. Generate OS Code
      const code = `#OS-${Math.floor(1000 + Math.random() * 9000)}`;


      // 5. Insert Record via REST API
      const resRaw = await fetch('/api/ordens-servico', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code,
          clientId,
          equipmentId: selectedEquipmentId,
          status: 'ABERTA',
          priority,
          defectReported,
          partsUsed: partsUsed.trim() ? partsUsed.trim() : null,
          workNotes: workNotes.trim() ? workNotes.trim() : null,
          imageUrl: uploadedUrl,
          serviceDate: new Date().toISOString().split('T')[0],
          technicianName: 'Marcelo T.',
        })
      });
      const res = await resRaw.json();
      if (res.success) {
        showToast('Ordem de Serviço aberta com sucesso!');
      } else {
        throw new Error(res.error);
      }

      // Redirect to equipment detail page
      setTimeout(() => {
        router.push(`/equipamentos/${selectedEquipmentId}`);
      }, 1500);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro de conexão com o banco.';
      showToast(`Erro ao abrir OS: ${msg}`, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const isFormValid = selectedLocationId !== '' && selectedEquipmentId !== '' && defectReported.trim() !== '';

  return (
    <Navigation currentTab="service">
      <main className="flex-1 overflow-y-auto px-md py-lg pb-32 max-w-2xl mx-auto w-full">
        {/* Toast Notification */}
        {toast && (
          <div
            className={`fixed top-4 right-4 z-[100] px-md py-sm rounded-lg shadow-lg text-white font-body-md animate-fade-in flex items-center gap-xs ${
              toast.type === 'error' ? 'bg-error' : 'bg-tertiary'
            }`}
          >
            <span className="material-symbols-outlined animate-bounce">
              {toast.type === 'error' ? 'error' : 'check_circle'}
            </span>
            <span>{toast.message}</span>
          </div>
        )}

        {/* Header */}

        {/* Header */}
        <div className="mb-lg">
          <div className="flex items-center space-x-2 text-on-surface-variant font-body-md mb-xs">
            <Link prefetch={false} href="/ordens-servico" className="hover:text-primary flex items-center">
              <span className="material-symbols-outlined text-md mr-1">arrow_back</span>
              Voltar para Ordens de Serviço
            </Link>
          </div>
          <h2 className="font-headline-lg text-headline-lg text-on-background mb-xs">
            Abrir Nova OS
          </h2>
          <p className="text-on-surface-variant font-body-md text-body-md">
            Registre um novo atendimento preenchendo os dados do equipamento e defeito relatado.
          </p>
        </div>

        {/* Loading Form placeholder */}
        {loading ? (
          <div className="text-center py-8 text-on-surface-variant font-body-md flex flex-col items-center justify-center gap-sm bg-surface-container-lowest rounded-xl border border-outline/10 shadow-sm">
            <span className="material-symbols-outlined animate-spin text-primary text-3xl">sync</span>
            <span>Carregando dados da clínica e equipamentos...</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-surface-container-lowest rounded-2xl p-md border border-outline/10 shadow-sm flex flex-col gap-md">
            
            {/* 1. Location selection */}
            <div className="flex flex-col gap-xs">
              <label htmlFor="os-location" className="font-label-caps text-label-caps text-on-surface-variant">
                Localização / Unidade (Clínica)*
              </label>
              <div className="relative">
                <select
                  id="os-location"
                  required
                  className="w-full h-touch-target px-md bg-surface-container-lowest border border-outline/20 rounded-lg font-body-lg text-body-lg text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary appearance-none cursor-pointer"
                  value={selectedLocationId}
                  onChange={(e) => {
                    setSelectedLocationId(e.target.value);
                    setSelectedEquipmentId(''); // reset equipment selection
                  }}
                >
                  <option value="">Selecione o local de atendimento...</option>
                  {locations.map((loc) => (
                    <option key={loc.id} value={loc.id}>
                      {getLocationLabel(loc)}
                    </option>
                  ))}
                </select>
                <span className="material-symbols-outlined absolute right-md top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none">
                  arrow_drop_down
                </span>
              </div>
            </div>

            {/* 2. Cascading Equipment selection */}
            <div className="flex flex-col gap-xs">
              <label htmlFor="os-equipment" className="font-label-caps text-label-caps text-on-surface-variant">
                Equipamento*
              </label>
              <div className="relative">
                <select
                  id="os-equipment"
                  required
                  disabled={!selectedLocationId}
                  className="w-full h-touch-target px-md bg-surface-container-lowest border border-outline/20 rounded-lg font-body-lg text-body-lg text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary appearance-none disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  value={selectedEquipmentId}
                  onChange={(e) => setSelectedEquipmentId(e.target.value)}
                >
                  <option value="">
                    {!selectedLocationId ? 'Selecione a localização primeiro...' : 'Escolha o equipamento...'}
                  </option>
                  {filteredEquipments.map((eq) => (
                    <option key={eq.id} value={eq.id}>
                      {eq.name}
                    </option>
                  ))}
                  {selectedLocationId && filteredEquipments.length === 0 && (
                    <option value="" disabled>Nenhum equipamento neste local</option>
                  )}
                </select>
                <span className="material-symbols-outlined absolute right-md top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none">
                  arrow_drop_down
                </span>
              </div>
            </div>

            {/* 3. Defect Reported Textarea */}
            <div className="flex flex-col gap-xs">
              <label htmlFor="os-defect" className="font-label-caps text-label-caps text-on-surface-variant">
                Problema Relatado / Defeito*
              </label>
              <textarea
                id="os-defect"
                required
                rows={4}
                placeholder="Descreva em detalhes o defeito apresentado pelo equipamento ou o serviço solicitado..."
                className="w-full px-md py-sm bg-surface-container-lowest border border-outline/20 rounded-lg font-body-lg text-body-lg text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary shadow-sm"
                value={defectReported}
                onChange={(e) => setDefectReported(e.target.value)}
              />
            </div>

            {/* 4. Parts Used Input */}
            <div className="flex flex-col gap-xs">
              <label htmlFor="os-parts" className="font-label-caps text-label-caps text-on-surface-variant">
                Peças Utilizadas (Opcional)
              </label>
              <input
                id="os-parts"
                type="text"
                placeholder="Ex: Mangueira de sucção, Filtro coalescente"
                className="w-full px-md h-touch-target bg-surface-container-lowest border border-outline/20 rounded-lg font-body-lg text-body-lg text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary shadow-sm"
                value={partsUsed}
                onChange={(e) => setPartsUsed(e.target.value)}
              />
            </div>

            {/* 5. Work Notes Textarea */}
            <div className="flex flex-col gap-xs">
              <label htmlFor="os-notes" className="font-label-caps text-label-caps text-on-surface-variant">
                Observações do Atendimento (Opcional)
              </label>
              <textarea
                id="os-notes"
                rows={3}
                placeholder="Insira notas técnicas de observações relevantes do atendimento ou diagnósticos..."
                className="w-full px-md py-sm bg-surface-container-lowest border border-outline/20 rounded-lg font-body-lg text-body-lg text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary shadow-sm"
                value={workNotes}
                onChange={(e) => setWorkNotes(e.target.value)}
              />
            </div>

            {/* Priority Selection */}
            <div className="flex flex-col gap-xs">
              <label className="font-label-caps text-label-caps text-on-surface-variant">
                Prioridade do Chamado
              </label>
              <div className="flex gap-md">
                <button
                  type="button"
                  onClick={() => setPriority('NORMAL')}
                  className={`flex-1 h-touch-target rounded-lg font-label-caps text-label-caps border transition-all flex items-center justify-center gap-xs cursor-pointer ${
                    priority === 'NORMAL'
                      ? 'bg-primary-container text-on-primary-container border-primary font-bold shadow-sm'
                      : 'bg-surface-container-lowest text-on-surface-variant border-outline/20 hover:bg-surface-container-low'
                  }`}
                >
                  Normal
                </button>
                <button
                  type="button"
                  onClick={() => setPriority('CRÍTICO')}
                  className={`flex-1 h-touch-target rounded-lg font-label-caps text-label-caps border transition-all flex items-center justify-center gap-xs cursor-pointer ${
                    priority === 'CRÍTICO'
                      ? 'bg-error-container text-on-error-container border-error font-bold shadow-sm'
                      : 'bg-surface-container-lowest text-on-surface-variant border-outline/20 hover:bg-error-container/10'
                  }`}
                >
                  <span className="material-symbols-outlined text-sm">warning</span>
                  Crítico
                </button>
              </div>
            </div>

            {/* 6. Image Upload UI Component */}
            <div className="flex flex-col gap-xs">
              <span className="font-label-caps text-label-caps text-on-surface-variant">
                Anexo de Imagem (Opcional)
              </span>
              
              {!imagePreview ? (
                <label className="border-2 border-dashed border-outline-variant/30 hover:border-primary/50 transition-colors rounded-xl p-lg flex flex-col items-center justify-center gap-sm cursor-pointer select-none bg-surface-container-lowest">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageChange}
                  />
                  <span className="material-symbols-outlined text-4xl text-outline-variant">
                    add_a_photo
                  </span>
                  <div className="text-center">
                    <p className="font-body-md text-body-md font-semibold text-primary">
                      Toque para tirar foto ou selecionar
                    </p>
                    <p className="font-technical-code text-[11px] text-outline mt-1">
                      PNG, JPG ou WEBP de até 5MB
                    </p>
                  </div>
                </label>
              ) : (
                <div className="relative rounded-xl overflow-hidden border border-outline/20 bg-surface-container-low p-xs flex items-center justify-center">
                  {/* Image render */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={imagePreview}
                    alt="Preview do Anexo da OS"
                    className="max-h-64 object-contain rounded-lg shadow-sm"
                  />
                  
                  {/* Close floating button */}
                  <button
                    type="button"
                    onClick={removeImage}
                    className="absolute top-sm right-sm w-touch-target h-touch-target bg-black/60 hover:bg-black/80 text-white rounded-full flex items-center justify-center active:scale-95 transition-all shadow-md cursor-pointer"
                    aria-label="Remover Imagem"
                  >
                    <span className="material-symbols-outlined">delete</span>
                  </button>
                </div>
              )}

              {submitting && selectedImage && uploadProgress > 0 && (
                <div className="w-full mt-xs">
                  <div className="flex justify-between text-technical-code text-outline mb-1">
                    <span>Enviando anexo...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-surface-variant h-1.5 rounded-full overflow-hidden">
                    <div className="bg-primary h-full transition-all duration-300" style={{ width: `${uploadProgress}%` }}></div>
                  </div>
                </div>
              )}
            </div>

            {/* Form actions buttons */}
            <div className="flex gap-md mt-md border-t border-outline/10 pt-md">
              <button
                type="button"
                onClick={() => router.push('/ordens-servico')}
                className="h-touch-target px-md rounded-lg text-on-surface-variant hover:bg-surface-container-high transition-colors font-label-caps text-label-caps cursor-pointer flex-1 flex items-center justify-center"
              >
                Cancelar
              </button>
              
              <button
                type="submit"
                disabled={!isFormValid || submitting}
                className="h-touch-target px-lg rounded-lg bg-primary text-on-primary hover:bg-primary-container font-label-caps text-label-caps transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex-2 flex items-center justify-center gap-xs font-semibold"
              >
                {submitting ? (
                  <>
                    <span className="material-symbols-outlined animate-spin text-[18px]">sync</span>
                    <span>Abrindo OS...</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[18px]">send</span>
                    <span>Salvar e Abrir OS</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </main>
    </Navigation>
  );
}
