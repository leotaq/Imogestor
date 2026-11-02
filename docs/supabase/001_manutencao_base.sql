-- APLICADO em 19/10/2026 (America/Sao_Paulo). NAO REAPLICAR.
-- Versao registrada: 20261020022640_gestor_manutencao_base_privada.
-- SQL original executado e seu hash preservados em 001_manutencao_base.executado.sql.
-- Testar em copia e conferir 000_preflight.sql antes de executar.
-- Nenhuma tabela existente e referenciada por FK ou alterada.
-- Schema fechado: integracao/autorizacao do backend e uma etapa posterior.
BEGIN;
SET LOCAL lock_timeout = '3s';
SET LOCAL statement_timeout = '30s';

-- Falhar se ja existir; nao assumir propriedade de um schema encontrado.
CREATE SCHEMA gestor_manutencao;
REVOKE ALL ON SCHEMA gestor_manutencao FROM PUBLIC, anon, authenticated, service_role;

CREATE TABLE gestor_manutencao.organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL CHECK (length(btrim(name)) BETWEEN 1 AND 200),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE gestor_manutencao.requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES gestor_manutencao.organizations(id),
  protocol bigint GENERATED ALWAYS AS IDENTITY,
  source text NOT NULL CHECK (source IN ('internal', 'tenant_portal', 'inspection')),
  status text NOT NULL DEFAULT 'new' CHECK (status IN
    ('new','triage','awaiting_information','awaiting_quote','awaiting_approval',
     'scheduled','in_progress','awaiting_acceptance','resolved','cancelled')),
  priority text NOT NULL DEFAULT 'normal' CHECK (priority IN ('low','normal','high','urgent')),
  category text NOT NULL CHECK (length(btrim(category)) BETWEEN 1 AND 100),
  description text NOT NULL CHECK (length(btrim(description)) BETWEEN 1 AND 10000),
  leaseholder_name_declared text NOT NULL CHECK (length(btrim(leaseholder_name_declared)) BETWEEN 1 AND 200),
  requester_name text NOT NULL CHECK (length(btrim(requester_name)) BETWEEN 1 AND 200),
  contact_phone text CHECK (length(contact_phone) <= 40),
  contact_email text CHECK (length(contact_email) <= 254),
  street text NOT NULL CHECK (length(btrim(street)) BETWEEN 1 AND 250),
  number text NOT NULL CHECK (length(btrim(number)) BETWEEN 1 AND 30),
  complement text CHECK (length(complement) <= 200),
  neighborhood text NOT NULL CHECK (length(btrim(neighborhood)) BETWEEN 1 AND 150),
  city text NOT NULL CHECK (length(btrim(city)) BETWEEN 1 AND 150),
  state_code text NOT NULL CHECK (state_code ~ '^[A-Z]{2}$'),
  postal_code text NOT NULL CHECK (postal_code ~ '^[0-9]{8}$'),
  -- Referencia logica, propositalmente SEM FK para public.properties.
  property_id uuid,
  property_code_snapshot text,
  property_address_snapshot text,
  property_link_status text NOT NULL DEFAULT 'pending' CHECK (property_link_status IN ('pending','confirmed','unmatched')),
  -- Referencias externas nao sao identidade autenticada. Validar no backend.
  assigned_team_ref uuid,
  origin_inspection_ref uuid,
  due_at timestamptz,
  revision integer NOT NULL DEFAULT 1 CHECK (revision > 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, id),
  UNIQUE (organization_id, protocol),
  CHECK (coalesce(length(btrim(contact_phone)),0) > 0 OR coalesce(length(btrim(contact_email)),0) > 0),
  CHECK (property_link_status <> 'confirmed' OR property_id IS NOT NULL)
);

CREATE TABLE gestor_manutencao.request_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  request_id uuid NOT NULL,
  event_type text NOT NULL CHECK (length(btrim(event_type)) BETWEEN 1 AND 100),
  actor_ref text NOT NULL CHECK (length(btrim(actor_ref)) BETWEEN 1 AND 200),
  visibility text NOT NULL DEFAULT 'internal' CHECK (visibility IN ('internal','requester')),
  message text NOT NULL CHECK (length(btrim(message)) BETWEEN 1 AND 10000),
  created_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (organization_id, request_id)
    REFERENCES gestor_manutencao.requests(organization_id, id)
);

CREATE TABLE gestor_manutencao.request_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  request_id uuid NOT NULL,
  object_key text NOT NULL UNIQUE CHECK (length(btrim(object_key)) BETWEEN 1 AND 1000),
  original_name text NOT NULL CHECK (length(btrim(original_name)) BETWEEN 1 AND 250),
  media_type text NOT NULL CHECK (length(btrim(media_type)) BETWEEN 1 AND 150),
  byte_size bigint NOT NULL CHECK (byte_size > 0 AND byte_size <= 10485760),
  sha256 text NOT NULL CHECK (sha256 ~ '^[0-9a-f]{64}$'),
  visibility text NOT NULL DEFAULT 'internal' CHECK (visibility IN ('internal','requester')),
  uploaded_by_ref text NOT NULL CHECK (length(btrim(uploaded_by_ref)) BETWEEN 1 AND 200),
  created_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (organization_id, request_id)
    REFERENCES gestor_manutencao.requests(organization_id, id)
);

CREATE INDEX requests_queue_idx ON gestor_manutencao.requests (organization_id, status, created_at DESC);
CREATE INDEX requests_property_idx ON gestor_manutencao.requests (organization_id, property_id);
CREATE INDEX request_events_timeline_idx ON gestor_manutencao.request_events (organization_id, request_id, created_at, id);
CREATE INDEX request_attachments_request_idx ON gestor_manutencao.request_attachments (organization_id, request_id);

ALTER TABLE gestor_manutencao.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE gestor_manutencao.requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE gestor_manutencao.request_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE gestor_manutencao.request_attachments ENABLE ROW LEVEL SECURITY;
-- Revogacoes restritas ao schema que esta transacao acabou de criar.
REVOKE ALL ON ALL TABLES IN SCHEMA gestor_manutencao FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA gestor_manutencao FROM PUBLIC, anon, authenticated, service_role;
-- Sem policies, grants, RPC, buckets, usuarios ou insercao de dados nesta fase.
COMMIT;
