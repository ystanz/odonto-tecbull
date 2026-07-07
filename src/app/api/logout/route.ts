export const runtime = 'edge';

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST() {
  try {
    const cookieStore = await cookies();
    cookieStore.delete('tecbull_auth');
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Erro na API de logout:', err);
    return NextResponse.json({ success: false, error: 'Erro interno no servidor.' }, { status: 500 });
  }
}
