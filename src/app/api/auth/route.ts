export const runtime = 'edge';

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  try {
    const { password } = await request.json();
    const adminPassword = process.env.ADMIN_PASSWORD || 'tecbull2026';

    if (password === adminPassword) {
      const cookieStore = await cookies();
      cookieStore.set('tecbull_auth', 'true', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/',
        maxAge: 60 * 60 * 24 * 7, // 1 semana
      });

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: false, error: 'Senha incorreta.' }, { status: 401 });
  } catch (err) {
    console.error('Erro na API de autenticação:', err);
    return NextResponse.json({ success: false, error: 'Erro interno no servidor.' }, { status: 500 });
  }
}
