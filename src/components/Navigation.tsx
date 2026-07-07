'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Header from './Header';

interface NavigationProps {
  children: React.ReactNode;
  currentTab?: string;
}

export default function Navigation({ children, currentTab }: NavigationProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen text-black bg-[#FAF8F4] antialiased pb-24 md:pb-0 md:pl-80 print:pl-0 print:pb-0 print:bg-white">
      {/* Header unificado de pesquisa e topo */}
      <Header onMenuClick={() => setIsMobileMenuOpen(true)} />

      {/* NavigationDrawer (Desktop & Mobile drawer overlay) */}
      <aside
        className={`fixed inset-y-0 left-0 z-[60] h-full w-80 rounded-r-xl bg-white dark:bg-gray-900 shadow-2xl flex flex-col p-md transition-transform duration-300 ease-in-out md:translate-x-0 print:hidden ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
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
              <h2 className="font-headline-sm text-headline-sm text-black dark:text-primary-fixed">
                Marcelo Bull
              </h2>
            </div>
          </div>

          {isMobileMenuOpen && (
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="md:hidden text-black p-1 rounded-full hover:bg-surface-container-high cursor-pointer"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          )}
        </div>

        <div className="space-y-sm flex-1">
          <Link
            prefetch={false}
            href="/"
            className={`flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-surface-container-high active:translate-x-1 transition-all ${currentTab === 'dashboard' ? 'bg-primary-container text-on-primary-container font-semibold' : 'text-on-surface-variant'
              }`}
          >
            <span className="material-symbols-outlined">dashboard</span>
            <span className="font-body-md text-body-md">Dashboard</span>
          </Link>

          <Link
            prefetch={false}
            href="/ordens-servico"
            className={`flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-surface-container-high active:translate-x-1 transition-all ${currentTab === 'service' ? 'bg-primary-container text-on-primary-container font-semibold' : 'text-on-surface-variant'
              }`}
          >
            <span className="material-symbols-outlined">handyman</span>
            <span className="font-body-md text-body-md">Ordens de Serviço</span>
          </Link>

          <Link
            prefetch={false}
            href="/equipamentos"
            className={`flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-surface-container-high active:translate-x-1 transition-all ${currentTab === 'equipment' ? 'bg-primary-container text-on-primary-container font-semibold' : 'text-on-surface-variant'
              }`}
          >
            <span className="material-symbols-outlined">precision_manufacturing</span>
            <span className="font-body-md text-body-md">Equipamentos</span>
          </Link>

          <Link
            prefetch={false}
            href="/clientes"
            className={`flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-surface-container-high active:translate-x-1 transition-all ${currentTab === 'clients' ? 'bg-primary-container text-on-primary-container font-semibold' : 'text-on-surface-variant'
              }`}
          >
            <span className="material-symbols-outlined">location_city</span>
            <span className="font-body-md text-body-md">Clientes e Locais</span>
          </Link>

          <Link
            prefetch={false}
            href="/configuracoes"
            className={`flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-surface-container-high active:translate-x-1 transition-all ${currentTab === 'settings' ? 'bg-primary-container text-on-primary-container font-semibold' : 'text-on-surface-variant'
              }`}
          >
            <span className="material-symbols-outlined">settings</span>
            <span className="font-body-md text-body-md">Configurações</span>
          </Link>
        </div>

        <div className="mt-auto pt-lg">
          <Link
            prefetch={false}
            href="/os/nova"
            className="w-full h-touch-target bg-primary text-on-primary font-headline-sm text-headline-sm rounded-lg shadow-sm hover:bg-primary-container hover:text-on-primary-container transition-colors flex items-center justify-center space-x-2"
          >
            <span className="material-symbols-outlined" style={{ fontVariationSettings: '"FILL" 1' }}>add_circle</span>
            <span>Nova OS</span>
          </Link>
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
      <nav className="md:hidden fixed bottom-0 left-0 w-full h-touch-target flex justify-around items-center px-sm pb-safe bg-surface dark:bg-surface-container-lowest shadow-[0_-2px_8px_rgba(30,42,45,0.05)] rounded-t-xl z-50 print:hidden">
        <Link
          prefetch={false}
          href="/"
          className={`flex flex-col items-center justify-center px-4 py-1 transition-all duration-200 active:scale-90 hover:text-primary ${currentTab === 'dashboard'
            ? 'bg-secondary-container text-on-secondary-container rounded-full'
            : 'text-on-surface-variant'
            }`}
        >
          <span className="material-symbols-outlined" style={{ fontVariationSettings: currentTab === 'dashboard' ? '"FILL" 1' : undefined }}>dashboard</span>
          <span className="font-label-caps text-label-caps mt-1">Dashboard</span>
        </Link>

        <Link
          prefetch={false}
          href="/ordens-servico"
          className={`flex flex-col items-center justify-center px-4 py-1 transition-all duration-200 active:scale-90 hover:text-primary ${currentTab === 'service'
            ? 'bg-secondary-container text-on-secondary-container rounded-full'
            : 'text-on-surface-variant'
            }`}
        >
          <span className="material-symbols-outlined" style={{ fontVariationSettings: currentTab === 'service' ? '"FILL" 1' : undefined }}>handyman</span>
          <span className="font-label-caps text-label-caps mt-1">Serviço</span>
        </Link>

        <Link
          prefetch={false}
          href="/equipamentos"
          className={`flex flex-col items-center justify-center px-4 py-1 transition-all duration-200 active:scale-90 hover:text-primary ${currentTab === 'equipment'
            ? 'bg-secondary-container text-on-secondary-container rounded-full'
            : 'text-on-surface-variant'
            }`}
        >
          <span className="material-symbols-outlined" style={{ fontVariationSettings: currentTab === 'equipment' ? '"FILL" 1' : undefined }}>precision_manufacturing</span>
          <span className="font-label-caps text-label-caps mt-1">Equipamento</span>
        </Link>

        <Link
          prefetch={false}
          href="/clientes"
          className={`flex flex-col items-center justify-center px-4 py-1 transition-all duration-200 active:scale-90 hover:text-primary ${currentTab === 'clients'
            ? 'bg-secondary-container text-on-secondary-container rounded-full'
            : 'text-on-surface-variant'
            }`}
        >
          <span className="material-symbols-outlined" style={{ fontVariationSettings: currentTab === 'clients' ? '"FILL" 1' : undefined }}>location_city</span>
          <span className="font-label-caps text-label-caps mt-1">Clientes</span>
        </Link>
      </nav>
    </div>
  );
}
