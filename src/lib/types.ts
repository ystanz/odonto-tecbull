export interface DBClient {
  id: string;
  name: string;
  responsible_name?: string | null;
  phone?: string | null;
  email?: string | null;
  created_at?: string;
}

export interface DBLocation {
  id: string;
  client_id: string;
  name: string;
  room: string | null;
  address?: string | null;
  contact?: string | null;
  notes?: string | null;
  created_at?: string;
  clients?: DBClient; // Para joins do Supabase
}

export interface DBEquipment {
  id: string;
  name: string;
  location_id?: string | null;
  serial_number: string | null;
  installation_date: string | null;
  manufacturer: string | null;
  status: string; // 'Ativo' | 'Pendente' | 'Inativo' etc
  next_service_date: string | null;
  image_data?: string | null;
  created_at?: string;
  locations?: DBLocation; // Para joins do Supabase
}

export interface DBWorkOrder {
  id: string;
  code: string;
  client_id: string;
  equipment_id: string;
  status: 'ABERTA' | 'EM ANDAMENTO' | 'CONCLUÍDA';
  priority: 'NORMAL' | 'CRÍTICO';
  defect_reported: string;
  parts_used?: string | null;
  work_notes?: string | null;
  image_url?: string | null;
  service_date: string | null;
  technician_name: string | null;
  created_at?: string;
  clients?: DBClient;
  equipments?: DBEquipment;
}

export interface DBWorkNote {
  id: string;
  os_id: string;
  note: string;
  created_at?: string;
}
