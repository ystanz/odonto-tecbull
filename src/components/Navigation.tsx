'use client';

import React, { useState } from 'react';
import Link from 'next/link';

interface NavigationProps {
  currentTab: 'dashboard' | 'service' | 'equipment' | 'clients';
  children: React.ReactNode;
}

export default function Navigation({ currentTab, children }: NavigationProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen text-on-background bg-[#FAF8F4] antialiased pb-24 md:pb-0 md:pl-80">
      {/* TopAppBar (Mobile) */}
      <header className="w-full sticky top-0 z-50 bg-surface dark:bg-surface-dim shadow-sm flex items-center justify-between px-md py-sm md:hidden">
        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="text-primary dark:text-primary-fixed hover:bg-surface-container-high dark:hover:bg-surface-container-highest transition-colors active:scale-95 duration-100 p-2 rounded-full h-touch-target w-touch-target flex items-center justify-center"
        >
          <span className="material-symbols-outlined">menu</span>
        </button>
        <h1 className="font-headline-md text-headline-md font-bold text-primary dark:text-primary-fixed">
          TecBull
        </h1>
        <button className="text-primary dark:text-primary-fixed hover:bg-surface-container-high dark:hover:bg-surface-container-highest transition-colors active:scale-95 duration-100 p-2 rounded-full h-touch-target w-touch-target flex items-center justify-center">
          <span className="material-symbols-outlined">search</span>
        </button>
      </header>

      {/* NavigationDrawer (Desktop & Mobile drawer overlay) */}
      <aside 
        className={`${
          isMobileMenuOpen ? 'flex' : 'hidden'
        } md:flex h-full w-80 rounded-r-xl bg-surface dark:bg-surface-dim shadow-2xl fixed inset-y-0 left-0 z-[60] flex-col p-md transition-all duration-300`}
      >
        <div className="flex items-center justify-between mb-lg p-sm">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shadow-sm overflow-hidden text-primary font-bold text-xl">
              MT
            </div>
            <div>
              <h2 className="font-headline-sm text-headline-sm text-primary dark:text-primary-fixed">
                Marcelo T.
              </h2>
              <p className="font-body-md text-body-md text-on-surface-variant">
                Global Dental Care
              </p>
              <p className="font-technical-code text-technical-code text-tertiary-container mt-1">
                Online
              </p>
            </div>
          </div>
          {isMobileMenuOpen && (
            <button 
              onClick={() => setIsMobileMenuOpen(false)}
              className="md:hidden text-primary p-1 rounded-full hover:bg-surface-container-high"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          )}
        </div>

        <div className="space-y-sm flex-1">
          <Link 
            href="/"
            className={`flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-surface-container-high active:translate-x-1 transition-all ${
              currentTab === 'dashboard' ? 'bg-primary-container text-on-primary-container font-semibold' : 'text-on-surface-variant'
            }`}
          >
            <span className="material-symbols-outlined">dashboard</span>
            <span className="font-body-md text-body-md">Dashboard</span>
          </Link>

          <Link 
            href="/ordens-servico"
            className={`flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-surface-container-high active:translate-x-1 transition-all ${
              currentTab === 'service' ? 'bg-primary-container text-on-primary-container font-semibold' : 'text-on-surface-variant'
            }`}
          >
            <span className="material-symbols-outlined">handyman</span>
            <span className="font-body-md text-body-md">Ordens de Serviço</span>
          </Link>

          <Link 
            href="/equipamentos/114b5f88-bad1-001f-2a13-4d619bcee6ff"
            className={`flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-surface-container-high active:translate-x-1 transition-all ${
              currentTab === 'equipment' ? 'bg-primary-container text-on-primary-container font-semibold' : 'text-on-surface-variant'
            }`}
          >
            <span className="material-symbols-outlined">precision_manufacturing</span>
            <span className="font-body-md text-body-md">Equipamentos</span>
          </Link>

          <Link 
            href="/clientes"
            className={`flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-surface-container-high active:translate-x-1 transition-all ${
              currentTab === 'clients' ? 'bg-primary-container text-on-primary-container font-semibold' : 'text-on-surface-variant'
            }`}
          >
            <span className="material-symbols-outlined">location_city</span>
            <span className="font-body-md text-body-md">Clientes e Locais</span>
          </Link>
        </div>

        <div className="mt-auto pt-lg">
          <Link 
            href="/ordens-servico/nova"
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
          className="fixed inset-0 bg-black/40 z-50 md:hidden"
        />
      )}

      {/* Main Content Area */}
      {children}

      {/* BottomNavBar (Mobile) */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full h-touch-target flex justify-around items-center px-sm pb-safe bg-surface dark:bg-surface-container-lowest shadow-[0_-2px_8px_rgba(30,42,45,0.05)] rounded-t-xl z-50">
        <Link 
          href="/"
          className={`flex flex-col items-center justify-center px-4 py-1 transition-transform duration-200 active:scale-90 ${
            currentTab === 'dashboard' 
              ? 'bg-secondary-container text-on-secondary-container rounded-full' 
              : 'text-on-surface-variant'
          }`}
        >
          <span className="material-symbols-outlined" style={{ fontVariationSettings: currentTab === 'dashboard' ? '"FILL" 1' : undefined }}>dashboard</span>
          <span className="font-label-caps text-label-caps mt-1">Dashboard</span>
        </Link>

        <Link 
          href="/ordens-servico"
          className={`flex flex-col items-center justify-center px-4 py-1 transition-transform duration-200 active:scale-90 ${
            currentTab === 'service' 
              ? 'bg-secondary-container text-on-secondary-container rounded-full' 
              : 'text-on-surface-variant'
          }`}
        >
          <span className="material-symbols-outlined" style={{ fontVariationSettings: currentTab === 'service' ? '"FILL" 1' : undefined }}>handyman</span>
          <span className="font-label-caps text-label-caps mt-1">Serviço</span>
        </Link>

        <Link 
          href="/equipamentos/114b5f88-bad1-001f-2a13-4d619bcee6ff"
          className={`flex flex-col items-center justify-center px-4 py-1 transition-transform duration-200 active:scale-90 ${
            currentTab === 'equipment' 
              ? 'bg-secondary-container text-on-secondary-container rounded-full' 
              : 'text-on-surface-variant'
          }`}
        >
          <span className="material-symbols-outlined" style={{ fontVariationSettings: currentTab === 'equipment' ? '"FILL" 1' : undefined }}>precision_manufacturing</span>
          <span className="font-label-caps text-label-caps mt-1">Equipamento</span>
        </Link>

        <Link 
          href="/clientes"
          className={`flex flex-col items-center justify-center px-4 py-1 transition-transform duration-200 active:scale-90 ${
            currentTab === 'clients' 
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
