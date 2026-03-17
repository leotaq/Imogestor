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
    <div>
      <h1 className="text-2xl font-bold mb-6">Nova Solicitação de Manutenção</h1>
      <ManutencaoForm onSubmit={handleSubmit} />
    </div>
  )
}
