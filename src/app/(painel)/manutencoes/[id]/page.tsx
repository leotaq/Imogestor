"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { buscarManutencao } from "@/services/manutencoesService"
import { SolicitacaoManutencao } from "@/types/database.types"
import Button from "@/components/ui/Button"

export default function DetalheManutencaoPage() {
  const params = useParams()
  const [manutencao, setManutencao] = useState<SolicitacaoManutencao | null>(null)

  useEffect(() => {
    const idParam = Array.isArray(params.id) ? params.id[0] : params.id
    if (!idParam) return

    async function carregar() {
      const data = await buscarManutencao(idParam)
      setManutencao(data)
    }

    void carregar()
  }, [params.id])

  if (!manutencao) return <p className="text-gray-500">Carregando...</p>

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Detalhes da manutencao</h1>
        <Link href={`/orcamentos/novo?solicitacaoId=${manutencao.id}`}>
          <Button>Criar orcamento desta solicitacao</Button>
        </Link>
      </div>

      <div className="max-w-2xl space-y-3 rounded-xl border border-gray-200 bg-white p-6">
        <div>
          <span className="text-sm text-gray-500">ID:</span>
          <p className="font-medium">{manutencao.id}</p>
        </div>
        <div>
          <span className="text-sm text-gray-500">Solicitante:</span>
          <p className="font-medium">{manutencao.nome_solicitante}</p>
        </div>
        <div>
          <span className="text-sm text-gray-500">Tipo:</span>
          <p className="font-medium">{manutencao.tipo_manutencao}</p>
        </div>
        <div>
          <span className="text-sm text-gray-500">Descricao:</span>
          <p className="font-medium">{manutencao.descricao}</p>
        </div>
        <div>
          <span className="text-sm text-gray-500">Telefone:</span>
          <p className="font-medium">{manutencao.telefone || "-"}</p>
        </div>
        <div>
          <span className="text-sm text-gray-500">Prazo:</span>
          <p className="font-medium">{manutencao.prazo || "-"}</p>
        </div>
        <div>
          <span className="text-sm text-gray-500">Status:</span>
          <p className="font-medium">{manutencao.status}</p>
        </div>
      </div>
    </div>
  )
}
