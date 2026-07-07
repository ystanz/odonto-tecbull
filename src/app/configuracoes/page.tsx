'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Navigation from '@/components/Navigation';

export default function ConfiguracoesPage() {
  const [companyName, setCompanyName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' } | null>(null);

  const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  }, []);

  // Carregar dados existentes
  useEffect(() => {
    async function loadSettings() {
      try {
        setLoading(true);
        const resRaw = await fetch('/api/settings');
        const res = await resRaw.json();
        if (res.success && res.data) {
          setCompanyName(res.data.companyName || '');
          setOwnerName(res.data.ownerName || '');
          setPhone(res.data.phone || '');
          setEmail(res.data.email || '');
          setAddress(res.data.address || '');
        }
      } catch (err) {
        console.error('Erro ao carregar configurações:', err);
        showToast('Erro ao carregar configurações do servidor.', 'error');
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
  }, [showToast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      const resRaw = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName: companyName.trim() || null,
          ownerName: ownerName.trim() || null,
          phone: phone.trim() || null,
          email: email.trim() || null,
          address: address.trim() || null,
        }),
      });
      const res = await resRaw.json();
      if (res.success) {
        showToast('Configurações salvas com sucesso!');
      } else {
        throw new Error(res.error || 'Erro ao salvar');
      }
    } catch (err) {
      console.error('Erro ao salvar:', err);
      const msg = err instanceof Error ? err.message : 'Erro interno';
      showToast(`Erro ao salvar configurações: ${msg}`, 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Navigation currentTab="settings">
      <main className="flex-1 overflow-y-auto px-md py-lg pb-32 max-w-4xl mx-auto w-full">
        {/* Toast Notification */}
        {toast && (
          <div
            className={`fixed top-4 right-4 z-[100] px-md py-sm rounded-lg shadow-lg text-white font-body-md animate-fade-in flex items-center gap-xs ${
              toast.type === 'error' ? 'bg-error' : 'bg-tertiary'
            }`}
          >
            <span className="material-symbols-outlined">
              {toast.type === 'error' ? 'error' : 'check_circle'}
            </span>
            <span>{toast.message}</span>
          </div>
        )}

        {/* Header Section */}
        <div className="mb-lg">
          <h2 className="font-headline-lg text-headline-lg text-on-background mb-xs">
            Configurações do Sistema
          </h2>
          <p className="text-on-surface-variant font-body-md text-body-md">
            Gerencie as informações da sua empresa que serão inseridas nos relatórios e impressões de PDF de Ordens de Serviço.
          </p>
        </div>

        {loading ? (
          <div className="text-center py-12 text-on-surface-variant font-body-md flex flex-col items-center justify-center gap-sm bg-surface-container-lowest rounded-xl border border-outline/10 shadow-sm">
            <span className="material-symbols-outlined animate-spin text-primary text-3xl">sync</span>
            <span>Carregando configurações...</span>
          </div>
        ) : (
          <div className="bg-surface-container-lowest p-lg rounded-xl border border-outline/10 shadow-sm animate-fade-in">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Nome da Empresa */}
                <div className="flex flex-col gap-1 md:col-span-2">
                  <label htmlFor="company-name" className="font-label-caps text-label-caps text-on-surface-variant">
                    Nome da Empresa / Nome Fantasia
                  </label>
                  <input
                    id="company-name"
                    type="text"
                    placeholder="Ex: OdontoTech Bull Ltda"
                    className="w-full px-4 h-12 bg-surface-container-lowest border border-outline/20 rounded-lg font-body-lg text-body-lg text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary shadow-sm"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                  />
                </div>

                {/* Nome do Proprietário */}
                <div className="flex flex-col gap-1">
                  <label htmlFor="owner-name" className="font-label-caps text-label-caps text-on-surface-variant">
                    Nome do Proprietário / Responsável Técnico
                  </label>
                  <input
                    id="owner-name"
                    type="text"
                    placeholder="Ex: Marcelo Bull"
                    className="w-full px-4 h-12 bg-surface-container-lowest border border-outline/20 rounded-lg font-body-lg text-body-lg text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary shadow-sm"
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                  />
                </div>

                {/* Telefone */}
                <div className="flex flex-col gap-1">
                  <label htmlFor="phone" className="font-label-caps text-label-caps text-on-surface-variant">
                    Telefone de Contato
                  </label>
                  <input
                    id="phone"
                    type="text"
                    placeholder="Ex: (11) 99999-9999"
                    className="w-full px-4 h-12 bg-surface-container-lowest border border-outline/20 rounded-lg font-body-lg text-body-lg text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary shadow-sm"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>

                {/* E-mail */}
                <div className="flex flex-col gap-1 md:col-span-2">
                  <label htmlFor="email" className="font-label-caps text-label-caps text-on-surface-variant">
                    E-mail Comercial
                  </label>
                  <input
                    id="email"
                    type="email"
                    placeholder="Ex: suporte@odontotechbull.com"
                    className="w-full px-4 h-12 bg-surface-container-lowest border border-outline/20 rounded-lg font-body-lg text-body-lg text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary shadow-sm"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>

                {/* Endereço */}
                <div className="flex flex-col gap-1 md:col-span-2">
                  <label htmlFor="address" className="font-label-caps text-label-caps text-on-surface-variant">
                    Endereço Comercial Completo
                  </label>
                  <textarea
                    id="address"
                    rows={3}
                    placeholder="Ex: Av. Paulista, 1000 - Bela Vista, São Paulo - SP"
                    className="w-full p-md bg-surface-container-lowest border border-outline/20 rounded-lg font-body-lg text-body-lg text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary shadow-sm resize-none"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                  />
                </div>

              </div>

              {/* Botão Salvar */}
              <div className="flex justify-end pt-4 border-t border-outline/10">
                <button
                  type="submit"
                  disabled={saving}
                  className="h-12 px-6 rounded-lg bg-primary text-on-primary hover:bg-primary-container hover:text-on-primary-container font-label-caps text-label-caps transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center gap-xs font-semibold"
                >
                  {saving ? (
                    <>
                      <span className="material-symbols-outlined animate-spin text-[18px]">sync</span>
                      <span>Salvando...</span>
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[18px]">save</span>
                      <span>Salvar Configurações</span>
                    </>
                  )}
                </button>
              </div>

            </form>
          </div>
        )}
      </main>
    </Navigation>
  );
}
