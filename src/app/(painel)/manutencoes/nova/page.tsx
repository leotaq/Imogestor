"use client"

import { useRouter } from "next/navigation"
import ManutencaoForm from "@/components/forms/ManutencaoForm"
import { criarManutencao } from "@/services/manutencoesService"
import { SolicitacaoManutencao } from "@/types/database.types"

export default function NovaManutencaoPage() {
  const router = useRouter()

  async function handleSubmit(dados: Omit<SolicitacaoManutencao, "id" | "created_at">) {
    await criarManutencao(dados)
    router.push("/manutencoes")
  }

  return (
    <div className="space-y-6">
      <div className="max-w-3xl">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Nova solicitacao de manutencao</h1>
        <p className="mt-2 text-sm text-gray-500">
          Selecione um imovel existente ou cadastre um novo para abrir a solicitacao. Os orcamentos
          ficam vinculados a partir desta etapa.
        </p>
      </div>

      <ManutencaoForm onSubmit={handleSubmit} />
    </div>
  )
}
