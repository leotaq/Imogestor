import { supabase } from "@/lib/supabaseClient"
import { Imovel } from "@/types/database.types"

export async function listarImoveis(imobiliaria_id: string) {
  const { data, error } = await supabase
    .from("imoveis")
    .select("*")
    .eq("imobiliaria_id", imobiliaria_id)

  if (error) throw error
  return data as Imovel[]
}

export async function buscarImovel(id: string) {
  const { data, error } = await supabase
    .from("imoveis")
    .select("*")
    .eq("id", id)
    .single()

  if (error) throw error
  return data as Imovel
}

export async function criarImovel(imovel: Omit<Imovel, "id" | "created_at">) {
  const { data, error } = await supabase
    .from("imoveis")
    .insert(imovel)
    .select()
    .single()

  if (error) throw error
  return data as Imovel
}

export async function atualizarImovel(id: string, imovel: Partial<Imovel>) {
  const { data, error } = await supabase
    .from("imoveis")
    .update(imovel)
    .eq("id", id)
    .select()
    .single()

  if (error) throw error
  return data as Imovel
}

export async function excluirImovel(id: string) {
  const { error } = await supabase.from("imoveis").delete().eq("id", id)
  if (error) throw error
}
