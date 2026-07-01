-- Habilitar a extensão pgcrypto para geração de UUID se necessário
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Tabela de Clientes (Clínicas)
CREATE TABLE IF NOT EXISTS clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Tabela de Unidades / Locais (Locations)
CREATE TABLE IF NOT EXISTS locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    name TEXT NOT NULL, -- Ex: "Centro Unit", "Barra Unit", "Annex B"
    room TEXT,          -- Ex: "Operatory 1", "Sterilization Center"
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Tabela de Equipamentos (Equipments)
CREATE TABLE IF NOT EXISTS equipments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT NOT NULL UNIQUE, -- Ex: "CD001", "COMP-402", "STER-105"
    name TEXT NOT NULL, -- Ex: "Cadeira Gnatus G3", "Compressor Lubrification"
    location_id UUID REFERENCES locations(id) ON DELETE SET NULL,
    serial_number TEXT,
    installation_date DATE,
    manufacturer TEXT,
    warranty_until DATE,
    status TEXT NOT NULL DEFAULT 'Ativo', -- Ex: "Ativo", "Pendente", "Inativo"
    next_service_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Tabela de Ordens de Serviço (Work Orders)
CREATE TABLE IF NOT EXISTS work_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT NOT NULL UNIQUE, -- Ex: "#AC-2023-091", "#CH-2021-442"
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    equipment_id UUID REFERENCES equipments(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'ABERTA', -- Ex: "ABERTA", "EM ANDAMENTO", "CONCLUÍDA"
    priority TEXT NOT NULL DEFAULT 'NORMAL', -- Ex: "NORMAL", "CRÍTICO"
    defect_reported TEXT NOT NULL, -- Descrição do defeito relatado (plain text string)
    service_date DATE,
    technician_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Tabela de Configurações (Settings)
CREATE TABLE IF NOT EXISTS settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT NOT NULL UNIQUE,
    value TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Inserir alguns dados de exemplo (opcional, para testes rápidos no dashboard)
INSERT INTO clients (id, name) VALUES
('b1928424-dc50-4ff6-9818-d9bc7bf8bf21', 'Clínica Sorriso'),
('d5a2c4e2-6b9e-4a6c-9c69-80ffee14a3c7', 'OdontoMaster'),
('e3d1e307-00c6-4519-a64b-a18209c46ee2', 'Clinica OdontoVida')
ON CONFLICT (id) DO NOTHING;

INSERT INTO locations (id, client_id, name, room) VALUES
('c01a600b-34f1-e111-92b7-082fd26699b6', 'b1928424-dc50-4ff6-9818-d9bc7bf8bf21', 'Centro Unit', 'Operatory 1'),
('d2718a78-31b0-41c6-a319-3fbe86dbac15', 'b1928424-dc50-4ff6-9818-d9bc7bf8bf21', 'Centro Unit', 'Operatory 2'),
('fd983088-bad1-001f-2a26-3235ffb77a6c', 'b1928424-dc50-4ff6-9818-d9bc7bf8bf21', 'Barra Unit', 'Main Operatory'),
('234f3b23-4f3b-4114-b5f8-8bad1001f2a2', 'd5a2c4e2-6b9e-4a6c-9c69-80ffee14a3c7', 'Main Clinic', 'Room 3'),
('e9f6fa1e-5030-0021-0d1e-50309ed3aa9e', 'e3d1e307-00c6-4519-a64b-a18209c46ee2', 'Centro Sorriso Infantil', 'Main Operatory')
ON CONFLICT (id) DO NOTHING;

INSERT INTO equipments (id, code, name, location_id, serial_number, installation_date, manufacturer, warranty_until, status, next_service_date) VALUES
('114b5f88-bad1-001f-2a13-4d619bcee6ff', 'CD001', 'Cadeira Gnatus G3', 'c01a600b-34f1-e111-92b7-082fd26699b6', 'GN-2023-8942A', '2023-04-12', 'Gnatus', '2025-04-12', 'Ativo', '2024-06-15'),
('e8871e88-bad1-001f-2a1e-50309ed3aa9e', 'COMP-402', 'Compressor Lubrification', 'fd983088-bad1-001f-2a26-3235ffb77a6c', 'CP-8842-X', '2024-01-10', 'Schulz', '2026-01-10', 'Pendente', '2026-07-10'),
('6b9e7888-bad1-001f-2a1e-50309ed3aa9e', 'STER-105', 'Autoclave Filter Replacement', 'e9f6fa1e-5030-0021-0d1e-50309ed3aa9e', 'ST-9912-B', '2023-08-20', 'Cristófoli', '2025-08-20', 'Pendente', '2026-08-20')
ON CONFLICT (id) DO NOTHING;

INSERT INTO work_orders (id, code, client_id, equipment_id, status, priority, defect_reported, service_date, technician_name) VALUES
('fd9830ffd-cc1d-55e1-bdff-b77affb77a6c', '#AC-2023-091', 'e3d1e307-00c6-4519-a64b-a18209c46ee2', '6b9e7888-bad1-001f-2a1e-50309ed3aa9e', 'EM ANDAMENTO', 'NORMAL', 'Falha no ciclo de secagem. Pressão não atinge o nível ideal na fase final do ciclo.', '2023-10-24', 'Ana L.'),
('ba1a1aff-dad6-000a-9300-0a93000a9300', '#CH-2021-442', 'b1928424-dc50-4ff6-9818-d9bc7bf8bf21', '114b5f88-bad1-001f-2a13-4d619bcee6ff', 'ABERTA', 'CRÍTICO', 'Vazamento de ar no pedal de comando e luz do refletor piscando intermitentemente.', '2023-10-26', 'Marcos S.'),
('1c4e2f8a-bf96-0021-0d1e-50309ed3aa9e', '#CP-2022-118', 'e3d1e307-00c6-4519-a64b-a18209c46ee2', 'e8871e88-bad1-001f-2a1e-50309ed3aa9e', 'CONCLUÍDA', 'NORMAL', 'Manutenção preventiva trimestral realizada. Troca de filtros e aferição de válvulas OK.', '2023-10-23', 'Marcos S.')
ON CONFLICT (id) DO NOTHING;
