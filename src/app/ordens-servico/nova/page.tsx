'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

interface Client {
  id: string;
  name: string;
}

interface Location {
  id: string;
  name: string;
  room: string | null;
  client_id: string;
}

interface Equipment {
  id: string;
  code: string;
  name: string;
  location_id: string;
}

export default function NewWorkOrderPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Form Fields
  const [clientId, setClientId] = useState('');
  const [locationId, setLocationId] = useState('');
  const [equipmentId, setEquipmentId] = useState('');
  const [priority, setPriority] = useState<'NORMAL' | 'CRÍTICO'>('NORMAL');
  const [defectReported, setDefectReported] = useState('');
  const [technicianName, setTechnicianName] = useState('Marcelo T.');

  // Supabase lists or fallback mocks
  const [clients, setClients] = useState<Client[]>([
    { id: 'b1928424-dc50-4ff6-9818-d9bc7bf8bf21', name: 'Smile Care Downtown' },
    { id: 'd5a2c4e2-6b9e-4a6c-9c69-80ffee14a3c7', name: 'Advanced Dental Arts' },
    { id: 'e3d1e307-00c6-4519-a64b-a18209c46ee2', name: 'Pediatric Dentistry East' }
  ]);

  const [locations, setLocations] = useState<Location[]>([
    { id: 'c01a600b-34f1-e111-92b7-082fd26699b6', name: 'Main Building', room: 'Operatory 1', client_id: 'b1928424-dc50-4ff6-9818-d9bc7bf8bf21' },
    { id: 'd2718a78-31b0-41c6-a319-3fbe86dbac15', name: 'Main Building', room: 'Operatory 2', client_id: 'b1928424-dc50-4ff6-9818-d9bc7bf8bf21' },
    { id: 'fd983088-bad1-001f-2a26-3235ffb77a6c', name: 'Annex B', room: 'Sterilization Center', client_id: 'b1928424-dc50-4ff6-9818-d9bc7bf8bf21' },
    { id: '234f3b23-4f3b-4114-b5f8-8bad1001f2a2', name: 'Main Clinic', room: 'Room 3', client_id: 'd5a2c4e2-6b9e-4a6c-9c69-80ffee14a3c7' }
  ]);

  const [equipments, setEquipments] = useState<Equipment[]>([
    { id: '114b5f88-bad1-001f-2a13-4d619bcee6ff', code: 'CD001', name: 'Cadeira Gnatus G3', location_id: 'c01a600b-34f1-e111-92b7-082fd26699b6' },
    { id: 'e8871e88-bad1-001f-2a1e-50309ed3aa9e', code: 'COMP-402', name: 'Compressor Lubrification', location_id: 'fd983088-bad1-001f-2a26-3235ffb77a6c' }
  ]);

  useEffect(() => {
    async function loadData() {
      try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

        if (supabaseUrl && supabaseKey) {
          const { data: dbClients } = await supabase.from('clients').select('*');
          if (dbClients) setClients(dbClients);

          const { data: dbLocs } = await supabase.from('locations').select('*');
          if (dbLocs) setLocations(dbLocs);

          const { data: dbEquips } = await supabase.from('equipments').select('*');
          if (dbEquips) setEquipments(dbEquips);
        }
      } catch (e) {
        console.error('Erro ao buscar dados para os campos de seleção:', e);
      }
    }
    loadData();
  }, []);

  const filteredLocations = locations.filter(loc => loc.client_id === clientId);
  const filteredEquipments = equipments.filter(eq => eq.location_id === locationId);

  const handleNext = () => {
    if (step < 5) setStep(prev => prev + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(prev => prev - 1);
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const code = `#OS-${Math.floor(1000 + Math.random() * 9000)}`;
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      const newOrder = {
        code,
        client_id: clientId,
        equipment_id: equipmentId || null,
        status: 'ABERTA',
        priority,
        defect_reported: defectReported,
        service_date: new Date().toISOString().split('T')[0],
        technician_name: technicianName
      };

      if (supabaseUrl && supabaseKey) {
        const { error } = await supabase
          .from('work_orders')
          .insert([newOrder]);

        if (error) throw error;
      } else {
        console.log('Ambiente offline do Supabase. A Ordem de Serviço inserida localmente (mock):', newOrder);
      }

      alert('Ordem de serviço criada com sucesso!');
      router.push('/ordens-servico');
    } catch (err) {
      console.error('Erro ao criar ordem de serviço:', err);
      alert('Erro ao criar ordem de serviço. Verifique a conexão com o Supabase.');
    } finally {
      setLoading(false);
    }
  };

  const isStep1Valid = clientId !== '' && locationId !== '';
  const isStep2Valid = equipmentId !== '';
  const isStep3Valid = defectReported.trim() !== '';
  const isStep4Valid = technicianName.trim() !== '';

  const getStepValidation = () => {
    if (step === 1) return isStep1Valid;
    if (step === 2) return isStep2Valid;
    if (step === 3) return isStep3Valid;
    if (step === 4) return isStep4Valid;
    return true;
  };

  return (
    <div className="antialiased min-h-screen flex flex-col pb-32 bg-[#FAF8F4] text-on-background">
      {/* TopAppBar */}
      <header className="w-full sticky top-0 z-50 bg-surface dark:bg-surface-dim shadow-sm">
        <div className="flex items-center justify-between px-md py-sm w-full">
          <button 
            onClick={() => {
              if (step > 1) handleBack();
              else router.push('/ordens-servico');
            }} 
            aria-label="Voltar" 
            className="h-touch-target w-touch-target flex items-center justify-center text-primary dark:text-primary-fixed hover:bg-surface-container-high dark:hover:bg-surface-container-highest transition-colors rounded-full active:scale-95 duration-100"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <h1 className="font-headline-md text-headline-md font-bold text-primary dark:text-primary-fixed">DentalService</h1>
          <div className="w-touch-target"></div>
        </div>
      </header>

      {/* Main Content Canvas */}
      <main className="flex-grow w-full max-w-3xl mx-auto px-md py-lg md:px-lg flex flex-col gap-lg">
        {/* Header / Stepper Progress */}
        <div className="flex flex-col gap-sm">
          <h2 className="font-headline-lg text-headline-lg text-on-surface">Nova Ordem de Serviço</h2>
          <p className="font-body-md text-body-md text-on-surface-variant">
            {step === 1 && 'Passo 1 de 5: Detalhes da Clínica'}
            {step === 2 && 'Passo 2 de 5: Seleção de Equipamento'}
            {step === 3 && 'Passo 3 de 5: Descrição do Problema'}
            {step === 4 && 'Passo 4 de 5: Prioridade e Técnico'}
            {step === 5 && 'Passo 5 de 5: Confirmação Geral'}
          </p>
          {/* Visual Stepper */}
          <div className="flex items-center w-full gap-base mt-xs">
            <div className={`h-2 flex-1 rounded-full ${step >= 1 ? 'bg-primary' : 'bg-surface-variant'}`}></div>
            <div className={`h-2 flex-1 rounded-full ${step >= 2 ? 'bg-primary' : 'bg-surface-variant'}`}></div>
            <div className={`h-2 flex-1 rounded-full ${step >= 3 ? 'bg-primary' : 'bg-surface-variant'}`}></div>
            <div className={`h-2 flex-1 rounded-full ${step >= 4 ? 'bg-primary' : 'bg-surface-variant'}`}></div>
            <div className={`h-2 flex-1 rounded-full ${step >= 5 ? 'bg-primary' : 'bg-surface-variant'}`}></div>
          </div>
        </div>

        {/* Dynamic Steps Container */}
        <div className="bg-surface-container-lowest rounded-xl p-md shadow-[0_2px_8px_rgba(30,42,45,0.05)] border border-outline/10 flex flex-col gap-md">
          {/* STEP 1: Clinic & Location */}
          {step === 1 && (
            <div className="flex flex-col gap-md">
              <div className="flex flex-col gap-xs">
                <label className="font-label-caps text-label-caps text-on-surface-variant" htmlFor="client">Clínica Cliente</label>
                <div className="relative">
                  <select 
                    className="w-full h-touch-target px-md py-sm bg-surface-container-lowest border border-outline/20 rounded-lg font-body-lg text-body-lg text-on-surface focus:ring-2 focus:ring-primary focus:border-primary appearance-none" 
                    id="client"
                    value={clientId}
                    onChange={(e) => {
                      setClientId(e.target.value);
                      setLocationId('');
                      setEquipmentId('');
                    }}
                  >
                    <option value="">Selecione a Clínica...</option>
                    {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                  <span className="material-symbols-outlined absolute right-md top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none">arrow_drop_down</span>
                </div>
              </div>

              <div className="flex flex-col gap-xs">
                <label className="font-label-caps text-label-caps text-on-surface-variant" htmlFor="unit">Unidade / Prédio</label>
                <div className="relative">
                  <select 
                    className="w-full h-touch-target px-md py-sm bg-surface-container-lowest border border-outline/20 rounded-lg font-body-lg text-body-lg text-on-surface focus:ring-2 focus:ring-primary focus:border-primary appearance-none" 
                    id="unit"
                    value={locationId}
                    onChange={(e) => {
                      setLocationId(e.target.value);
                      setEquipmentId('');
                    }}
                    disabled={!clientId}
                  >
                    <option value="">Selecione o Prédio/Sala...</option>
                    {filteredLocations.map(l => (
                      <option key={l.id} value={l.id}>{l.name} {l.room ? `(${l.room})` : ''}</option>
                    ))}
                  </select>
                  <span className="material-symbols-outlined absolute right-md top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none">arrow_drop_down</span>
                </div>
              </div>

              <button 
                onClick={handleNext}
                disabled={!isStep1Valid}
                className={`mt-sm h-touch-target w-full bg-primary-container text-on-primary-container font-headline-sm text-headline-sm rounded-lg flex items-center justify-center gap-xs hover:bg-primary hover:text-on-primary transition-colors ${
                  !isStep1Valid ? 'opacity-50 cursor-not-allowed' : ''
                }`}
                type="button"
              >
                <span>Continuar para Equipamento</span>
                <span className="material-symbols-outlined">arrow_forward</span>
              </button>
            </div>
          )}

          {/* STEP 2: Equipment */}
          {step === 2 && (
            <div className="flex flex-col gap-md">
              <div className="flex flex-col gap-xs">
                <label className="font-label-caps text-label-caps text-on-surface-variant" htmlFor="equipment">Selecione o Equipamento</label>
                <div className="relative">
                  <select 
                    className="w-full h-touch-target px-md py-sm bg-surface-container-lowest border border-outline/20 rounded-lg font-body-lg text-body-lg text-on-surface focus:ring-2 focus:ring-primary focus:border-primary appearance-none" 
                    id="equipment"
                    value={equipmentId}
                    onChange={(e) => setEquipmentId(e.target.value)}
                  >
                    <option value="">Escolha um Equipamento...</option>
                    {filteredEquipments.map(eq => (
                      <option key={eq.id} value={eq.id}>{eq.name} ({eq.code})</option>
                    ))}
                    {filteredEquipments.length === 0 && (
                      <option value="none">Nenhum equipamento cadastrado neste local (Usar genérico)</option>
                    )}
                  </select>
                  <span className="material-symbols-outlined absolute right-md top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none">arrow_drop_down</span>
                </div>
              </div>

              <div className="flex gap-md">
                <button 
                  onClick={handleBack}
                  className="h-touch-target px-lg bg-surface-container-low text-on-surface-variant font-headline-sm text-headline-sm rounded-lg hover:bg-surface-variant transition-colors flex-1"
                >
                  Voltar
                </button>
                <button 
                  onClick={handleNext}
                  disabled={!equipmentId}
                  className={`h-touch-target bg-primary-container text-on-primary-container font-headline-sm text-headline-sm rounded-lg flex items-center justify-center gap-xs hover:bg-primary hover:text-on-primary transition-colors flex-[2] ${
                    !equipmentId ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  <span>Defeito Relatado</span>
                  <span className="material-symbols-outlined">arrow_forward</span>
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Defect */}
          {step === 3 && (
            <div className="flex flex-col gap-md">
              <div className="flex flex-col gap-xs">
                <label className="font-label-caps text-label-caps text-on-surface-variant" htmlFor="defect">Problema Relatado</label>
                <textarea 
                  rows={4}
                  className="w-full px-md py-sm bg-surface-container-lowest border border-outline/20 rounded-lg font-body-lg text-body-lg text-on-surface focus:ring-2 focus:ring-primary focus:border-primary" 
                  id="defect"
                  placeholder="Escreva detalhadamente o defeito ou aviso apresentado pelo equipamento..."
                  value={defectReported}
                  onChange={(e) => setDefectReported(e.target.value)}
                />
              </div>

              <div className="flex gap-md">
                <button 
                  onClick={handleBack}
                  className="h-touch-target px-lg bg-surface-container-low text-on-surface-variant font-headline-sm text-headline-sm rounded-lg hover:bg-surface-variant transition-colors flex-1"
                >
                  Voltar
                </button>
                <button 
                  onClick={handleNext}
                  disabled={!isStep3Valid}
                  className={`h-touch-target bg-primary-container text-on-primary-container font-headline-sm text-headline-sm rounded-lg flex items-center justify-center gap-xs hover:bg-primary hover:text-on-primary transition-colors flex-[2] ${
                    !isStep3Valid ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  <span>Prioridade</span>
                  <span className="material-symbols-outlined">arrow_forward</span>
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: Priority & Tech */}
          {step === 4 && (
            <div className="flex flex-col gap-md">
              <div className="flex flex-col gap-xs">
                <label className="font-label-caps text-label-caps text-on-surface-variant">Prioridade de Manutenção</label>
                <div className="flex gap-md mt-base">
                  <button 
                    type="button"
                    onClick={() => setPriority('NORMAL')}
                    className={`flex-1 h-touch-target rounded-lg font-label-caps text-label-caps flex items-center justify-center gap-xs border transition-all ${
                      priority === 'NORMAL' 
                        ? 'bg-primary-container text-on-primary-container border-primary font-bold shadow-sm' 
                        : 'bg-surface-container-lowest text-on-surface-variant border-outline/20'
                    }`}
                  >
                    Normal
                  </button>
                  <button 
                    type="button"
                    onClick={() => setPriority('CRÍTICO')}
                    className={`flex-1 h-touch-target rounded-lg font-label-caps text-label-caps flex items-center justify-center gap-xs border transition-all ${
                      priority === 'CRÍTICO' 
                        ? 'bg-error-container text-on-error-container border-error font-bold shadow-sm' 
                        : 'bg-surface-container-lowest text-on-surface-variant border-outline/20'
                    }`}
                  >
                    Crítico
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-xs mt-sm">
                <label className="font-label-caps text-label-caps text-on-surface-variant" htmlFor="tech">Técnico Designado</label>
                <input 
                  type="text"
                  className="w-full h-touch-target px-md py-sm bg-surface-container-lowest border border-outline/20 rounded-lg font-body-lg text-body-lg text-on-surface focus:ring-2 focus:ring-primary focus:border-primary" 
                  id="tech"
                  value={technicianName}
                  onChange={(e) => setTechnicianName(e.target.value)}
                />
              </div>

              <div className="flex gap-md">
                <button 
                  onClick={handleBack}
                  className="h-touch-target px-lg bg-surface-container-low text-on-surface-variant font-headline-sm text-headline-sm rounded-lg hover:bg-surface-variant transition-colors flex-1"
                >
                  Voltar
                </button>
                <button 
                  onClick={handleNext}
                  disabled={!isStep4Valid}
                  className={`h-touch-target bg-primary-container text-on-primary-container font-headline-sm text-headline-sm rounded-lg flex items-center justify-center gap-xs hover:bg-primary hover:text-on-primary transition-colors flex-[2] ${
                    !isStep4Valid ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  <span>Revisar Resumo</span>
                  <span className="material-symbols-outlined">arrow_forward</span>
                </button>
              </div>
            </div>
          )}

          {/* STEP 5: Summary */}
          {step === 5 && (
            <div className="flex flex-col gap-md">
              <h3 className="font-headline-sm text-headline-sm text-primary">Resumo da Ordem de Serviço</h3>
              
              <div className="grid grid-cols-1 gap-sm bg-surface-container-low p-sm rounded-lg border border-outline/10">
                <div>
                  <span className="block font-label-caps text-label-caps text-outline mb-1">Clínica</span>
                  <span className="font-body-md text-body-md text-on-surface font-semibold">
                    {clients.find(c => c.id === clientId)?.name || 'Desconhecida'}
                  </span>
                </div>
                <div>
                  <span className="block font-label-caps text-label-caps text-outline mb-1">Localização</span>
                  <span className="font-body-md text-body-md text-on-surface">
                    {locations.find(l => l.id === locationId)?.name || ''} {locations.find(l => l.id === locationId)?.room ? ` - ${locations.find(l => l.id === locationId)?.room}` : ''}
                  </span>
                </div>
                <div>
                  <span className="block font-label-caps text-label-caps text-outline mb-1">Equipamento</span>
                  <span className="font-body-md text-body-md text-on-surface">
                    {equipments.find(e => e.id === equipmentId)?.name || 'Equipamento Geral'}
                  </span>
                </div>
                <div>
                  <span className="block font-label-caps text-label-caps text-outline mb-1">Prioridade</span>
                  <span className={`font-body-md text-body-md font-bold ${priority === 'CRÍTICO' ? 'text-error' : 'text-primary'}`}>
                    {priority}
                  </span>
                </div>
                <div>
                  <span className="block font-label-caps text-label-caps text-outline mb-1">Técnico Designado</span>
                  <span className="font-body-md text-body-md text-on-surface">{technicianName}</span>
                </div>
                <div>
                  <span className="block font-label-caps text-label-caps text-outline mb-1">Defeito Relatado</span>
                  <p className="font-body-md text-body-md text-on-surface-variant italic">
                    &quot;{defectReported}&quot;
                  </p>
                </div>
              </div>

              <div className="flex gap-md">
                <button 
                  onClick={handleBack}
                  className="h-touch-target px-lg bg-surface-container-low text-on-surface-variant font-headline-sm text-headline-sm rounded-lg hover:bg-surface-variant transition-colors flex-1"
                >
                  Voltar
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Fixed Bottom Bar for Global Actions */}
      <div className="fixed bottom-0 left-0 w-full p-md bg-surface border-t border-outline/10 shadow-[0_-8px_24px_rgba(30,42,45,0.08)] z-40">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-md">
          <Link 
            href="/ordens-servico"
            className="h-touch-target px-lg bg-surface-container-low text-on-surface-variant font-headline-sm text-headline-sm rounded-lg hover:bg-surface-variant transition-colors flex-shrink-0 flex items-center justify-center"
          >
            Cancelar
          </Link>
          <button 
            onClick={handleSubmit}
            disabled={!getStepValidation() || loading}
            className={`h-touch-target w-full bg-primary text-on-primary font-headline-sm text-headline-sm rounded-lg hover:bg-primary-container hover:text-on-primary-container transition-all flex items-center justify-center gap-sm ${
              !getStepValidation() || loading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {loading ? (
              <span>Salvando...</span>
            ) : (
              <>
                <span className="material-symbols-outlined">check_circle</span>
                <span>Concluir OS</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
