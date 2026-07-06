'use client';

import React, { useState, useEffect } from 'react';

export default function NetworkStatus() {
  const [isOnline, setIsOnline] = useState(() => {
    if (typeof window !== 'undefined') {
      return navigator.onLine;
    }
    return true;
  });

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline) return null;

  return (
    <div className="w-full bg-error text-on-error py-2 px-md text-center text-xs font-semibold font-label-caps sticky top-0 z-[100] animate-fade-in flex items-center justify-center gap-xs shadow-md print:hidden">
      <span className="material-symbols-outlined text-sm font-bold animate-pulse">wifi_off</span>
      <span>Você está offline. Alterações podem não ser salvas.</span>
    </div>
  );
}
