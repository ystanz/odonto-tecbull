'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
// no actions imported
import { DBClient, DBLocation } from '@/lib/types';
import { compressImage } from '@/lib/imageCompression';

interface EditEquipmentButtonProps {
  equipment: {
    id: string;
    name: string;
    locationId: string;
    clientId: string;
    serialNumber: string | null;
    installationDate: string | null;
    manufacturer: string | null;
    status: string;
    nextServiceDate: string | null;
    imageData?: string | null;
  };
  clients: DBClient[];
  locations: DBLocation[];
}

export default function EditEquipmentButton({
  equipment,
  clients,
  locations,
}: EditEquipmentButtonProps) {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form Fields State
  const [name, setName] = useState(equipment.name);
  const [selectedClientId, setSelectedClientId] = useState(equipment.clientId || '');
  const [selectedLocationId, setSelectedLocationId] = useState(equipment.locationId || '');
  const [serialNumber, setSerialNumber] = useState(equipment.serialNumber || '');
  const [manufacturer, setManufacturer] = useState(equipment.manufacturer || '');
  const [installationDate, setInstallationDate] = useState(equipment.installationDate || '');
  const [nextServiceDate, setNextServiceDate] = useState(equipment.nextServiceDate || '');
  const [status, setStatus] = useState(equipment.status || 'Ativo');
  const [imagePreview, setImagePreview] = useState<string | null>(equipment.imageData || null);
  const [imageData, setImageData] = useState<string | null>(equipment.imageData || null);
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

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  // Filter locations by client selection
  const filteredLocations = locations.filter((loc) => loc.client_id === selectedClientId);

  // Sync state if equipment prop changes
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setName(equipment.name);
    setSelectedClientId(equipment.clientId || '');
    setSelectedLocationId(equipment.locationId || '');
    setSerialNumber(equipment.serialNumber || '');
    setManufacturer(equipment.manufacturer || '');
    setInstallationDate(equipment.installationDate || '');
    setNextServiceDate(equipment.nextServiceDate || '');
    setStatus(equipment.status || 'Ativo');
    setImageData(equipment.imageData || null);
    setImagePreview(equipment.imageData || null);
  }, [equipment]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast('Preencha os campos obrigatórios.', 'error');
      return;
    }

    try {
      setSubmitting(true);


      const resRaw = await fetch(`/api/equipamentos/${equipment.id}`, {
        method: 'PUT',
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
        showToast('Equipamento atualizado com sucesso!');
      } else {
        throw new Error(res.error);
      }

      setIsModalOpen(false);
      
      // Refresh RSC Server side to update page data
      router.refresh();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro desconhecido';
      showToast(`Erro ao editar equipamento: ${msg}`, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Tem certeza de que deseja excluir este equipamento? Esta ação não pode ser desfeita.')) {
      return;
    }

    try {
      setSubmitting(true);
      const resRaw = await fetch(`/api/equipamentos/${equipment.id}`, {
        method: 'DELETE',
      });
      const res = await resRaw.json();
      if (res.success) {
        setIsModalOpen(false);
        router.push('/equipamentos');
        router.refresh();
      } else {
        throw new Error(res.error || 'Erro ao excluir o equipamento');
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro desconhecido';
      showToast(`Erro ao deletar equipamento: ${msg}`, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      {/* Toast Alert */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-[9999] px-4 py-2 rounded-lg shadow-lg text-white font-body-md animate-fade-in flex items-center gap-2 ${
            toast.type === 'error' ? 'bg-error' : 'bg-tertiary'
          }`}
        >
          <span className="material-symbols-outlined">
            {toast.type === 'error' ? 'error' : 'check_circle'}
          </span>
          <span>{toast.message}</span>
        </div>
      )}

      {/* Edit Button */}
      <button
        onClick={() => setIsModalOpen(true)}
        className="h-10 px-4 border border-primary text-primary hover:bg-primary/5 font-label-caps text-label-caps rounded-xl transition-colors flex items-center justify-center gap-1 cursor-pointer font-semibold shadow-sm"
      >
        <span className="material-symbols-outlined text-[18px]">edit</span>
        <span>Editar Equipamento</span>
      </button>

      {/* Modal Form: Editar Equipamento */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 p-4" onClick={() => setIsModalOpen(false)}>
          <div className="bg-card border border-border w-[90vw] min-w-[320px] max-w-2xl rounded-xl shadow-lg flex flex-col max-h-[90vh] animate-scale-up" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 overflow-y-auto flex flex-col gap-4">
              
              <div className="flex justify-between items-center">
                <h3 className="font-headline-sm text-headline-sm text-foreground font-bold">
                  Editar Equipamento
                </h3>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 text-secondary hover:bg-background rounded-full cursor-pointer transition-colors"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div className="grid grid-cols-1 gap-4">
                  {/* Name */}
                  <div className="flex flex-col gap-1">
                    <label htmlFor="edit-eq-name" className="font-label-caps text-label-caps text-secondary">
                      Nome do Equipamento*
                    </label>
                    <input
                      id="edit-eq-name"
                      type="text"
                      required
                      placeholder="Ex: Cadeira Gnatus G3"
                      className="w-full px-4 h-12 bg-card border border-border rounded-lg font-body-lg text-body-lg text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary shadow-sm"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Client Dropdown */}
                  <div className="flex flex-col gap-1">
                    <label htmlFor="edit-eq-client" className="font-label-caps text-label-caps text-secondary">
                      Clínica Cliente*
                    </label>
                    <div className="relative w-full">
                      <select
                        id="edit-eq-client"
                        required
                        className="w-full h-12 px-4 bg-card border border-border rounded-lg font-body-lg text-body-lg text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary appearance-none cursor-pointer"
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
                      <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-secondary pointer-events-none">
                        arrow_drop_down
                      </span>
                    </div>
                  </div>

                  {/* Location Dropdown */}
                  <div className="flex flex-col gap-1">
                    <label htmlFor="edit-eq-location" className="font-label-caps text-label-caps text-secondary">
                      Unidade / Local
                    </label>
                    <div className="relative w-full">
                      <select
                        id="edit-eq-location"
                        disabled={!selectedClientId}
                        className="w-full h-12 px-4 bg-card border border-border rounded-lg font-body-lg text-body-lg text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary appearance-none disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
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
                      <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-secondary pointer-events-none">
                        arrow_drop_down
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Serial Number */}
                  <div className="flex flex-col gap-1">
                    <label htmlFor="edit-eq-serial" className="font-label-caps text-label-caps text-secondary">
                      Número de Série
                    </label>
                    <input
                      id="edit-eq-serial"
                      type="text"
                      placeholder="Ex: GN-2023-8942A"
                      className="w-full px-4 h-12 bg-card border border-border rounded-lg font-body-lg text-body-lg text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary shadow-sm"
                      value={serialNumber}
                      onChange={(e) => setSerialNumber(e.target.value)}
                    />
                  </div>

                  {/* Manufacturer */}
                  <div className="flex flex-col gap-1">
                    <label htmlFor="edit-eq-manufacturer" className="font-label-caps text-label-caps text-secondary">
                      Fabricante
                    </label>
                    <input
                      id="edit-eq-manufacturer"
                      type="text"
                      placeholder="Ex: Gnatus, Schulz"
                      className="w-full px-4 h-12 bg-card border border-border rounded-lg font-body-lg text-body-lg text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary shadow-sm"
                      value={manufacturer}
                      onChange={(e) => setManufacturer(e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Installation Date */}
                  <div className="flex flex-col gap-1">
                    <label htmlFor="edit-eq-install" className="font-label-caps text-label-caps text-secondary">
                      Data de Instalação
                    </label>
                    <input
                      id="edit-eq-install"
                      type="date"
                      className="w-full px-4 h-12 bg-card border border-border rounded-lg font-body-lg text-body-lg text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary shadow-sm"
                      value={installationDate}
                      onChange={(e) => setInstallationDate(e.target.value)}
                    />
                  </div>

                  {/* Next Service Date */}
                  <div className="flex flex-col gap-1">
                    <label htmlFor="edit-eq-service" className="font-label-caps text-label-caps text-secondary">
                      Próxima Preventiva
                    </label>
                    <input
                      id="edit-eq-service"
                      type="date"
                      className="w-full px-4 h-12 bg-card border border-border rounded-lg font-body-lg text-body-lg text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary shadow-sm"
                      value={nextServiceDate}
                      onChange={(e) => setNextServiceDate(e.target.value)}
                    />
                  </div>
                </div>

                {/* Status Selection */}
                <div className="flex flex-col gap-1">
                  <label className="font-label-caps text-label-caps text-secondary">
                    Status do Ativo
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {['Ativo', 'Pendente', 'Inativo'].map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setStatus(s)}
                        className={`h-12 rounded-lg font-label-caps text-label-caps border transition-all flex items-center justify-center cursor-pointer ${
                          status === s
                            ? s === 'Ativo'
                              ? 'bg-tertiary/15 text-tertiary border-tertiary font-bold shadow-sm'
                              : s === 'Pendente'
                              ? 'bg-secondary/15 text-secondary border-secondary font-bold shadow-sm'
                              : 'bg-error/15 text-error border-error font-bold shadow-sm'
                            : 'bg-card text-secondary border-border hover:bg-background'
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Image Upload Field */}
                <div className="flex flex-col gap-1">
                  <span className="font-label-caps text-label-caps text-secondary">
                    Foto do Equipamento (Opcional)
                  </span>
                  {!imagePreview ? (
                    <label className="border border-dashed border-border hover:border-primary/50 transition-colors rounded-xl p-md flex flex-col items-center justify-center gap-sm cursor-pointer bg-card">
                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        className="hidden"
                        onChange={handleImageChange}
                        disabled={compressing}
                      />
                      <span className="material-symbols-outlined text-3xl text-outline">
                        add_a_photo
                      </span>
                      <span className="font-body-md text-body-md font-semibold text-primary">
                        {compressing ? 'Compactando...' : 'Adicionar Foto'}
                      </span>
                    </label>
                  ) : (
                    <div className="relative rounded-xl overflow-hidden border border-border bg-background p-xs flex items-center justify-center">
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

                <div className="flex justify-between items-center mt-4">
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={handleDelete}
                    className="h-12 px-4 rounded-lg bg-error/10 hover:bg-error/20 text-error font-label-caps text-label-caps transition-colors cursor-pointer flex items-center gap-1 font-semibold"
                  >
                    <span className="material-symbols-outlined text-[18px]">delete</span>
                    Deletar Equipamento
                  </button>

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      className="h-12 px-4 rounded-lg text-secondary hover:bg-background transition-colors font-label-caps text-label-caps cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="h-12 px-6 rounded-lg bg-primary text-primary-foreground hover:bg-primary/95 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    >
                      {submitting ? 'Salvando...' : 'Salvar'}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
