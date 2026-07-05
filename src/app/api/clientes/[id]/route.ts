export const runtime = 'edge';

import { NextResponse } from 'next/server';
import { getDb, schema } from '@/lib/supabase';
import { eq } from 'drizzle-orm';
import { DBClient, DBLocation } from '@/lib/types';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const db = getDb();

    const [client] = await db
      .select()
      .from(schema.clients)
      .where(eq(schema.clients.id, id))
      .limit(1);

    if (!client) {
      return NextResponse.json(
        { success: false, error: 'Clínica não encontrada.' },
        { status: 404 }
      );
    }

    const locationsList = await db
      .select()
      .from(schema.locations)
      .where(eq(schema.locations.clientId, id))
      .orderBy(schema.locations.name);

    const formattedClient: DBClient = {
      id: client.id,
      name: client.name,
      responsible_name: client.responsibleName,
      phone: client.phone,
      email: client.email,
      created_at: client.createdAt || undefined,
    };

    const formattedLocations: DBLocation[] = locationsList.map((loc) => ({
      id: loc.id,
      client_id: loc.clientId || '',
      name: loc.name,
      room: loc.room,
      address: loc.address,
      contact: loc.contact,
      notes: loc.notes,
      created_at: loc.createdAt || undefined,
    }));

    return NextResponse.json({
      success: true,
      data: {
        client: formattedClient,
        locations: formattedLocations,
      },
    });
  } catch (err) {
    console.error('Error in API GET /api/clientes/[id]:', err);
    const msg = err instanceof Error ? err.message : 'Erro interno';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, responsibleName, phone, email } = body;

    if (!name) {
      return NextResponse.json(
        { success: false, error: 'Nome da clínica é obrigatório.' },
        { status: 400 }
      );
    }

    const db = getDb();
    const [updatedClient] = await db
      .update(schema.clients)
      .set({
        name,
        responsibleName: responsibleName || null,
        phone: phone || null,
        email: email || null,
      })
      .where(eq(schema.clients.id, id))
      .returning();

    if (!updatedClient) {
      return NextResponse.json(
        { success: false, error: 'Cliente não encontrado.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        id: updatedClient.id,
        name: updatedClient.name,
        responsible_name: updatedClient.responsibleName,
        phone: updatedClient.phone,
        email: updatedClient.email,
      },
    });
  } catch (err) {
    console.error('Error in API PUT /api/clientes/[id]:', err);
    const msg = err instanceof Error ? err.message : 'Erro interno';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;

    const db = getDb();
    const [deletedClient] = await db
      .delete(schema.clients)
      .where(eq(schema.clients.id, id))
      .returning();

    if (!deletedClient) {
      return NextResponse.json(
        { success: false, error: 'Cliente não encontrado.' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: { id: deletedClient.id } });
  } catch (err) {
    console.error('Error in API DELETE /api/clientes/[id]:', err);
    const msg = err instanceof Error ? err.message : 'Erro interno';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
