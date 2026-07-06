'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

interface HeaderProps {
  onMenuClick?: () => void;
}

export default function Header({ onMenuClick }: HeaderProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && query.trim()) {
      router.push(`/busca?q=${encodeURIComponent(query.trim())}`);
    }
  };

  return (
    <header className="w-full bg-white border-b border-outline/10 px-md py-xs md:py-sm flex items-center justify-between sticky top-0 z-40 print:hidden h-14">
      <div className="flex items-center gap-xs w-full">
        {/* Hambúrguer button for Mobile */}
        {onMenuClick && (
          <button
            onClick={onMenuClick}
            className="md:hidden text-black hover:bg-surface-container-high transition-colors active:scale-95 p-2 rounded-full h-10 w-10 flex items-center justify-center cursor-pointer"
            type="button"
          >
            <span className="material-symbols-outlined text-[24px]">menu</span>
          </button>
        )}

        {/* Search Input Wrapper */}
        <div className="relative flex-grow max-w-xs md:max-w-md">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-lg pointer-events-none">
            search
          </span>
          <input
            type="text"
            placeholder="Buscar clientes, equipamentos ou OS..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full pl-10 pr-4 h-9 bg-surface-container-low border border-outline/15 rounded-full font-body-md text-sm text-on-surface placeholder-outline focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all shadow-sm"
          />
        </div>
      </div>

      {/* Marca / Título de forma minimalista no Desktop */}
      <div className="hidden md:flex items-center gap-xs text-on-surface font-semibold tracking-wide select-none">
        <span className="material-symbols-outlined text-primary text-[20px]">health_and_safety</span>
        <span className="text-sm font-label-caps text-label-caps font-bold">TecBull</span>
      </div>
    </header>
  );
}
