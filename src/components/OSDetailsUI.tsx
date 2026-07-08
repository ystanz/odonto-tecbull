'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Navigation from '@/components/Navigation';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { DBWorkOrder, DBWorkNote, DBSettings } from '@/lib/types';

interface OSDetailsUIProps {
  initialWorkOrder: DBWorkOrder;
  initialWorkNotes: DBWorkNote[];
}

export default function OSDetailsUI({ initialWorkOrder, initialWorkNotes }: OSDetailsUIProps) {
  const router = useRouter();
  const [workOrder, setWorkOrder] = useState<DBWorkOrder>(initialWorkOrder);
  const [workNotes, setWorkNotes] = useState<DBWorkNote[]>(initialWorkNotes);
  const [settings, setSettings] = useState<DBSettings | null>(null);
  const [isMounted, setIsMounted] = useState(false);

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
        console.error('Erro ao carregar configurações para impressão:', err);
      }
    }
    fetchSettings();
  }, []);

  // Modal States
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Edit Fields State
  const [status, setStatus] = useState(initialWorkOrder.status);
  const [priority, setPriority] = useState(initialWorkOrder.priority);
  const [defectReported, setDefectReported] = useState(initialWorkOrder.defect_reported);
  const [partsUsed, setPartsUsed] = useState(initialWorkOrder.parts_used || '');
  const [workNotesText, setWorkNotesText] = useState(initialWorkOrder.work_notes || '');
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

  const handleStatusChange = async (newStatus: 'ABERTA' | 'EM ANDAMENTO' | 'AGUARDANDO PEÇA' | 'CONCLUÍDA') => {
    const previousStatus = workOrder.status;
    
    setWorkOrder((prev) => ({ ...prev, status: newStatus }));
    setStatus(newStatus);

    try {
      const resRaw = await fetch(`/api/os/${workOrder.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      const res = await resRaw.json();
      if (!res.success) {
        throw new Error(res.error || 'Erro ao atualizar status');
      }
      showToast('Status atualizado com sucesso!');
      router.refresh();
      reloadData();
    } catch (err) {
      setWorkOrder((prev) => ({ ...prev, status: previousStatus }));
      setStatus(previousStatus);
      const msg = err instanceof Error ? err.message : 'Erro interno';
      showToast(`Erro ao atualizar status: ${msg}`, 'error');
    }
  };

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

  const renderDate = (dateStr?: string) => {
    if (!dateStr) return 'N/A';
    try {
      const date = new Date(dateStr);
      const datePart = date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
      const timePart = date.toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit'
      });
      return (
        <>
          <span>{datePart}</span>
          <span className="print:hidden"> às {timePart}</span>
        </>
      );
    } catch {
      return dateStr;
    }
  };

  const clientName = workOrder.clients?.name || 'Cliente Geral';
  const equipmentName = workOrder.equipments?.name || 'Equipamento Geral';
  const serialNumber = workOrder.equipments?.serial_number || 'N/A';
  const manufacturer = workOrder.equipments?.manufacturer || 'N/A';

  if (!isMounted) {
    return null;
  }

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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-sm print:hidden">
          <div className="flex items-center space-x-2 text-on-surface-variant font-body-md">
            <Link prefetch={false} href="/ordens-servico" className="hover:text-primary flex items-center">
              <span className="material-symbols-outlined text-md mr-1">arrow_back</span>
              Voltar para Ordens de Serviço
            </Link>
          </div>
          <div className="flex gap-sm">
            <button
              onClick={() => window.print()}
              className="h-10 px-4 bg-primary text-primary-foreground font-label-caps text-label-caps rounded-xl hover:bg-primary/95 transition-colors flex items-center justify-center gap-xs shadow-sm cursor-pointer text-sm"
            >
              <span className="material-symbols-outlined text-[16px]">print</span>
              Gerar PDF
            </button>
            <button
              onClick={() => setIsEditModalOpen(true)}
              className="h-10 px-4 bg-card border border-border text-foreground font-label-caps text-label-caps rounded-xl hover:bg-background transition-colors flex items-center justify-center gap-xs shadow-sm cursor-pointer text-sm"
            >
              <span className="material-symbols-outlined text-[16px]">edit</span>
              Editar OS
            </button>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="h-10 px-4 bg-error/10 text-error font-label-caps text-label-caps rounded-xl hover:bg-error hover:text-error-foreground hover:border-error transition-colors flex items-center justify-center gap-xs shadow-sm cursor-pointer text-sm disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-[16px]">delete</span>
              Excluir
            </button>
          </div>
        </div>

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
                {settings?.phone && <span>Telefone: {settings.phone}</span>}
                {settings?.email && <span>{settings.phone ? ' | ' : ''}E-mail: {settings.email}</span>}
              </p>
              {settings?.address && (
                <p className="text-xs text-gray-500 mt-1">{settings.address}</p>
              )}
            </div>
            <div className="text-right">
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block font-label-caps">ORDEM DE SERVIÇO</span>
              <span className="text-2xl font-extrabold block mt-1">{workOrder.code}</span>
            </div>
          </div>
        </div>

        {/* Header Ticket Info Card */}
        <div className="bg-card p-lg rounded-xl border border-border shadow-sm relative overflow-hidden group print:bg-white print:border-0 print:shadow-none print:p-0">
          <div className={`absolute inset-y-0 left-0 w-1.5 ${workOrder.priority === 'CRÍTICO' ? 'bg-error' : 'bg-primary'} print:hidden`}></div>
          <div className="pl-md space-y-sm print:pl-0">
            <div className="flex flex-wrap items-center justify-between gap-sm print:hidden">
              <div className="flex items-center gap-sm">
                <h1 className="font-headline-md text-headline-md text-foreground font-bold">
                  Ordem de Serviço {workOrder.code}
                </h1>
              </div>
              <div className="flex gap-xs items-center">
                <div className="relative">
                  <select
                    value={workOrder.status}
                    onChange={(e) => handleStatusChange(e.target.value as 'ABERTA' | 'EM ANDAMENTO' | 'AGUARDANDO PEÇA' | 'CONCLUÍDA')}
                    className={`pl-3 pr-8 py-1 rounded-full text-xs font-semibold appearance-none cursor-pointer focus:outline-none transition-colors border border-border bg-card font-label-caps ${
                      workOrder.status === 'CONCLUÍDA' ? 'bg-tertiary/15 text-tertiary' :
                      workOrder.status === 'EM ANDAMENTO' ? 'bg-secondary/15 text-secondary' :
                      workOrder.status === 'AGUARDANDO PEÇA' ? 'bg-orange-500/15 text-orange-700' :
                      'bg-primary/15 text-primary'
                    }`}
                  >
                    <option value="ABERTA">ABERTA</option>
                    <option value="EM ANDAMENTO">EM ANDAMENTO</option>
                    <option value="AGUARDANDO PEÇA">AGUARDANDO PEÇA</option>
                    <option value="CONCLUÍDA">CONCLUÍDA</option>
                  </select>
                  <span className="material-symbols-outlined absolute right-2.5 top-1/2 -translate-y-1/2 text-secondary pointer-events-none text-sm font-bold">
                    arrow_drop_down
                  </span>
                </div>
                <span className={`px-sm py-base text-label-caps font-label-caps rounded-full text-xs font-semibold ${
                  workOrder.priority === 'CRÍTICO' ? 'bg-error/15 text-error' : 'bg-secondary/15 text-secondary'
                }`}>
                  Prioridade: {workOrder.priority}
                </span>
              </div>
            </div>

            {/* Structured ServiceNow Style Attributes Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-md pt-md border-t border-border print:border-black print:text-black">
              <div className="space-y-base">
                <p className="text-body-md text-secondary">
                  <span><strong>Data de Abertura:</strong> {renderDate(workOrder.created_at)}</span>
                </p>
                <p className="text-body-md text-secondary">
                  <span><strong>Cliente:</strong> {clientName}</span>
                </p>
              </div>

              <div className="space-y-base">
                <p className="text-body-md text-secondary">
                  <span><strong>Equipamento:</strong> {equipmentName}</span>
                </p>
                <p className="text-body-md text-secondary">
                  <span><strong>Nº de Série:</strong> {serialNumber}</span>
                </p>
                <p className="text-body-md text-secondary">
                  <span><strong>Fabricante:</strong> {manufacturer}</span>
                </p>
              </div>

              <div className="space-y-base md:col-span-2 lg:col-span-1">
                <p className="text-body-md text-secondary">
                  <span><strong>Data do Serviço:</strong> {workOrder.service_date || 'Agendado'}</span>
                </p>
                <p className="text-body-md text-secondary">
                  <span><strong>Peças Utilizadas:</strong> {workOrder.parts_used || 'Nenhuma peça cadastrada'}</span>
                </p>
              </div>
            </div>

            {/* Ticket Defect & Solution Details */}
            <div className="pt-md border-t border-border space-y-sm print:text-black">
              <div className="bg-background p-md rounded-lg border border-border print:bg-white print:border-0 print:p-0">
                <h3 className="font-headline-sm text-foreground font-semibold text-[14px] print:text-black">
                  Defeito Relatado / Sintoma:
                </h3>
                <p className="mt-xs text-body-lg text-secondary print:text-black">{workOrder.defect_reported}</p>
              </div>

              {workOrder.work_notes && (
                <div className="bg-tertiary/5 p-md rounded-lg border border-tertiary/10 print:bg-white print:border-0 print:p-0 print:mt-md">
                  <h3 className="font-headline-sm text-tertiary font-semibold text-[14px] print:text-black">
                    Solução Aplicada / Observações:
                  </h3>
                  <p className="mt-xs text-body-lg text-secondary whitespace-pre-line print:text-black">{workOrder.work_notes}</p>
                </div>
              )}

              {workOrder.image_url && workOrder.image_url.startsWith('data:image/') && (
                <div className="pt-sm print:hidden">
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
        <div className="bg-card p-lg rounded-xl border border-border shadow-sm space-y-md print:hidden">
          <h2 className="font-headline-sm text-headline-sm text-foreground font-bold flex items-center gap-xs">
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
                className="w-full p-md bg-background border border-border rounded-lg font-body-lg text-body-lg text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary shadow-sm resize-none"
              />
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={submittingNote || !newNote.trim()}
                className="h-10 px-6 rounded-xl bg-primary text-primary-foreground hover:bg-primary/95 font-label-caps text-label-caps transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center gap-xs"
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
          <div className="pt-md border-t border-border space-y-md">
            {workNotes.length === 0 ? (
              <div className="text-center py-6 text-secondary font-body-md italic flex items-center justify-center gap-xs">
                <span className="material-symbols-outlined text-outline">chat_bubble_outline</span>
                <span>Nenhuma nota interna registrada para este chamado ainda.</span>
              </div>
            ) : (
              <div className="relative pl-6 space-y-6 before:absolute before:inset-y-0 before:left-2.5 before:w-0.5 before:bg-border">
                {[...workNotes]
                  .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())
                  .map((note) => (
                  <div key={note.id} className="relative flex flex-col gap-base group">
                    {/* Circle Indicator on timeline */}
                    <div className="absolute -left-6 top-1.5 w-5.5 h-5.5 rounded-full bg-card border border-primary flex items-center justify-center shadow-sm">
                      <span className="material-symbols-outlined text-primary text-[12px] font-bold">description</span>
                    </div>

                    <div className="bg-background p-md rounded-xl border border-border group-hover:border-primary/20 transition-colors shadow-sm">
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
                      <p className="mt-xs text-body-md text-foreground whitespace-pre-wrap">{note.note}</p>
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
            <div className="bg-card border border-border w-[90vw] min-w-[320px] max-w-2xl rounded-xl shadow-lg flex flex-col max-h-[90vh] animate-scale-up" onClick={(e) => e.stopPropagation()}>
              <div className="p-6 overflow-y-auto flex flex-col gap-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-headline-sm text-headline-sm text-foreground font-bold">
                    Editar Ordem de Serviço {workOrder.code}
                  </h3>
                  <button
                    onClick={() => setIsEditModalOpen(false)}
                    className="p-2 text-secondary hover:bg-background rounded-full cursor-pointer transition-colors"
                  >
                    <span className="material-symbols-outlined">close</span>
                  </button>
                </div>

                <form onSubmit={handleEditSubmit} className="flex flex-col gap-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1">
                      <label htmlFor="edit-os-status" className="font-label-caps text-label-caps text-secondary">
                        Status do Chamado*
                      </label>
                      <select
                        id="edit-os-status"
                        required
                        className="w-full px-4 h-12 bg-card border border-border rounded-lg font-body-lg text-body-lg text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary shadow-sm"
                        value={status}
                        onChange={(e) => setStatus(e.target.value as 'ABERTA' | 'EM ANDAMENTO' | 'AGUARDANDO PEÇA' | 'CONCLUÍDA')}
                      >
                        <option value="ABERTA">ABERTA</option>
                        <option value="EM ANDAMENTO">EM ANDAMENTO</option>
                        <option value="AGUARDANDO PEÇA">AGUARDANDO PEÇA</option>
                        <option value="CONCLUÍDA">CONCLUÍDA</option>
                      </select>
                    </div>

                    <div className="flex flex-col gap-1">
                      <label htmlFor="edit-os-priority" className="font-label-caps text-label-caps text-secondary">
                        Prioridade do Chamado*
                      </label>
                      <select
                        id="edit-os-priority"
                        required
                        className="w-full px-4 h-12 bg-card border border-border rounded-lg font-body-lg text-body-lg text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary shadow-sm"
                        value={priority}
                        onChange={(e) => setPriority(e.target.value as 'NORMAL' | 'CRÍTICO')}
                      >
                        <option value="NORMAL">NORMAL</option>
                        <option value="CRÍTICO">CRÍTICO</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label htmlFor="edit-os-date" className="font-label-caps text-label-caps text-secondary">
                      Data do Atendimento
                    </label>
                    <input
                      id="edit-os-date"
                      type="date"
                      className="w-full px-4 h-12 bg-card border border-border rounded-lg font-body-lg text-body-lg text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary shadow-sm"
                      value={serviceDate}
                      onChange={(e) => setServiceDate(e.target.value)}
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label htmlFor="edit-os-defect" className="font-label-caps text-label-caps text-secondary">
                      Defeito Relatado*
                    </label>
                    <textarea
                      id="edit-os-defect"
                      required
                      rows={3}
                      placeholder="Descreva o problem relatado pelo cliente..."
                      className="w-full p-md bg-card border border-border rounded-lg font-body-lg text-body-lg text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary shadow-sm resize-none"
                      value={defectReported}
                      onChange={(e) => setDefectReported(e.target.value)}
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label htmlFor="edit-os-parts" className="font-label-caps text-label-caps text-secondary">
                      Peças Utilizadas
                    </label>
                    <input
                      id="edit-os-parts"
                      type="text"
                      placeholder="Ex: Mangueira de sucção, Reparo da válvula"
                      className="w-full px-4 h-12 bg-card border border-border rounded-lg font-body-lg text-body-lg text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary shadow-sm"
                      value={partsUsed}
                      onChange={(e) => setPartsUsed(e.target.value)}
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label htmlFor="edit-os-notes" className="font-label-caps text-label-caps text-secondary">
                      Solução Aplicada / Observações
                    </label>
                    <textarea
                      id="edit-os-notes"
                      rows={3}
                      placeholder="Observações técnicas ou descrição da solução final..."
                      className="w-full p-md bg-card border border-border rounded-lg font-body-lg text-body-lg text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary shadow-sm resize-none"
                      value={workNotesText}
                      onChange={(e) => setWorkNotesText(e.target.value)}
                    />
                  </div>

                  <div className="flex justify-end gap-3 mt-4">
                    <button
                      type="button"
                      onClick={() => setIsEditModalOpen(false)}
                      className="h-12 px-4 rounded-lg text-secondary hover:bg-background transition-colors font-label-caps text-label-caps cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={submittingEdit}
                      className="h-12 px-6 rounded-lg bg-primary text-primary-foreground hover:bg-primary/95 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
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
