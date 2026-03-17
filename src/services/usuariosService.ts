import { supabase } from "@/lib/supabaseClient"
import { Usuario } from "@/types/database.types"

export async function listarUsuarios(imobiliariaId: string) {
  const { data, error } = await supabase
    .from("usuarios")
    .select("*")
    .eq("imobiliaria_id", imobiliariaId)
    .order("nome")

  if (error) throw error
  return (data ?? []) as Usuario[]
}

export async function criarUsuario(
  usuario: Omit<Usuario, "id" | "created_at"> & { senha: string }
) {
  const res = await fetch("/api/usuarios", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(usuario),
  })

  const data = await res.json()
  if (!res.ok) throw new Error(data.error || "Erro ao criar usuário")
  return data as Usuario
}

export async function resetarSenha(email: string, novaSenha: string) {
  const res = await fetch("/api/usuarios/reset-senha", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, novaSenha }),
  })

  const data = await res.json()
  if (!res.ok) throw new Error(data.error || "Erro ao resetar senha")
}

export async function atualizarUsuario(
  id: string,
  dados: Partial<Usuario>
) {
  const { error } = await supabase
    .from("usuarios")
    .update(dados)
    .eq("id", id)

  if (error) throw error
}

export async function desativarUsuario(id: string) {
  const { error } = await supabase
    .from("usuarios")
    .update({ ativo: false })
    .eq("id", id)

  if (error) throw error
}
