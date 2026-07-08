'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(
    pathname === '/login' ? true : null
  );

  useEffect(() => {
    if (pathname === '/login') {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsAuthorized(true);
      return;
    }

    let isMounted = true;

    async function checkAuth() {
      try {
        const res = await fetch('/api/auth/verify');
        if (res.status === 200) {
          if (isMounted) setIsAuthorized(true);
        } else {
          if (isMounted) {
            setIsAuthorized(false);
            router.push('/login');
          }
        }
      } catch (err) {
        console.error('Erro ao verificar autenticação:', err);
        if (isMounted) {
          setIsAuthorized(false);
          router.push('/login');
        }
      }
    }

    checkAuth();

    return () => {
      isMounted = false;
    };
  }, [pathname, router]);

  if (pathname === '/login') {
    return <>{children}</>;
  }

  if (isAuthorized === null) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[#FAF8F4] select-none">
        <div className="flex flex-col items-center gap-xs">
          <span className="material-symbols-outlined animate-spin text-primary text-[32px]">sync</span>
          <span className="text-on-surface-variant font-body-md text-body-md">Verificando acesso...</span>
        </div>
      </div>
    );
  }

  if (isAuthorized) {
    return <>{children}</>;
  }

  return null;
}
