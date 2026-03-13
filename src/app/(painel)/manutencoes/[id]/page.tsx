"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { buscarManutencao } from "@/services/manutencoesService"
import { SolicitacaoManutencao } from "@/types/database.types"

export default function DetalheManutencaoPage() {
  const params = useParams()
  const [manutencao, setManutencao] = useState<SolicitacaoManutencao | null>(null)

  useEffect(() => {
    async function carregar() {
      const data = await buscarManutencao(params.id as string)
      setManutencao(data)
    }
    carregar()
  }, [params.id])

  if (!manutencao) return <p className="text-gray-500">Carregando...</p>

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Detalhes da Manutenção</h1>
      <div className="bg-white rounded-xl border border-gray-200 p-6 max-w-2xl space-y-3">
        <div>
          <span className="text-sm text-gray-500">Solicitante:</span>
          <p className="font-medium">{manutencao.nome_solicitante}</p>
        </div>
        <div>
          <span className="text-sm text-gray-500">Tipo:</span>
          <p className="font-medium">{manutencao.tipo_manutencao}</p>
        </div>
        <div>
          <span className="text-sm text-gray-500">Descrição:</span>
          <p className="font-medium">{manutencao.descricao}</p>
        </div>
        <div>
          <span className="text-sm text-gray-500">Telefone:</span>
          <p className="font-medium">{manutencao.telefone}</p>
        </div>
        <div>
          <span className="text-sm text-gray-500">Prazo:</span>
          <p className="font-medium">{manutencao.prazo}</p>
        </div>
        <div>
          <span className="text-sm text-gray-500">Status:</span>
          <p className="font-medium">{manutencao.status}</p>
        </div>
      </div>
    </div>
  )
}
