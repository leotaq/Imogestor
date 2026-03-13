import { supabase } from "@/lib/supabaseClient"
import { Vistoria } from "@/types/database.types"

export async function listarVistorias() {
  const { data, error } = await supabase.from("vistorias").select("*")
  if (error) throw error
  return data as Vistoria[]
}

export async function criarVistoria(vistoria: Omit<Vistoria, "id">) {
  const { data, error } = await supabase
    .from("vistorias")
    .insert(vistoria)
    .select()
    .single()

  if (error) throw error
  return data as Vistoria
}

export async function atualizarVistoria(id: string, vistoria: Partial<Vistoria>) {
  const { data, error } = await supabase
    .from("vistorias")
    .update(vistoria)
    .eq("id", id)
    .select()
    .single()

  if (error) throw error
  return data as Vistoria
}
