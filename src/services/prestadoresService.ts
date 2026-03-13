import { supabase } from "@/lib/supabaseClient"
import { Prestador } from "@/types/database.types"

export async function listarPrestadores(imobiliaria_id: string) {
  const { data, error } = await supabase
    .from("prestadores")
    .select("*")
    .eq("imobiliaria_id", imobiliaria_id)

  if (error) throw error
  return data as Prestador[]
}

export async function criarPrestador(prestador: Omit<Prestador, "id" | "created_at">) {
  const { data, error } = await supabase
    .from("prestadores")
    .insert(prestador)
    .select()
    .single()

  if (error) throw error
  return data as Prestador
}

export async function atualizarPrestador(id: string, prestador: Partial<Prestador>) {
  const { data, error } = await supabase
    .from("prestadores")
    .update(prestador)
    .eq("id", id)
    .select()
    .single()

  if (error) throw error
  return data as Prestador
}
