import { supabase } from "@/lib/supabaseClient"
import { Person, PersonRole, TipoUsuario } from "@/types/database.types"

export function personRoleFromUsuarioTipo(tipo: TipoUsuario): PersonRole {
  if (tipo === "atendente") return "attendant"
  if (tipo === "prestador") return "inspector"
  return "manager"
}

export async function listarPeople(imobiliaria_id: string) {
  const { data, error } = await supabase
    .from("people")
    .select("*")
    .eq("imobiliaria_id", imobiliaria_id)
    .order("name")

  if (error) throw error
  return data as Person[]
}

export async function listarInspectors(imobiliaria_id: string) {
  const { data, error } = await supabase
    .from("people")
    .select("*")
    .eq("imobiliaria_id", imobiliaria_id)
    .eq("role", "inspector")
    .eq("active", true)
    .order("name")

  if (error) throw error
  return data as Person[]
}

export async function garantirPessoaOperacional(input: {
  imobiliaria_id: string
  name: string
  role: PersonRole
  phone?: string | null
}) {
  const normalizedName = input.name.trim()
  if (!normalizedName) {
    throw new Error("Nome da pessoa operacional nao informado.")
  }

  const { data, error } = await supabase
    .from("people")
    .select("*")
    .eq("imobiliaria_id", input.imobiliaria_id)
    .eq("role", input.role)
    .ilike("name", normalizedName)
    .limit(1)
    .maybeSingle()

  if (error) throw error

  if (data) {
    if (data.active) return data as Person

    return atualizarPerson(data.id, {
      active: true,
      phone: data.phone ?? input.phone ?? null,
    })
  }

  return criarPerson({
    imobiliaria_id: input.imobiliaria_id,
    name: normalizedName,
    phone: input.phone ?? null,
    role: input.role,
    active: true,
  })
}

export async function buscarPerson(id: string) {
  const { data, error } = await supabase
    .from("people")
    .select("*")
    .eq("id", id)
    .single()

  if (error) throw error
  return data as Person
}

export async function criarPerson(person: Omit<Person, "id" | "created_at">) {
  const { data, error } = await supabase
    .from("people")
    .insert(person)
    .select()
    .single()

  if (error) throw error
  return data as Person
}

export async function atualizarPerson(id: string, person: Partial<Person>) {
  const { data, error } = await supabase
    .from("people")
    .update(person)
    .eq("id", id)
    .select()
    .single()

  if (error) throw error
  return data as Person
}

export async function desativarPerson(id: string) {
  return atualizarPerson(id, { active: false })
}
