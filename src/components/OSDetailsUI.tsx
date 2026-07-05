'use client';

import React, { useState, useCallback } from 'react';
import Navigation from '@/components/Navigation';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { DBWorkOrder, DBWorkNote } from '@/lib/types';

interface OSDetailsUIProps {
  initialWorkOrder: DBWorkOrder;
  initialWorkNotes: DBWorkNote[];
}

export default function OSDetailsUI({ initialWorkOrder, initialWorkNotes }: OSDetailsUIProps) {
  const router = useRouter();
  const [workOrder, setWorkOrder] = useState<DBWorkOrder>(initialWorkOrder);
  const [workNotes, setWorkNotes] = useState<DBWorkNote[]>(initialWorkNotes);


  // Modal States
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Edit Fields State
  const [status, setStatus] = useState(initialWorkOrder.status);
  const [priority, setPriority] = useState(initialWorkOrder.priority);
  const [defectReported, setDefectReported] = useState(initialWorkOrder.defect_reported);
  const [partsUsed, setPartsUsed] = useState(initialWorkOrder.parts_used || '');
  const [workNotesText, setWorkNotesText] = useState(initialWorkOrder.work_notes || '');
  const [technicianName, setTechnicianName] = useState(initialWorkOrder.technician_name || '');
  const [serviceDate, setServiceDate] = useState(initialWorkOrder.service_date || '');

  // New WorkNote Input State
  const [newNote, setNewNote] = useState('');
  const [submittingNote, setSubmittingNote] = useState(false);
  const [submittingEdit, setSubmittingEdit] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Toast notification state
  const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' } | null>(null);

  const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  }, []);

  // Fetch updated data from API REST
  const reloadData = useCallback(async () => {
    try {
      const resRaw = await fetch(`/api/os/${initialWorkOrder.id}`);
      const res = await resRaw.json();
      if (res.success && res.data) {
        setWorkOrder(res.data);
        setStatus(res.data.status);
        setPriority(res.data.priority);
        setDefectReported(res.data.defect_reported);
        setPartsUsed(res.data.parts_used || '');
        setWorkNotesText(res.data.work_notes || '');
        setTechnicianName(res.data.technician_name || '');
        setServiceDate(res.data.service_date || '');
      }

      const notesRaw = await fetch(`/api/worknotes?os_id=${initialWorkOrder.id}`);
      const notes = await notesRaw.json();
      if (notes.success) {
        setWorkNotes(notes.data || []);
      }
    } catch (err) {
      console.error(err);
      showToast('Erro ao atualizar dados.', 'error');
    }
  }, [initialWorkOrder.id, showToast]);

  // Handle Work Order Edit Submit
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!defectReported.trim()) {
      showToast('Preencha os campos obrigatórios.', 'error');
      return;
    }

    try {
      setSubmittingEdit(true);
      const resRaw = await fetch(`/api/os/${workOrder.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          priority,
          defectReported,
          partsUsed: partsUsed.trim() || null,
          workNotes: workNotesText.trim() || null,
          technicianName: technicianName.trim() || null,
          serviceDate: serviceDate || null
        })
      });
      const res = await resRaw.json();
      if (res.success) {
        showToast('Ordem de serviço atualizada com sucesso!');
        setIsEditModalOpen(false);
        router.refresh();
        reloadData();
      } else {
        throw new Error(res.error);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro interno';
      showToast(`Erro ao salvar alterações: ${msg}`, 'error');
    } finally {
      setSubmittingEdit(false);
    }
  };

  // Handle OS Delete
  const handleDelete = async () => {
    if (!window.confirm('Tem certeza que deseja excluir permanentemente esta Ordem de Serviço?')) {
      return;
    }

    try {
      setDeleting(true);
      const resRaw = await fetch(`/api/os/${workOrder.id}`, {
        method: 'DELETE'
      });
      const res = await resRaw.json();
      if (res.success) {
        showToast('Ordem de serviço excluída com sucesso!');
        setTimeout(() => {
          router.push('/ordens-servico');
        }, 1500);
      } else {
        throw new Error(res.error);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro interno';
      showToast(`Erro ao excluir chamado: ${msg}`, 'error');
      setDeleting(false);
    }
  };

  // Handle Adding a WorkNote
  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;

    try {
      setSubmittingNote(true);
      const resRaw = await fetch('/api/worknotes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          osId: workOrder.id,
          note: newNote.trim()
        })
      });
      const res = await resRaw.json();
      if (res.success) {
        setNewNote('');
        showToast('Nota interna registrada!');
        reloadData();
      } else {
        throw new Error(res.error);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro interno';
      showToast(`Erro ao adicionar nota: ${msg}`, 'error');
    } finally {
      setSubmittingNote(false);
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'N/A';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateStr;
    }
  };

  const clientName = workOrder.clients?.name || 'Cliente Geral';
  const equipmentName = workOrder.equipments?.name || 'Equipamento Geral';
  const serialNumber = workOrder.equipments?.serial_number || 'N/A';
  const manufacturer = workOrder.equipments?.manufacturer || 'N/A';

  return (
    <Navigation currentTab="service">
      <main className="flex-1 overflow-y-auto px-md py-lg pb-32 max-w-4xl mx-auto w-full space-y-lg">
        {/* Toast Alert */}
        {toast && (
          <div
            className={`fixed top-4 right-4 z-[9999] px-md py-sm rounded-lg shadow-lg text-white font-body-md animate-fade-in flex items-center gap-xs ${toast.type === 'error' ? 'bg-error' : 'bg-tertiary'
              }`}
          >
            <span className="material-symbols-outlined">
              {toast.type === 'error' ? 'error' : 'check_circle'}
            </span>
            <span>{toast.message}</span>
          </div>
        )}

        {/* Back Link & Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-sm">
          <div className="flex items-center space-x-2 text-on-surface-variant font-body-md">
            <Link prefetch={false} href="/ordens-servico" className="hover:text-primary flex items-center">
              <span className="material-symbols-outlined text-md mr-1">arrow_back</span>
              Voltar para Ordens de Serviço
            </Link>
          </div>
          <div className="flex gap-sm">
            <button
              onClick={() => setIsEditModalOpen(true)}
              className="h-10 px-4 bg-surface-container-high border border-outline/10 text-on-surface font-label-caps text-label-caps rounded-xl hover:bg-surface-container-highest transition-colors flex items-center justify-center gap-xs shadow-sm cursor-pointer text-sm"
            >
              <span className="material-symbols-outlined text-[16px]">edit</span>
              Editar OS
            </button>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="h-10 px-4 bg-error/10 text-error font-label-caps text-label-caps rounded-xl hover:bg-error/20 transition-colors flex items-center justify-center gap-xs shadow-sm cursor-pointer text-sm disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-[16px]">delete</span>
              Excluir
            </button>
          </div>
        </div>

        {/* Header Ticket Info Card */}
        <div className="bg-surface-container-lowest p-lg rounded-xl border border-outline/10 shadow-sm relative overflow-hidden group">
          <div className={`absolute inset-y-0 left-0 w-1.5 ${workOrder.priority === 'CRÍTICO' ? 'bg-error' : 'bg-primary'}`}></div>
          <div className="pl-md space-y-sm">
            <div className="flex flex-wrap items-center justify-between gap-sm">
              <div className="flex items-center gap-sm">
                <span className="material-symbols-outlined text-primary text-3xl">confirmation_number</span>
                <h1 className="font-headline-md text-headline-md text-on-surface font-bold">
                  Ordem de Serviço {workOrder.code}
                </h1>
              </div>
              <div className="flex gap-xs">
                <span className={`px-sm py-base text-label-caps font-label-caps rounded-full text-xs font-semibold ${
                  workOrder.status === 'CONCLUÍDA' ? 'bg-tertiary/15 text-tertiary' :
                  workOrder.status === 'EM ANDAMENTO' ? 'bg-secondary/15 text-secondary' : 'bg-primary/15 text-primary'
                }`}>
                  {workOrder.status}
                </span>
                <span className={`px-sm py-base text-label-caps font-label-caps rounded-full text-xs font-semibold ${
                  workOrder.priority === 'CRÍTICO' ? 'bg-error/15 text-error' : 'bg-outline/15 text-outline'
                }`}>
                  Prioridade: {workOrder.priority}
                </span>
              </div>
            </div>

            {/* Structured ServiceNow Style Attributes Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-md pt-md border-t border-outline/5">
              <div className="space-y-base">
                <p className="text-body-md text-on-surface-variant flex items-center gap-xs">
                  <span className="material-symbols-outlined text-outline text-[18px]">calendar_today</span>
                  <span><strong>Data de Abertura:</strong> {formatDate(workOrder.created_at)}</span>
                </p>
                <p className="text-body-md text-on-surface-variant flex items-center gap-xs">
                  <span className="material-symbols-outlined text-outline text-[18px]">domain</span>
                  <span><strong>Cliente:</strong> {clientName}</span>
                </p>
                <p className="text-body-md text-on-surface-variant flex items-center gap-xs">
                  <span className="material-symbols-outlined text-outline text-[18px]">badge</span>
                  <span><strong>Técnico:</strong> {workOrder.technician_name || 'Não atribuído'}</span>
                </p>
              </div>

              <div className="space-y-base">
                <p className="text-body-md text-on-surface-variant flex items-center gap-xs">
                  <span className="material-symbols-outlined text-outline text-[18px]">build</span>
                  <span><strong>Equipamento:</strong> {equipmentName}</span>
                </p>
                <p className="text-body-md text-on-surface-variant flex items-center gap-xs">
                  <span className="material-symbols-outlined text-outline text-[18px]">qr_code</span>
                  <span><strong>Nº de Série:</strong> {serialNumber}</span>
                </p>
                <p className="text-body-md text-on-surface-variant flex items-center gap-xs">
                  <span className="material-symbols-outlined text-outline text-[18px]">factory</span>
                  <span><strong>Fabricante:</strong> {manufacturer}</span>
                </p>
              </div>

              <div className="space-y-base md:col-span-2 lg:col-span-1">
                <p className="text-body-md text-on-surface-variant flex items-center gap-xs">
                  <span className="material-symbols-outlined text-outline text-[18px]">event_available</span>
                  <span><strong>Data do Serviço:</strong> {workOrder.service_date || 'Agendado'}</span>
                </p>
                <p className="text-body-md text-on-surface-variant flex items-start gap-xs">
                  <span className="material-symbols-outlined text-outline text-[18px] mt-[3px]">settings_input_component</span>
                  <span><strong>Peças Utilizadas:</strong> {workOrder.parts_used || 'Nenhuma peça cadastrada'}</span>
                </p>
              </div>
            </div>

            {/* Ticket Defect & Solution Details */}
            <div className="pt-md border-t border-outline/5 space-y-sm">
              <div className="bg-surface-container-low p-md rounded-lg border border-outline/5">
                <h3 className="font-headline-sm text-on-surface font-semibold flex items-center gap-xs text-[14px]">
                  <span className="material-symbols-outlined text-error text-[18px]">report_problem</span>
                  Defeito Relatado / Sintoma:
                </h3>
                <p className="mt-xs text-body-lg text-on-surface-variant">{workOrder.defect_reported}</p>
              </div>

              {workOrder.work_notes && (
                <div className="bg-tertiary/5 p-md rounded-lg border border-tertiary/10">
                  <h3 className="font-headline-sm text-tertiary font-semibold flex items-center gap-xs text-[14px]">
                    <span className="material-symbols-outlined text-tertiary text-[18px]">playlist_add_check</span>
                    Solução Aplicada / Observações:
                  </h3>
                  <p className="mt-xs text-body-lg text-on-surface-variant whitespace-pre-line">{workOrder.work_notes}</p>
                </div>
              )}

              {workOrder.image_url && (
                <div className="pt-sm">
                  <span className="text-xs font-semibold text-outline block mb-1">Anexo / Imagem do chamado:</span>
                  <a href={workOrder.image_url} target="_blank" rel="noopener noreferrer" className="inline-block overflow-hidden rounded-lg border border-outline/10 hover:border-primary transition-colors">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={workOrder.image_url} alt="Evidência do Defeito" className="max-h-60 object-contain" />
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* WORKNOTES: ServiceNow Style Activity Stream */}
        <div className="bg-surface-container-lowest p-lg rounded-xl border border-outline/10 shadow-sm space-y-md">
          <h2 className="font-headline-sm text-headline-sm text-on-surface font-bold flex items-center gap-xs">
            <span className="material-symbols-outlined text-primary">forum</span>
            Histórico e Notas Internas (Activity Stream)
          </h2>

          {/* New WorkNote Input Form */}
          <form onSubmit={handleAddNote} className="space-y-sm">
            <div className="flex flex-col gap-1">
              <textarea
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Insira uma nova nota técnica interna para o chamado (ex: Peça encomendada com fornecedor, reagendado por solicitação do cliente...)"
                rows={3}
                required
                className="w-full p-md bg-surface-container-low border border-outline/15 rounded-lg font-body-lg text-body-lg text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary shadow-inner resize-none"
              />
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={submittingNote || !newNote.trim()}
                className="h-10 px-6 rounded-xl bg-primary text-on-primary hover:bg-primary-container font-label-caps text-label-caps transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center gap-xs"
              >
                {submittingNote ? (
                  <>
                    <span className="material-symbols-outlined animate-spin text-[16px]">sync</span>
                    Enviando...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[16px]">send</span>
                    Registrar Nota
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Chronological Stream */}
          <div className="pt-md border-t border-outline/5 space-y-md">
            {workNotes.length === 0 ? (
              <div className="text-center py-6 text-on-surface-variant font-body-md italic flex items-center justify-center gap-xs">
                <span className="material-symbols-outlined text-outline">chat_bubble_outline</span>
                <span>Nenhuma nota interna registrada para este chamado ainda.</span>
              </div>
            ) : (
              <div className="relative pl-6 space-y-6 before:absolute before:inset-y-0 before:left-2.5 before:w-0.5 before:bg-outline/10">
                {workNotes.map((note) => (
                  <div key={note.id} className="relative flex flex-col gap-base group">
                    {/* Circle Indicator on timeline */}
                    <div className="absolute -left-6 top-1.5 w-5.5 h-5.5 rounded-full bg-surface-container-lowest border-2 border-primary flex items-center justify-center shadow-sm">
                      <span className="material-symbols-outlined text-primary text-[12px] font-bold">description</span>
                    </div>

                    <div className="bg-surface-container-low/75 p-md rounded-xl border border-outline/5 group-hover:border-primary/20 transition-colors shadow-sm">
                      <div className="flex items-center justify-between flex-wrap gap-xs">
                        <span className="font-bold text-sm text-primary flex items-center gap-base">
                          <span className="material-symbols-outlined text-[16px]">person</span>
                          Suporte Técnico
                        </span>
                        <span className="text-xs text-outline flex items-center gap-base">
                          <span className="material-symbols-outlined text-[12px]">schedule</span>
                          {formatDate(note.created_at)}
                        </span>
                      </div>
                      <p className="mt-xs text-body-md text-on-surface whitespace-pre-wrap">{note.note}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* MODAL: Editar OS */}
        {isEditModalOpen && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 p-4" onClick={() => setIsEditModalOpen(false)}>
            <div className="bg-white w-[90vw] min-w-[320px] max-w-2xl rounded-xl shadow-2xl flex flex-col max-h-[90vh] animate-scale-up" onClick={(e) => e.stopPropagation()}>
              <div className="p-6 overflow-y-auto flex flex-col gap-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold">
                    Editar Ordem de Serviço {workOrder.code}
                  </h3>
                  <button
                    onClick={() => setIsEditModalOpen(false)}
                    className="p-2 text-on-surface-variant hover:bg-surface-container-high rounded-full cursor-pointer transition-colors"
                  >
                    <span className="material-symbols-outlined">close</span>
                  </button>
                </div>

                <form onSubmit={handleEditSubmit} className="flex flex-col gap-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1">
                      <label htmlFor="edit-os-status" className="font-label-caps text-label-caps text-on-surface-variant">
                        Status do Chamado*
                      </label>
                      <select
                        id="edit-os-status"
                        required
                        className="w-full px-4 h-12 bg-surface-container-lowest border border-outline/20 rounded-lg font-body-lg text-body-lg text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary shadow-sm"
                        value={status}
                        onChange={(e) => setStatus(e.target.value as 'ABERTA' | 'EM ANDAMENTO' | 'CONCLUÍDA')}
                      >
                        <option value="ABERTA">ABERTA</option>
                        <option value="EM ANDAMENTO">EM ANDAMENTO</option>
                        <option value="CONCLUÍDA">CONCLUÍDA</option>
                      </select>
                    </div>

                    <div className="flex flex-col gap-1">
                      <label htmlFor="edit-os-priority" className="font-label-caps text-label-caps text-on-surface-variant">
                        Prioridade do Chamado*
                      </label>
                      <select
                        id="edit-os-priority"
                        required
                        className="w-full px-4 h-12 bg-surface-container-lowest border border-outline/20 rounded-lg font-body-lg text-body-lg text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary shadow-sm"
                        value={priority}
                        onChange={(e) => setPriority(e.target.value as 'NORMAL' | 'CRÍTICO')}
                      >
                        <option value="NORMAL">NORMAL</option>
                        <option value="CRÍTICO">CRÍTICO</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1">
                      <label htmlFor="edit-os-tech" className="font-label-caps text-label-caps text-on-surface-variant">
                        Técnico Responsável
                      </label>
                      <input
                        id="edit-os-tech"
                        type="text"
                        placeholder="Ex: Marcelo T."
                        className="w-full px-4 h-12 bg-surface-container-lowest border border-outline/20 rounded-lg font-body-lg text-body-lg text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary shadow-sm"
                        value={technicianName}
                        onChange={(e) => setTechnicianName(e.target.value)}
                      />
                    </div>

                    <div className="flex flex-col gap-1">
                      <label htmlFor="edit-os-date" className="font-label-caps text-label-caps text-on-surface-variant">
                        Data do Atendimento
                      </label>
                      <input
                        id="edit-os-date"
                        type="date"
                        className="w-full px-4 h-12 bg-surface-container-lowest border border-outline/20 rounded-lg font-body-lg text-body-lg text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary shadow-sm"
                        value={serviceDate}
                        onChange={(e) => setServiceDate(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label htmlFor="edit-os-defect" className="font-label-caps text-label-caps text-on-surface-variant">
                      Defeito Relatado*
                    </label>
                    <textarea
                      id="edit-os-defect"
                      required
                      rows={3}
                      placeholder="Descreva o problema relatado pelo cliente..."
                      className="w-full p-md bg-surface-container-lowest border border-outline/20 rounded-lg font-body-lg text-body-lg text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary shadow-sm resize-none"
                      value={defectReported}
                      onChange={(e) => setDefectReported(e.target.value)}
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label htmlFor="edit-os-parts" className="font-label-caps text-label-caps text-on-surface-variant">
                      Peças Utilizadas
                    </label>
                    <input
                      id="edit-os-parts"
                      type="text"
                      placeholder="Ex: Mangueira de sucção, Reparo da válvula"
                      className="w-full px-4 h-12 bg-surface-container-lowest border border-outline/20 rounded-lg font-body-lg text-body-lg text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary shadow-sm"
                      value={partsUsed}
                      onChange={(e) => setPartsUsed(e.target.value)}
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label htmlFor="edit-os-notes" className="font-label-caps text-label-caps text-on-surface-variant">
                      Solução Aplicada / Observações
                    </label>
                    <textarea
                      id="edit-os-notes"
                      rows={3}
                      placeholder="Observações técnicas ou descrição da solução final..."
                      className="w-full p-md bg-surface-container-lowest border border-outline/20 rounded-lg font-body-lg text-body-lg text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary shadow-sm resize-none"
                      value={workNotesText}
                      onChange={(e) => setWorkNotesText(e.target.value)}
                    />
                  </div>

                  <div className="flex justify-end gap-3 mt-4">
                    <button
                      type="button"
                      onClick={() => setIsEditModalOpen(false)}
                      className="h-12 px-4 rounded-lg text-on-surface-variant hover:bg-surface-container-high transition-colors font-label-caps text-label-caps cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={submittingEdit}
                      className="h-12 px-6 rounded-lg bg-primary text-on-primary hover:bg-primary-container font-label-caps text-label-caps transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    >
                      {submittingEdit ? 'Salvando...' : 'Salvar Alterações'}
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
