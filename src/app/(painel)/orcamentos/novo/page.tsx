"use client"

import { useRouter } from "next/navigation"
import OrcamentoForm from "@/components/forms/OrcamentoForm"
import { criarOrcamento } from "@/services/orcamentosService"
import { Orcamento } from "@/types/database.types"

export default function NovoOrcamentoPage() {
  const router = useRouter()

  async function handleSubmit(dados: Omit<Orcamento, "id" | "created_at">) {
    await criarOrcamento(dados)
    router.push("/orcamentos")
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Novo Orçamento</h1>
      <OrcamentoForm onSubmit={handleSubmit} />
    </div>
  )
}
