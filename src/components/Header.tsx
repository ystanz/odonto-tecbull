'use client';

import React, { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';

interface HeaderProps {
  onMenuClick?: () => void;
}

function getPageTitle(pathname: string) {
  if (pathname === '/') return 'Dashboard';
  if (pathname.startsWith('/clientes')) return 'Clientes';
  if (pathname.startsWith('/equipamentos')) return 'Equipamentos';
  if (pathname.startsWith('/ordens-servico') || pathname.startsWith('/os')) return 'Ordens de Serviço';
  if (pathname.startsWith('/busca')) return 'Busca';
  return 'TecBull';
}

export default function Header({ onMenuClick }: HeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [query, setQuery] = useState('');

  const pageTitle = getPageTitle(pathname);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && query.trim()) {
      router.push(`/busca?q=${encodeURIComponent(query.trim())}`);
    }
  };

  return (
    <header className="w-full bg-white border-b border-outline/10 p-4 flex items-center justify-between gap-4 sticky top-0 z-40 print:hidden h-14">
      {/* Left side: Menu Button and Dynamic Page Title */}
      <div className="flex items-center gap-2 truncate">
        {onMenuClick && (
          <button
            onClick={onMenuClick}
            className="md:hidden text-black hover:bg-surface-container-high transition-colors active:scale-95 p-2 rounded-full h-10 w-10 flex items-center justify-center cursor-pointer shrink-0"
            type="button"
          >
            <span className="material-symbols-outlined text-[24px]">menu</span>
          </button>
        )}
        <h1 className="text-lg md:text-xl font-bold text-on-surface truncate select-none">
          {pageTitle}
        </h1>
      </div>

      {/* Right side: Search form */}
      <div className="flex items-center gap-2 shrink-0">
        <div className="relative">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-lg pointer-events-none">
            search
          </span>
          <input
            type="text"
            placeholder="Buscar..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            className="pl-10 pr-4 h-9 bg-surface-container-low border border-outline/15 rounded-full text-base text-on-surface placeholder-outline focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary shadow-sm transition-all duration-300 w-32 sm:w-48 md:w-64 focus:w-48 sm:focus:w-64 md:focus:w-80"
          />
        </div>
      </div>
    </header>
  );
}
