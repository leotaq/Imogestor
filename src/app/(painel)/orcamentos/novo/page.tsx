"use client"

import { useSearchParams } from "next/navigation"
import OrcamentoForm from "@/components/forms/OrcamentoForm"

export default function NovoOrcamentoPage() {
  const searchParams = useSearchParams()
  const solicitacaoId = searchParams.get("solicitacaoId") ?? ""

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Novo orcamento</h1>
        <p className="mt-2 text-sm text-gray-500">
          Este cadastro depende de uma solicitacao ja existente em manutencoes. Selecione a
          solicitacao para vincular o orcamento corretamente.
        </p>
      </div>
      <OrcamentoForm initialSolicitacaoId={solicitacaoId} />
    </div>
  )
}
