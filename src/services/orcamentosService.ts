import { supabase } from "@/lib/supabaseClient"
import { Orcamento } from "@/types/database.types"

export async function listarOrcamentos(imobiliariaId: string) {
  const { data, error } = await supabase.from("orcamentos").select("*").eq("imobiliaria_id", imobiliariaId)
  if (error) throw error
  return data as Orcamento[]
}

export async function criarOrcamento(orcamento: Omit<Orcamento, "id" | "created_at">) {
  const { data, error } = await supabase
    .from("orcamentos")
    .insert(orcamento)
    .select()
    .single()

  if (error) throw error
  return data as Orcamento
}

export async function atualizarOrcamento(id: string, orcamento: Partial<Orcamento>) {
  const { data, error } = await supabase
    .from("orcamentos")
    .update(orcamento)
    .eq("id", id)
    .select()
    .single()

  if (error) throw error
  return data as Orcamento
}
