import { DBClient, DBLocation, DBEquipment, DBWorkOrder } from './types';

const CLIENTS_KEY = 'techbull_clients';
const LOCATIONS_KEY = 'techbull_locations';
const EQUIPMENTS_KEY = 'techbull_equipments';
const WORK_ORDERS_KEY = 'techbull_work_orders';

const initialClients: DBClient[] = [
  { id: 'b1928424-dc50-4ff6-9818-d9bc7bf8bf21', name: 'Clínica Sorriso', responsible_name: 'Dr. Roberto Santos', phone: '11988888888', email: 'roberto@sorriso.com' },
  { id: 'd5a2c4e2-6b9e-4a6c-9c69-80ffee14a3c7', name: 'OdontoMaster', responsible_name: 'Dra. Carla Souza', phone: '11977777777', email: 'carla@odontomaster.com' },
  { id: 'e3d1e307-00c6-4519-a64b-a18209c46ee2', name: 'Clinica OdontoVida', responsible_name: 'Dr. Paulo Abreu', phone: '11966666666', email: 'paulo@odontovida.com' }
];

const initialLocations: DBLocation[] = [
  { id: 'c01a600b-34f1-e111-92b7-082fd26699b6', client_id: 'b1928424-dc50-4ff6-9818-d9bc7bf8bf21', name: 'Centro Unit', room: 'Operatory 1', address: 'Av. Paulista, 1000', contact: 'Recepção', notes: 'Próximo ao metrô' },
  { id: 'd2718a78-31b0-41c6-a319-3fbe86dbac15', client_id: 'b1928424-dc50-4ff6-9818-d9bc7bf8bf21', name: 'Centro Unit', room: 'Operatory 2', address: 'Av. Paulista, 1000', contact: 'Recepção', notes: 'Próximo ao metrô' },
  { id: 'fd983088-bad1-001f-2a26-3235ffb77a6c', client_id: 'b1928424-dc50-4ff6-9818-d9bc7bf8bf21', name: 'Barra Unit', room: 'Main Operatory', address: 'Av. das Américas, 500', contact: 'Portaria', notes: 'Bloco B' },
  { id: '234f3b23-4f3b-4114-b5f8-8bad1001f2a2', client_id: 'd5a2c4e2-6b9e-4a6c-9c69-80ffee14a3c7', name: 'Main Clinic', room: 'Room 3', address: 'Rua das Flores, 15', contact: 'Dr. Carla', notes: 'Fundos' },
  { id: 'e9f6fa1e-5030-0021-0d1e-50309ed3aa9e', client_id: 'e3d1e307-00c6-4519-a64b-a18209c46ee2', name: 'Centro Sorriso Infantil', room: 'Main Operatory', address: 'Rua Augusta, 450', contact: 'Ana Luiza', notes: 'Sala decorada' }
];

const initialEquipments: DBEquipment[] = [
  {
    id: '114b5f88-bad1-001f-2a13-4d619bcee6ff',
    name: 'Cadeira Gnatus G3',
    location_id: 'c01a600b-34f1-e111-92b7-082fd26699b6',
    serial_number: 'GN-2023-8942A',
    installation_date: '2023-04-12',
    manufacturer: 'Gnatus',
    status: 'Ativo',
    next_service_date: '2024-06-15'
  },
  {
    id: 'e8871e88-bad1-001f-2a1e-50309ed3aa9e',
    name: 'Compressor Lubrification',
    location_id: 'fd983088-bad1-001f-2a26-3235ffb77a6c',
    serial_number: 'CP-8842-X',
    installation_date: '2024-01-10',
    manufacturer: 'Schulz',
    status: 'Pendente',
    next_service_date: '2026-07-10'
  },
  {
    id: '6b9e7888-bad1-001f-2a1e-50309ed3aa9e',
    name: 'Autoclave Filter Replacement',
    location_id: 'e9f6fa1e-5030-0021-0d1e-50309ed3aa9e',
    serial_number: 'ST-9912-B',
    installation_date: '2023-08-20',
    manufacturer: 'Cristófoli',
    status: 'Pendente',
    next_service_date: '2026-08-20'
  }
];

const initialWorkOrders: DBWorkOrder[] = [
  {
    id: 'fd9830ffd-cc1d-55e1-bdff-b77affb77a6c',
    code: '#AC-2023-091',
    client_id: 'e3d1e307-00c6-4519-a64b-a18209c46ee2',
    equipment_id: '6b9e7888-bad1-001f-2a1e-50309ed3aa9e',
    status: 'EM ANDAMENTO',
    priority: 'NORMAL',
    defect_reported: 'Falha no ciclo de secagem. Pressão não atinge o nível ideal na fase final do ciclo.',
    parts_used: 'Nenhuma',
    work_notes: 'Retornando no dia seguinte para teste final',
    image_url: null,
    service_date: '2023-10-24',
    technician_name: 'Ana L.'
  },
  {
    id: 'ba1a1aff-dad6-000a-9300-0a93000a9300',
    code: '#CH-2021-442',
    client_id: 'b1928424-dc50-4ff6-9818-d9bc7bf8bf21',
    equipment_id: '114b5f88-bad1-001f-2a13-4d619bcee6ff',
    status: 'ABERTA',
    priority: 'CRÍTICO',
    defect_reported: 'Vazamento de ar no pedal de comando e luz do refletor piscando intermitentemente.',
    parts_used: null,
    work_notes: null,
    image_url: null,
    service_date: '2023-10-26',
    technician_name: 'Marcos S.'
  },
  {
    id: '1c4e2f8a-bf96-0021-0d1e-50309ed3aa9e',
    code: '#CP-2022-118',
    client_id: 'e3d1e307-00c6-4519-a64b-a18209c46ee2',
    equipment_id: 'e8871e88-bad1-001f-2a1e-50309ed3aa9e',
    status: 'CONCLUÍDA',
    priority: 'NORMAL',
    defect_reported: 'Manutenção preventiva trimestral realizada. Troca de filtros e aferição de válvulas OK.',
    parts_used: 'Filtro de ar, Anel de vedação',
    work_notes: 'Valores aferidos estão dentro da faixa ideal',
    image_url: null,
    service_date: '2023-10-23',
    technician_name: 'Marcos S.'
  }
];

function isBrowser() {
  return typeof window !== 'undefined';
}

export function getLocalClients(): DBClient[] {
  if (!isBrowser()) return initialClients;
  const raw = localStorage.getItem(CLIENTS_KEY);
  if (!raw) {
    localStorage.setItem(CLIENTS_KEY, JSON.stringify(initialClients));
    return initialClients;
  }
  return JSON.parse(raw);
}

export function saveLocalClient(name: string, responsibleName?: string | null, phone?: string | null, email?: string | null): DBClient {
  const clients = getLocalClients();
  const newClient: DBClient = {
    id: crypto.randomUUID(),
    name,
    responsible_name: responsibleName || null,
    phone: phone || null,
    email: email || null,
    created_at: new Date().toISOString()
  };
  clients.push(newClient);
  localStorage.setItem(CLIENTS_KEY, JSON.stringify(clients));
  return newClient;
}

export function getLocalLocations(): DBLocation[] {
  if (!isBrowser()) return initialLocations;
  const raw = localStorage.getItem(LOCATIONS_KEY);
  if (!raw) {
    localStorage.setItem(LOCATIONS_KEY, JSON.stringify(initialLocations));
    return initialLocations;
  }
  return JSON.parse(raw);
}

export function saveLocalLocation(
  clientId: string,
  name: string,
  room: string | null,
  address?: string | null,
  contact?: string | null,
  notes?: string | null
): DBLocation {
  const locations = getLocalLocations();
  const newLocation: DBLocation = {
    id: crypto.randomUUID(),
    client_id: clientId,
    name,
    room,
    address: address || null,
    contact: contact || null,
    notes: notes || null,
    created_at: new Date().toISOString()
  };
  locations.push(newLocation);
  localStorage.setItem(LOCATIONS_KEY, JSON.stringify(locations));
  return newLocation;
}

export function getLocalEquipments(): DBEquipment[] {
  if (!isBrowser()) return initialEquipments;
  const raw = localStorage.getItem(EQUIPMENTS_KEY);
  if (!raw) {
    localStorage.setItem(EQUIPMENTS_KEY, JSON.stringify(initialEquipments));
    return initialEquipments;
  }
  return JSON.parse(raw);
}

export function saveLocalEquipment(data: Omit<DBEquipment, 'id'>): DBEquipment {
  const equipments = getLocalEquipments();
  const newEquipment: DBEquipment = {
    ...data,
    id: crypto.randomUUID(),
    created_at: new Date().toISOString()
  };
  equipments.push(newEquipment);
  localStorage.setItem(EQUIPMENTS_KEY, JSON.stringify(equipments));
  return newEquipment;
}

export function getLocalWorkOrders(): DBWorkOrder[] {
  if (!isBrowser()) return initialWorkOrders;
  const raw = localStorage.getItem(WORK_ORDERS_KEY);
  if (!raw) {
    localStorage.setItem(WORK_ORDERS_KEY, JSON.stringify(initialWorkOrders));
    return initialWorkOrders;
  }
  return JSON.parse(raw);
}

export function saveLocalWorkOrder(data: Omit<DBWorkOrder, 'id'>): DBWorkOrder {
  const workOrders = getLocalWorkOrders();
  const newWorkOrder: DBWorkOrder = {
    ...data,
    id: crypto.randomUUID(),
    created_at: new Date().toISOString()
  };
  workOrders.push(newWorkOrder);
  localStorage.setItem(WORK_ORDERS_KEY, JSON.stringify(workOrders));
  return newWorkOrder;
}
