export const runtime = 'edge';

import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { password } = await request.json();
    if (password === (process.env.ADMIN_PASSWORD || 'tecbull2026')) {
      const response = NextResponse.json({ success: true });
      const secureFlag = process.env.NODE_ENV === 'production' ? '; Secure' : '';
      response.headers.set(
        'Set-Cookie',
        `tecbull_auth=true; Path=/; HttpOnly; SameSite=Strict; Max-Age=604800${secureFlag}`
      );
      return response;
    }

    return NextResponse.json({ success: false, error: 'Senha incorreta.' }, { status: 401 });
  } catch (err) {
    console.error('Erro na API de autenticação:', err);
    return NextResponse.json({ success: false, error: 'Erro interno no servidor.' }, { status: 500 });
  }
}
