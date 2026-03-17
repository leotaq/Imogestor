// ============================================================
// Enums
// ============================================================

export type InspectionType =
  | "ocupacao"
  | "desocupacao"
  | "revistoria"
  | "visita"
  | "placa_fotos"

export type InspectionStatus =
  | "new"
  | "received"
  | "in_progress"
  | "completed"
  | "awaiting_contract"
  | "finalized"
  | "canceled"

export type PersonRole = "manager" | "inspector" | "attendant"

export type TipoUsuario = "admin" | "gestor" | "atendente" | "prestador"

// ============================================================
// Tabelas SaaS (português)
// ============================================================

export interface Imobiliaria {
  id: string
  nome: string
  plano: string
  created_at: string
}

export interface Usuario {
  id: string
  imobiliaria_id: string
  nome: string
  email: string
  username: string
  tipo: TipoUsuario
  ativo: boolean
  created_at: string
}

// ============================================================
// Tabelas de Vistorias (inglês — do Vistorias_imob)
// ============================================================

export interface Person {
  id: string
  imobiliaria_id: string
  name: string
  phone: string | null
  role: PersonRole
  active: boolean
  created_at: string
}

export interface Property {
  id: string
  imobiliaria_id: string
  code: string
  code_normalized: string
  address: string
  property_street: string | null
  property_number: string | null
  property_complement: string | null
  property_neighborhood: string | null
  property_city: string | null
  created_at: string
  updated_at: string
}

export interface Inspection {
  id: string
  imobiliaria_id: string
  created_at: string
  created_by: string
  assigned_to: string
  type: InspectionType
  status: InspectionStatus
  property_code: string
  property_address: string
  property_street: string | null
  property_number: string | null
  property_complement: string | null
  property_neighborhood: string | null
  property_city: string | null
  contract_date: string | null
  notes: string | null
  scheduled_start: string | null
  duration_minutes: number | null
  scheduled_end: string | null
  received_at: string | null
  completed_at: string | null
  updated_at: string
}

export interface InspectionStatusEvent {
  id: string
  inspection_id: string
  from_status: InspectionStatus | null
  to_status: InspectionStatus
  changed_at: string
  changed_by: string | null
}

export interface WorkSchedule {
  person_id: string
  work_start: number
  work_start_min: number
  lunch_start: number
  lunch_start_min: number
  lunch_end: number
  lunch_end_min: number
  work_end: number
  work_end_min: number
  updated_at: string
}

// ============================================================
// Tabelas de Manutenção (português)
// ============================================================

export interface Imovel {
  id: string
  imobiliaria_id: string
  codigo: string
  endereco: string
  cidade: string | null
  bairro: string | null
  numero: string | null
  complemento: string | null
  proprietario: string | null
  proprietario_telefone: string | null
  proprietario_email: string | null
  created_at: string
}

export interface SolicitacaoManutencao {
  id: string
  imobiliaria_id: string
  imovel_id: string
  solicitante_tipo: string
  nome_solicitante: string
  telefone: string | null
  tipo_manutencao: string
  descricao: string
  prazo: string | null
  status: string
  created_at: string
}

export interface Prestador {
  id: string
  imobiliaria_id: string
  nome: string
  telefone: string | null
  especialidade: string | null
  created_at: string
}

export interface Orcamento {
  id: string
  imobiliaria_id: string
  solicitacao_id: string
  prestador_id: string
  valor: number
  descricao: string | null
  status: string
  created_at: string
}

export interface Execucao {
  id: string
  imobiliaria_id: string
  orcamento_id: string
  data_inicio: string | null
  data_fim: string | null
  status: string
  observacoes: string | null
  created_at: string
}

export interface Financeiro {
  id: string
  imobiliaria_id: string
  execucao_id: string
  valor_total: number
  taxa_administrativa: number
  data_registro: string
}
