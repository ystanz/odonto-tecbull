'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import Header from './Header';

interface NavigationProps {
  children: React.ReactNode;
  currentTab?: string;
}

export default function Navigation({ children, currentTab }: NavigationProps) {
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await fetch('/api/logout', { method: 'POST' });
      router.push('/login');
    } catch (err) {
      console.error('Erro ao efetuar logout:', err);
    }
  };

  return (
    <div className="min-h-screen text-foreground bg-background antialiased pb-24 md:pb-0 md:pl-80 print:pl-0 print:pb-0 print:bg-white">
      {/* Header unificado de pesquisa e topo */}
      <Header onMenuClick={() => setIsMobileMenuOpen(true)} />

      {/* NavigationDrawer (Desktop & Mobile drawer overlay) */}
      <aside
        className={`fixed inset-y-0 left-0 z-[60] h-full w-80 bg-card border-r border-border flex flex-col p-md transition-transform duration-300 ease-in-out md:translate-x-0 print:hidden ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
      >
        <div className="flex items-center justify-between mb-lg p-sm">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shadow-sm overflow-hidden relative">
              <Image
                src="/icon-512x512.png"
                alt="Logo"
                fill
                className="object-cover"
                sizes="48px"
              />
            </div>
            <div>
              <h2 className="font-headline-sm text-headline-sm text-foreground">
                Marcelo Bull
              </h2>
            </div>
          </div>

          {isMobileMenuOpen && (
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="md:hidden text-foreground p-1 rounded-full hover:bg-background cursor-pointer"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          )}
        </div>

        <div className="space-y-sm flex-1">
          <Link
            prefetch={false}
            href="/"
            className={`flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-background active:translate-x-1 transition-all ${currentTab === 'dashboard' ? 'bg-primary text-primary-foreground font-semibold shadow-sm' : 'text-secondary hover:text-foreground'
              }`}
          >
            <span className="material-symbols-outlined">dashboard</span>
            <span className="font-body-md text-body-md">Dashboard</span>
          </Link>

          <Link
            prefetch={false}
            href="/ordens-servico"
            className={`flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-background active:translate-x-1 transition-all ${currentTab === 'service' ? 'bg-primary text-primary-foreground font-semibold shadow-sm' : 'text-secondary hover:text-foreground'
              }`}
          >
            <span className="material-symbols-outlined">handyman</span>
            <span className="font-body-md text-body-md">Ordens de Serviço</span>
          </Link>

          <Link
            prefetch={false}
            href="/equipamentos"
            className={`flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-background active:translate-x-1 transition-all ${currentTab === 'equipment' ? 'bg-primary text-primary-foreground font-semibold shadow-sm' : 'text-secondary hover:text-foreground'
              }`}
          >
            <span className="material-symbols-outlined">precision_manufacturing</span>
            <span className="font-body-md text-body-md">Equipamentos</span>
          </Link>

          <Link
            prefetch={false}
            href="/clientes"
            className={`flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-background active:translate-x-1 transition-all ${currentTab === 'clients' ? 'bg-primary text-primary-foreground font-semibold shadow-sm' : 'text-secondary hover:text-foreground'
              }`}
          >
            <span className="material-symbols-outlined">location_city</span>
            <span className="font-body-md text-body-md">Clientes e Locais</span>
          </Link>

          <Link
            prefetch={false}
            href="/configuracoes"
            className={`flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-background active:translate-x-1 transition-all ${currentTab === 'settings' ? 'bg-primary text-primary-foreground font-semibold shadow-sm' : 'text-secondary hover:text-foreground'
              }`}
          >
            <span className="material-symbols-outlined">settings</span>
            <span className="font-body-md text-body-md">Configurações</span>
          </Link>
        </div>

        <div className="mt-auto pt-lg space-y-sm">
          <Link
            prefetch={false}
            href="/os/nova"
            className="w-full h-touch-target bg-primary text-primary-foreground font-headline-sm text-headline-sm rounded-lg shadow-sm hover:bg-primary/95 transition-colors flex items-center justify-center space-x-2"
          >
            <span className="material-symbols-outlined" style={{ fontVariationSettings: '"FILL" 1' }}>add_circle</span>
            <span>Nova OS</span>
          </Link>
          <button
            onClick={handleLogout}
            className="w-full h-touch-target bg-card border border-border text-foreground hover:bg-error hover:text-error-foreground hover:border-error transition-colors rounded-lg flex items-center justify-center space-x-2 cursor-pointer font-label-caps text-label-caps"
          >
            <span className="material-symbols-outlined">logout</span>
            <span>Sair</span>
          </button>
        </div>
      </aside>

      {/* Mobile Drawer Overlay background */}
      {isMobileMenuOpen && (
        <div
          onClick={() => setIsMobileMenuOpen(false)}
          className="fixed inset-0 bg-black/40 z-50 md:hidden print:hidden"
        />
      )}

      {/* Main Content Area */}
      {children}

      {/* BottomNavBar (Mobile) */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full h-touch-target flex justify-around items-center px-sm pb-safe bg-card border-t border-border shadow-sm z-50 print:hidden">
        <Link
          prefetch={false}
          href="/"
          className={`flex flex-col items-center justify-center px-4 py-1 transition-all duration-200 active:scale-90 ${currentTab === 'dashboard'
            ? 'bg-primary text-primary-foreground rounded-lg'
            : 'text-secondary hover:text-foreground'
            }`}
        >
          <span className="material-symbols-outlined" style={{ fontVariationSettings: currentTab === 'dashboard' ? '"FILL" 1' : undefined }}>dashboard</span>
          <span className="font-label-caps text-label-caps mt-1">Dashboard</span>
        </Link>

        <Link
          prefetch={false}
          href="/ordens-servico"
          className={`flex flex-col items-center justify-center px-4 py-1 transition-all duration-200 active:scale-90 ${currentTab === 'service'
            ? 'bg-primary text-primary-foreground rounded-lg'
            : 'text-secondary hover:text-foreground'
            }`}
        >
          <span className="material-symbols-outlined" style={{ fontVariationSettings: currentTab === 'service' ? '"FILL" 1' : undefined }}>handyman</span>
          <span className="font-label-caps text-label-caps mt-1">Serviço</span>
        </Link>

        <Link
          prefetch={false}
          href="/equipamentos"
          className={`flex flex-col items-center justify-center px-4 py-1 transition-all duration-200 active:scale-90 ${currentTab === 'equipment'
            ? 'bg-primary text-primary-foreground rounded-lg'
            : 'text-secondary hover:text-foreground'
            }`}
        >
          <span className="material-symbols-outlined" style={{ fontVariationSettings: currentTab === 'equipment' ? '"FILL" 1' : undefined }}>precision_manufacturing</span>
          <span className="font-label-caps text-label-caps mt-1">Equipamento</span>
        </Link>

        <Link
          prefetch={false}
          href="/clientes"
          className={`flex flex-col items-center justify-center px-4 py-1 transition-all duration-200 active:scale-90 ${currentTab === 'clients'
            ? 'bg-primary text-primary-foreground rounded-lg'
            : 'text-secondary hover:text-foreground'
            }`}
        >
          <span className="material-symbols-outlined" style={{ fontVariationSettings: currentTab === 'clients' ? '"FILL" 1' : undefined }}>location_city</span>
          <span className="font-label-caps text-label-caps mt-1">Clientes</span>
        </Link>
      </nav>
    </div>
  );
}
