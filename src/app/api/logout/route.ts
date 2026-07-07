export const runtime = 'edge';

import { NextResponse } from 'next/server';

export async function POST() {
  try {
    const response = NextResponse.json({ success: true });
    response.headers.set(
      'Set-Cookie',
      'tecbull_auth=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT'
    );
    return response;
  } catch (err) {
    console.error('Erro na API de logout:', err);
    return NextResponse.json({ success: false, error: 'Erro interno no servidor.' }, { status: 500 });
  }
}
