import { supabase } from "@/lib/supabaseClient"
import { SolicitacaoManutencao } from "@/types/database.types"

export async function listarManutencoes(imobiliaria_id: string) {
  const { data, error } = await supabase
    .from("solicitacoes_manutencao")
    .select("*")
    .eq("imobiliaria_id", imobiliaria_id)

  if (error) throw error
  return data as SolicitacaoManutencao[]
}

export async function criarManutencao(
  manutencao: Omit<SolicitacaoManutencao, "id" | "created_at">
) {
  const { data, error } = await supabase
    .from("solicitacoes_manutencao")
    .insert(manutencao)
    .select()
    .single()

  if (error) throw error
  return data as SolicitacaoManutencao
}

export async function atualizarManutencao(
  id: string,
  manutencao: Partial<SolicitacaoManutencao>
) {
  const { data, error } = await supabase
    .from("solicitacoes_manutencao")
    .update(manutencao)
    .eq("id", id)
    .select()
    .single()

  if (error) throw error
  return data as SolicitacaoManutencao
}

export async function buscarManutencao(id: string) {
  const { data, error } = await supabase
    .from("solicitacoes_manutencao")
    .select("*")
    .eq("id", id)
    .single()

  if (error) throw error
  return data as SolicitacaoManutencao
}