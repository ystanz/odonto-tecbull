'use client';

import React, { useState, useEffect } from 'react';
import Navigation from '@/components/Navigation';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

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

const mockClients: ClientData[] = [
  {
    id: 'clinica-sorriso',
    name: 'Clínica Sorriso',
    totalAssets: 24,
    locations: [
      {
        id: 'c01a600b-34f1-e111-92b7-082fd26699b6',
        name: 'Centro Unit',
        room: 'Operatory 1',
        assetsCount: 12,
        statusText: '12 Assets • 2 Pendentes'
      },
      {
        id: 'fd983088-bad1-001f-2a26-3235ffb77a6c',
        name: 'Barra Unit',
        room: 'Main Operatory',
        assetsCount: 12,
        statusText: '12 Assets • Sem pendências'
      }
    ]
  },
  {
    id: 'odontomaster',
    name: 'OdontoMaster',
    totalAssets: 8,
    locations: [
      {
        id: '234f3b23-4f3b-4114-b5f8-8bad1001f2a2',
        name: 'Main Clinic',
        room: 'Room 3',
        assetsCount: 8,
        statusText: '8 Assets • 1 Parado'
      }
    ]
  }
];

export default function ClientesPage() {
  const [clients, setClients] = useState<ClientData[]>(mockClients);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        // Check if environment variables are set (client side)
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
        
        if (supabaseUrl && supabaseKey) {
          // Fetch clients
          const { data: dbClients, error: clientsError } = await supabase
            .from('clients')
            .select('*');

          if (clientsError) throw clientsError;

          if (dbClients) {
            const formattedClients: ClientData[] = [];

            for (const client of dbClients) {
              // Fetch locations for client
              const { data: dbLocs, error: locsError } = await supabase
                .from('locations')
                .select('*')
                .eq('client_id', client.id);

              if (locsError) throw locsError;

              const locationsList: Location[] = [];
              let clientTotalAssets = 0;

              if (dbLocs) {
                for (const loc of dbLocs) {
                  // Count equipments in this location
                  const { data: dbEquips, error: equipError } = await supabase
                    .from('equipments')
                    .select('*')
                    .eq('location_id', loc.id);

                  if (equipError) throw equipError;

                  const count = dbEquips ? dbEquips.length : 0;
                  clientTotalAssets += count;

                  const pendingCount = dbEquips ? dbEquips.filter(e => e.status === 'Pendente').length : 0;
                  const inactiveCount = dbEquips ? dbEquips.filter(e => e.status === 'Inativo' || e.status === 'Parado').length : 0;

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

                  locationsList.push({
                    id: loc.id,
                    name: loc.name,
                    room: loc.room,
                    assetsCount: count,
                    statusText
                  });
                }
              }

              formattedClients.push({
                id: client.id,
                name: client.name,
                totalAssets: clientTotalAssets,
                locations: locationsList
              });
            }

            if (formattedClients.length > 0) {
              setClients(formattedClients);
            }
          }
        }
      } catch (err) {
        console.error('Erro ao buscar dados do Supabase, usando mocks:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  const toggleSection = (id: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const filteredClients = clients.filter(client => {
    const matchesClient = client.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesLocation = client.locations.some(loc => 
      loc.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
    return matchesClient || matchesLocation;
  });

  return (
    <Navigation currentTab="clients">
      <main className="flex-1 overflow-y-auto px-md py-lg pb-32 max-w-4xl mx-auto w-full">
        {/* Header Section */}
        <div className="mb-lg">
          <h2 className="font-headline-lg text-headline-lg text-on-background mb-xs">
            Clientes e Locais
          </h2>
          <p className="text-on-surface-variant font-body-md text-body-md">
            Gerencie clínicas parceiras e acompanhe o status de seus locais de atendimento.
          </p>
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
          <div className="text-center py-4 text-on-surface-variant font-body-md">
            Carregando dados...
          </div>
        )}

        {/* Client Cards */}
        <div className="space-y-md">
          {filteredClients.map((client) => {
            const isExpanded = expandedSections[client.id] || false;
            return (
              <div key={client.id} className="bg-surface-container-lowest rounded-xl shadow-sm border border-outline/10 overflow-hidden">
                <div 
                  className="p-md cursor-pointer flex justify-between items-center hover:bg-surface-container-low transition-colors" 
                  onClick={() => toggleSection(client.id)}
                >
                  <div>
                    <h2 className="font-headline-sm text-headline-sm text-on-surface">
                      {client.name}
                    </h2>
                    <p className="font-body-md text-body-md text-on-surface-variant flex items-center gap-xs mt-xs">
                      <span className="material-symbols-outlined text-[16px]">precision_manufacturing</span>
                      {client.totalAssets} Equipamentos no Total
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
                      <div className="p-md text-center text-on-surface-variant font-body-md">
                        Sem unidades cadastradas
                      </div>
                    ) : (
                      client.locations.map((loc) => (
                        <div 
                          key={loc.id} 
                          className="p-md border-b border-outline/10 last:border-0 hover:bg-surface-container-low transition-colors cursor-pointer flex justify-between items-center"
                        >
                          <div>
                            <p className="font-body-lg text-body-lg font-medium text-on-surface">
                              {loc.name} {loc.room && ` - ${loc.room}`}
                            </p>
                            <p className="font-technical-code text-technical-code text-on-surface-variant mt-base">
                              {loc.statusText}
                            </p>
                          </div>
                          <Link href={`/ordens-servico`}>
                            <span className="material-symbols-outlined text-primary hover:scale-115 transition-transform">
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

        {/* Floating Action Button */}
        <Link 
          href="/ordens-servico/nova"
          className="fixed bottom-[96px] right-md w-touch-target h-touch-target bg-primary text-on-primary rounded-xl shadow-lg flex items-center justify-center active:scale-95 transition-transform z-40 hover:bg-primary-container"
        >
          <span className="material-symbols-outlined">add</span>
        </Link>
      </main>
    </Navigation>
  );
}
