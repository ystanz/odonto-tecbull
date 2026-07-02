'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function NewWorkOrderPageRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/os/nova');
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="text-center font-body-md text-on-surface-variant flex flex-col gap-sm items-center">
        <span className="material-symbols-outlined animate-spin text-primary text-3xl">sync</span>
        <span>Redirecionando para o novo formulário de OS...</span>
      </div>
    </div>
  );
}
