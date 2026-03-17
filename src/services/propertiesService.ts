import { supabase } from "@/lib/supabaseClient"
import { Property } from "@/types/database.types"
import { normalizePropertyCode } from "@/lib/property"

export async function listarProperties(imobiliaria_id: string) {
  const { data, error } = await supabase
    .from("properties")
    .select("*")
    .eq("imobiliaria_id", imobiliaria_id)
    .order("code")

  if (error) throw error
  return data as Property[]
}

export async function buscarPropertyPorCodigo(
  imobiliaria_id: string,
  code: string
) {
  const normalized = normalizePropertyCode(code)
  const { data, error } = await supabase
    .from("properties")
    .select("*")
    .eq("imobiliaria_id", imobiliaria_id)
    .eq("code_normalized", normalized)
    .single()

  if (error && error.code !== "PGRST116") throw error
  return (data as Property) ?? null
}

export async function upsertProperty(
  property: Omit<Property, "id" | "created_at" | "updated_at" | "code_normalized">
) {
  const code_normalized = normalizePropertyCode(property.code)

  const { data, error } = await supabase
    .from("properties")
    .upsert(
      { ...property, code_normalized },
      { onConflict: "imobiliaria_id,code_normalized" }
    )
    .select()
    .single()

  if (error) throw error
  return data as Property
}

export async function criarProperty(
  property: Omit<Property, "id" | "created_at" | "updated_at" | "code_normalized">
) {
  const code_normalized = normalizePropertyCode(property.code)

  const { data, error } = await supabase
    .from("properties")
    .insert({ ...property, code_normalized })
    .select()
    .single()

  if (error) throw error
  return data as Property
}
