-- ============================================================
-- ImobiGestor — Schema unificado (banco novo / limpo)
-- Baseado no Vistorias_imob (produção) + módulos SaaS multi-tenant
-- Execute uma única vez no SQL Editor do Supabase.
-- ============================================================

-- Extensions
create extension if not exists "pgcrypto";
create extension if not exists "btree_gist";

-- ============================================================
-- ENUMS
-- ============================================================

do $$ begin
  create type inspection_type as enum (
    'ocupacao', 'desocupacao', 'revistoria', 'visita', 'placa_fotos'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type inspection_status as enum (
    'new', 'received', 'in_progress', 'completed',
    'awaiting_contract', 'finalized', 'canceled'
  );
exception when duplicate_object then null;
end $$;

-- ============================================================
-- TABELAS SaaS (português)
-- ============================================================

create table if not exists imobiliarias (
  id         uuid primary key default gen_random_uuid(),
  nome       text not null,
  plano      text not null default 'basico',
  created_at timestamptz not null default now()
);

create table if not exists usuarios (
  id              uuid primary key default gen_random_uuid(),
  imobiliaria_id  uuid not null references imobiliarias(id),
  nome            text not null,
  email           text not null unique,
  username        text not null unique,
  tipo            text not null,
  ativo           boolean not null default true,
  created_at      timestamptz not null default now(),
  constraint usuarios_tipo_check check (tipo in ('admin', 'gestor', 'atendente', 'prestador'))
);

-- ============================================================
-- TABELAS DE VISTORIAS (inglês — do Vistorias_imob, com imobiliaria_id)
-- ============================================================

create table if not exists people (
  id              uuid primary key default gen_random_uuid(),
  imobiliaria_id  uuid not null references imobiliarias(id),
  name            text not null,
  phone           text null,
  role            text not null,
  active          boolean not null default true,
  created_at      timestamptz not null default now(),
  constraint people_role_check check (role in ('manager', 'inspector', 'attendant')),
  constraint people_phone_check check (phone is null or phone ~ '^[+]?[0-9]{10,15}$')
);

create table if not exists properties (
  id                    uuid primary key default gen_random_uuid(),
  imobiliaria_id        uuid not null references imobiliarias(id),
  code                  text not null,
  code_normalized       text not null,
  address               text not null,
  property_street       text null,
  property_number       text null,
  property_complement   text null,
  property_neighborhood text null,
  property_city         text null,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  constraint properties_code_normalized_unique unique (imobiliaria_id, code_normalized)
);

create table if not exists inspections (
  id                    uuid primary key default gen_random_uuid(),
  imobiliaria_id        uuid not null references imobiliarias(id),
  created_at            timestamptz not null default now(),
  created_by            uuid not null,
  assigned_to           uuid not null,
  type                  inspection_type not null,
  status                inspection_status not null default 'new',
  property_code         text not null,
  property_address      text not null,
  property_street       text null,
  property_number       text null,
  property_complement   text null,
  property_neighborhood text null,
  property_city         text null,
  contract_date         timestamptz null,
  notes                 text null,
  scheduled_start       timestamptz null,
  duration_minutes      int null,
  scheduled_end         timestamptz null,
  received_at           timestamptz null,
  completed_at          timestamptz null,
  updated_at            timestamptz not null default now(),

  constraint inspections_created_by_fkey  foreign key (created_by)  references people(id),
  constraint inspections_assigned_to_fkey foreign key (assigned_to) references people(id),

  constraint inspections_schedule_valid check (
    (
      scheduled_start is null
      and scheduled_end is null
      and duration_minutes is null
    ) or (
      scheduled_start is not null
      and scheduled_end is not null
      and duration_minutes is not null
      and duration_minutes > 0
      and scheduled_end > scheduled_start
    )
  )
);

create table if not exists inspection_status_events (
  id            uuid primary key default gen_random_uuid(),
  inspection_id uuid not null references inspections(id) on delete cascade,
  from_status   inspection_status null,
  to_status     inspection_status not null,
  changed_at    timestamptz not null default now(),
  changed_by    uuid null references people(id)
);

create table if not exists work_schedules (
  person_id       uuid primary key references people(id) on delete cascade,
  work_start      smallint not null default 8,
  work_start_min  smallint not null default 0,
  lunch_start     smallint not null default 12,
  lunch_start_min smallint not null default 0,
  lunch_end       smallint not null default 13,
  lunch_end_min   smallint not null default 0,
  work_end        smallint not null default 18,
  work_end_min    smallint not null default 0,
  updated_at      timestamptz not null default now()
);

-- RLS para work_schedules
alter table work_schedules enable row level security;
create policy "service role full access" on work_schedules
  using (true)
  with check (true);

-- ============================================================
-- TABELAS DE MANUTENÇÃO (português — ImobiGestor)
-- ============================================================

create table if not exists imoveis (
  id              uuid primary key default gen_random_uuid(),
  imobiliaria_id  uuid not null references imobiliarias(id),
  codigo          text not null,
  endereco        text not null,
  cidade          text null,
  bairro          text null,
  numero          text null,
  complemento     text null,
  proprietario          text null,
  proprietario_telefone text null,
  proprietario_email    text null,
  created_at            timestamptz not null default now()
);

alter table imoveis
  add column if not exists complemento text null;

create table if not exists solicitacoes_manutencao (
  id                uuid primary key default gen_random_uuid(),
  imobiliaria_id    uuid not null references imobiliarias(id),
  imovel_id         uuid not null references imoveis(id),
  solicitante_tipo  text not null,
  nome_solicitante  text not null,
  telefone          text null,
  tipo_manutencao   text not null,
  descricao         text not null,
  prazo             date null,
  status            text not null default 'aberta',
  created_at        timestamptz not null default now()
);

create table if not exists prestadores (
  id              uuid primary key default gen_random_uuid(),
  imobiliaria_id  uuid not null references imobiliarias(id),
  nome            text not null,
  telefone        text null,
  especialidade   text null,
  faturamento_tipo text null,
  metodo_recebimento text null,
  dia_recebimento text null,
  dados_recebimento text null,
  constraint prestadores_faturamento_tipo_check check (
    faturamento_tipo is null or faturamento_tipo in ('nota_fiscal', 'recibo')
  ),
  constraint prestadores_metodo_recebimento_check check (
    metodo_recebimento is null or metodo_recebimento in ('pix', 'dinheiro', 'deposito')
  ),
  constraint prestadores_dia_recebimento_check check (
    dia_recebimento is null or dia_recebimento in ('segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado', 'domingo')
  ),
  created_at      timestamptz not null default now()
);

alter table prestadores
  add column if not exists faturamento_tipo text null,
  add column if not exists metodo_recebimento text null,
  add column if not exists dia_recebimento text null,
  add column if not exists dados_recebimento text null;

do $$ begin
  alter table prestadores
    add constraint prestadores_faturamento_tipo_check
    check (faturamento_tipo is null or faturamento_tipo in ('nota_fiscal', 'recibo'));
exception
  when duplicate_object then null;
end $$;

do $$ begin
  alter table prestadores
    add constraint prestadores_metodo_recebimento_check
    check (metodo_recebimento is null or metodo_recebimento in ('pix', 'dinheiro', 'deposito'));
exception
  when duplicate_object then null;
end $$;

do $$ begin
  alter table prestadores
    add constraint prestadores_dia_recebimento_check
    check (dia_recebimento is null or dia_recebimento in ('segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado', 'domingo'));
exception
  when duplicate_object then null;
end $$;

create table if not exists orcamentos (
  id              uuid primary key default gen_random_uuid(),
  imobiliaria_id  uuid not null references imobiliarias(id),
  solicitacao_id  uuid not null references solicitacoes_manutencao(id),
  prestador_id    uuid not null references prestadores(id),
  valor           numeric(12,2) not null default 0,
  descricao       text null,
  status          text not null default 'pendente',
  created_at      timestamptz not null default now()
);

create table if not exists execucao (
  id              uuid primary key default gen_random_uuid(),
  imobiliaria_id  uuid not null references imobiliarias(id),
  orcamento_id    uuid not null references orcamentos(id),
  data_inicio     timestamptz null,
  data_fim        timestamptz null,
  status          text not null default 'pendente',
  observacoes     text null,
  created_at      timestamptz not null default now()
);

create table if not exists financeiro (
  id                    uuid primary key default gen_random_uuid(),
  imobiliaria_id        uuid not null references imobiliarias(id),
  execucao_id           uuid not null references execucao(id),
  valor_total           numeric(12,2) not null default 0,
  taxa_administrativa   numeric(12,2) not null default 0,
  data_registro         timestamptz not null default now()
);

-- ============================================================
-- FUNCTION + TRIGGERS
-- ============================================================

create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_inspections_updated_at on inspections;
create trigger trg_inspections_updated_at
before update on inspections
for each row execute function set_updated_at();

drop trigger if exists trg_properties_updated_at on properties;
create trigger trg_properties_updated_at
before update on properties
for each row execute function set_updated_at();

-- ============================================================
-- INDEXES
-- ============================================================

-- Properties
create unique index if not exists properties_imob_code_idx
  on properties (imobiliaria_id, code_normalized);

-- Inspections
create index if not exists inspections_imob_status_idx
  on inspections (imobiliaria_id, status);
create index if not exists inspections_imob_assigned_idx
  on inspections (imobiliaria_id, assigned_to, scheduled_start);
create index if not exists inspections_created_at_idx
  on inspections (created_at);
create index if not exists inspections_metrics_idx
  on inspections (imobiliaria_id, created_at, type, status, property_city, created_by, assigned_to);

-- Inspection Status Events
create index if not exists inspection_status_events_metrics_idx
  on inspection_status_events (changed_at, to_status, inspection_id);

-- Imoveis (manutenção)
create index if not exists imoveis_imob_idx
  on imoveis (imobiliaria_id);

-- Solicitações
create index if not exists solicitacoes_imob_status_idx
  on solicitacoes_manutencao (imobiliaria_id, status);

-- ============================================================
-- EXCLUSION CONSTRAINT (bloqueio de conflito de horário)
-- ============================================================

do $$ begin
  alter table inspections
    add constraint inspections_no_overlap_per_inspector
    exclude using gist (
      imobiliaria_id with =,
      assigned_to with =,
      tstzrange(scheduled_start, scheduled_end, '[)') with &&
    )
    where (
      status <> 'canceled'
      and scheduled_start is not null
      and scheduled_end is not null
    );
exception
  when duplicate_object then null;
end $$;
