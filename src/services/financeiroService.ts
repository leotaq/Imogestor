import { supabase } from "@/lib/supabaseClient"
import { Financeiro } from "@/types/database.types"

export async function listarFinanceiro(imobiliaria_id: string) {
  const { data, error } = await supabase
    .from("financeiro")
    .select("*")
    .eq("imobiliaria_id", imobiliaria_id)

  if (error) throw error
  return data as Financeiro[]
}

export async function criarRegistroFinanceiro(
  registro: Omit<Financeiro, "id">
) {
  const { data, error } = await supabase
    .from("financeiro")
    .insert(registro)
    .select()
    .single()

  if (error) throw error
  return data as Financeiro
}
