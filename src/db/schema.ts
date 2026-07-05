import { sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const clients = sqliteTable('clients', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text('name').notNull(),
  createdAt: text('created_at').$defaultFn(() => new Date().toISOString()),
});

export const locations = sqliteTable('locations', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  clientId: text('client_id').references(() => clients.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  room: text('room'),
  createdAt: text('created_at').$defaultFn(() => new Date().toISOString()),
});

export const equipments = sqliteTable('equipments', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text('name').notNull(),
  locationId: text('location_id').references(() => locations.id, { onDelete: 'set null' }),
  serialNumber: text('serial_number'),
  installationDate: text('installation_date'),
  manufacturer: text('manufacturer'),
  status: text('status').notNull().default('Ativo'),
  nextServiceDate: text('next_service_date'),
  createdAt: text('created_at').$defaultFn(() => new Date().toISOString()),
});

export const workOrders = sqliteTable('work_orders', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  code: text('code').notNull().unique(),
  clientId: text('client_id').references(() => clients.id, { onDelete: 'cascade' }),
  equipmentId: text('equipment_id').references(() => equipments.id, { onDelete: 'cascade' }),
  status: text('status').notNull().default('ABERTA'),
  priority: text('priority').notNull().default('NORMAL'),
  defectReported: text('defect_reported').notNull(),
  partsUsed: text('parts_used'),
  workNotes: text('work_notes'),
  imageUrl: text('image_url'),
  serviceDate: text('service_date'),
  technicianName: text('technician_name'),
  createdAt: text('created_at').$defaultFn(() => new Date().toISOString()),
});

export const settings = sqliteTable('settings', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  key: text('key').notNull().unique(),
  value: text('value'),
  createdAt: text('created_at').$defaultFn(() => new Date().toISOString()),
});
