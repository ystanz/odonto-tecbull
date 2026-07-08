export const runtime = 'edge';

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const cookie = request.cookies.get('tecbull_auth');
    if (cookie && cookie.value === 'true') {
      return NextResponse.json({ authenticated: true }, { status: 200 });
    }
    return NextResponse.json({ authenticated: false }, { status: 401 });
  } catch (err) {
    console.error('Erro na API de verificação de autenticação:', err);
    return NextResponse.json({ authenticated: false, error: 'Erro interno.' }, { status: 500 });
  }
}
