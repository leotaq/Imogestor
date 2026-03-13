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
  tipo: string
  created_at: string
}

export interface Imovel {
  id: string
  imobiliaria_id: string
  codigo: string
  endereco: string
  cidade: string
  bairro: string
  numero: string
  proprietario: string
}

export interface Vistoria {
  id: string
  imovel_id: string
  tipo_vistoria: string
  data_solicitacao: string
  data_execucao: string | null
  status: string
}

export interface SolicitacaoManutencao {
  id: string
  imovel_id: string
  solicitante_tipo: string
  nome_solicitante: string
  telefone: string
  tipo_manutencao: string
  descricao: string
  prazo: string
  status: string
}

export interface Prestador {
  id: string
  imobiliaria_id: string
  nome: string
  telefone: string
  especialidade: string
  created_at: string
}

export interface Orcamento {
  id: string
  solicitacao_id: string
  prestador_id: string
  valor: number
  descricao: string
  status: string
  created_at: string
}

export interface Execucao {
  id: string
  orcamento_id: string
  data_inicio: string
  data_fim: string | null
  status: string
  observacoes: string
}

export interface Financeiro {
  id: string
  imobiliaria_id: string
  execucao_id: string
  valor_total: number
  taxa_administrativa: number
  data_registro: string
}
