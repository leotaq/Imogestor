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
    async function carregar() {
      try {
        const data = await listarManutencoes(imobiliariaId!)
        setManutencoes(data)
      } catch (err) {
        console.error("Erro ao carregar manutenções:", err)
      } finally {
        setLoading(false)
      }
    }
    carregar()
  }, [imobiliariaId])

  if (loadingUser || loading) return <p className="text-gray-500">Carregando...</p>

  const columns = [
    { key: "nome_solicitante", label: "Solicitante" },
    { key: "tipo_manutencao", label: "Tipo" },
    { key: "descricao", label: "Descrição" },
    { key: "prazo", label: "Prazo" },
    { key: "status", label: "Status" },
    {
      key: "acoes",
      label: "Ações",
      render: (item: SolicitacaoManutencao) => (
        <Link
          href={`/manutencoes/${item.id}`}
          className="text-primary-600 hover:underline text-sm"
        >
          Ver detalhes
        </Link>
      ),
    },
  ]

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Manutenções</h1>
        <Link href="/manutencoes/nova">
          <Button>
            <span className="flex items-center gap-2">
              <Plus size={16} /> Nova Solicitação
            </span>
          </Button>
        </Link>
      </div>
      <Table columns={columns} data={manutencoes} />
    </div>
  )
}
