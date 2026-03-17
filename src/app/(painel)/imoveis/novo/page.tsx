"use client"

import { useRouter } from "next/navigation"
import ImovelForm from "@/components/forms/ImovelForm"
import { criarImovel } from "@/services/imoveisService"
import { Imovel } from "@/types/database.types"
import { useImobiliaria } from "@/lib/useImobiliaria"

export default function NovoImovelPage() {
  const router = useRouter()
  const { imobiliariaId, loading } = useImobiliaria()

  async function handleSubmit(dados: Omit<Imovel, "id" | "created_at">) {
    await criarImovel({ ...dados, imobiliaria_id: imobiliariaId! })
    router.push("/imoveis")
  }

  if (loading) return <p className="text-gray-500">Carregando...</p>

  if (!imobiliariaId) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm">
        Nao foi possivel identificar sua imobiliaria. Verifique se seu email esta cadastrado na tabela <strong>usuarios</strong>.
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="max-w-3xl">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Novo imovel</h1>
        <p className="mt-2 text-sm text-gray-500">
          Cadastre o imovel com os dados de endereco e contato do proprietario para facilitar o acompanhamento.
        </p>
      </div>

      <ImovelForm onSubmit={handleSubmit} />
    </div>
  )
}
