"use client"

import { useRouter } from "next/navigation"
import { useUsuario } from "@/lib/useUsuario"
import { criarUsuario } from "@/services/usuariosService"
import { Usuario } from "@/types/database.types"
import UsuarioForm from "@/components/forms/UsuarioForm"

export default function NovoUsuarioPage() {
  const router = useRouter()
  const { imobiliariaId, loading } = useUsuario()

  async function handleSubmit(dados: Omit<Usuario, "id" | "created_at"> & { senha: string }) {
    await criarUsuario(dados)
    router.push("/usuarios")
  }

  if (loading) return <p className="text-gray-500">Carregando...</p>

  if (!imobiliariaId) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm">
        Não foi possível identificar sua imobiliária.
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Novo Usuário</h1>
      <UsuarioForm onSubmit={handleSubmit} imobiliariaId={imobiliariaId} />
    </div>
  )
}
