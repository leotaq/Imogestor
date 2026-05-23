"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useUsuario } from "@/lib/useUsuario"
import { listarManutencoes } from "@/services/manutencoesService"
import { SolicitacaoManutencao } from "@/types/database.types"
import Button from "@/components/ui/Button"
import Table from "@/components/ui/Table"
import { Plus } from "lucide-react"

export default function ManutencoesPage() {
  const { imobiliariaId, loading: loadingUser } = useUsuario()
  const [manutencoes, setManutencoes] = useState<SolicitacaoManutencao[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!imobiliariaId) return
    const id = imobiliariaId

    async function carregar() {
      try {
        const data = await listarManutencoes(id)
        setManutencoes(data)
      } catch (err) {
        console.error("Erro ao carregar manutencoes:", err)
      } finally {
        setLoading(false)
      }
    }

    void carregar()
  }, [imobiliariaId])

  if (loadingUser || loading) return <p className="text-gray-500">Carregando...</p>

  const columns = [
    { key: "nome_solicitante", label: "Solicitante" },
    { key: "tipo_manutencao", label: "Tipo" },
    { key: "descricao", label: "Descricao" },
    { key: "prazo", label: "Prazo" },
    { key: "status", label: "Status" },
    {
      key: "acoes",
      label: "Acoes",
      render: (item: SolicitacaoManutencao) => (
        <div className="flex items-center gap-3">
          <Link href={`/manutencoes/${item.id}`} className="text-sm text-primary-600 hover:underline">
            Ver detalhes
          </Link>
          <Link
            href={`/orcamentos/novo?solicitacaoId=${item.id}`}
            className="text-sm text-emerald-700 hover:underline"
          >
            Criar orcamento
          </Link>
        </div>
      ),
    },
  ]

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Manutencoes</h1>
        <Link href="/manutencoes/nova">
          <Button>
            <span className="flex items-center gap-2">
              <Plus size={16} /> Nova solicitacao
            </span>
          </Button>
        </Link>
      </div>
      <Table columns={columns} data={manutencoes} />
    </div>
  )
}
