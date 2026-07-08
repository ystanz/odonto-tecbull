'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function LoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsMounted(true);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      setError('Por favor, insira a senha de acesso.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const resRaw = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });
      const res = await resRaw.json();

      if (res.success) {
        router.push('/');
      } else {
        setError(res.error || 'Senha incorreta.');
      }
    } catch (err) {
      console.error(err);
      setError('Erro de conexão com o servidor.');
    } finally {
      setLoading(false);
    }
  };

  if (!isMounted) {
    return null;
  }

  return (
    <main className="min-h-screen bg-[#FAF8F4] flex items-center justify-center p-md select-none">
      <div className="w-full max-w-[420px] bg-white rounded-2xl border border-outline/10 shadow-xl p-lg flex flex-col gap-md animate-scale-up">
        {/* Logo and Brand */}
        <div className="flex flex-col items-center text-center gap-xs">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center shadow-sm overflow-hidden relative">
            <Image
              src="/icon-512x512.png"
              alt="Logo OdontoTech Bull"
              fill
              className="object-cover"
              sizes="80px"
              priority
            />
          </div>
          <h1 className="font-headline-sm text-headline-sm font-bold text-black mt-xs">
            Marcelo Bull
          </h1>
          <p className="text-on-surface-variant font-body-md text-body-md">
            Gerenciamento Técnico de Clínicas e Equipamentos
          </p>
        </div>

        {/* Error message */}
        {error && (
          <div className="bg-error/10 border border-error/20 text-error rounded-lg px-md py-sm font-body-md text-body-md flex items-center gap-xs animate-fade-in">
            <span className="material-symbols-outlined text-[18px]">error</span>
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-md">
          <div className="flex flex-col gap-xs">
            <label htmlFor="login-password" className="font-label-caps text-label-caps text-on-surface-variant">
              Senha
            </label>
            <div className="relative">
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="Insira a senha de acesso..."
                className="w-full pl-md pr-xl py-sm h-touch-target bg-surface-container-lowest border border-outline/20 rounded-lg font-body-lg text-body-lg text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary shadow-sm"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-md top-1/2 -translate-y-1/2 text-outline-variant hover:text-primary cursor-pointer p-xs flex items-center justify-center"
                aria-label={showPassword ? 'Esconder senha' : 'Mostrar senha'}
              >
                <span className="material-symbols-outlined text-[20px]">
                  {showPassword ? 'visibility_off' : 'visibility'}
                </span>
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-touch-target bg-primary text-on-primary hover:bg-primary-container font-label-caps text-label-caps tracking-wider rounded-lg transition-colors flex items-center justify-center gap-xs font-semibold shadow-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <span className="material-symbols-outlined animate-spin text-[18px]">sync</span>
                <span>Entrando...</span>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-[18px]">login</span>
                <span>Entrar no Sistema</span>
              </>
            )}
          </button>
        </form>

        {/* Footer info */}
        <div className="text-center mt-sm text-outline font-technical-code text-[11px]">
          OdontoTech Bull &copy; {new Date().getFullYear()} - Todos os Direitos Reservados.
        </div>
      </div>
    </main>
  );
}
