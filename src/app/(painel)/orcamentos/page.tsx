"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useUsuario } from "@/lib/useUsuario"
import { listarOrcamentos } from "@/services/orcamentosService"
import { Orcamento } from "@/types/database.types"
import Button from "@/components/ui/Button"
import Table from "@/components/ui/Table"
import { Plus } from "lucide-react"

function formatarData(value: string) {
  try {
    return new Date(value).toLocaleDateString("pt-BR")
  } catch {
    return "-"
  }
}

export default function OrcamentosPage() {
  const { imobiliariaId, loading: loadingUser } = useUsuario()
  const [orcamentos, setOrcamentos] = useState<Orcamento[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!imobiliariaId) return
    const id = imobiliariaId

    async function carregar() {
      try {
        const data = await listarOrcamentos(id)
        setOrcamentos(data)
      } catch (err) {
        console.error("Erro ao carregar orcamentos:", err)
      } finally {
        setLoading(false)
      }
    }

    void carregar()
  }, [imobiliariaId])

  if (loadingUser || loading) return <p className="text-gray-500">Carregando...</p>

  const columns = [
    {
      key: "solicitacao_id",
      label: "ID solicitacao",
      render: (item: Orcamento) => (
        <code className="rounded bg-gray-100 px-2 py-1 text-xs">{item.solicitacao_id.slice(0, 8)}</code>
      ),
    },
    {
      key: "descricao",
      label: "Descricao",
      render: (item: Orcamento) => item.descricao || "-",
    },
    {
      key: "valor",
      label: "Valor",
      render: (item: Orcamento) =>
        `R$ ${item.valor.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
    },
    { key: "status", label: "Status" },
    {
      key: "created_at",
      label: "Criado em",
      render: (item: Orcamento) => formatarData(item.created_at),
    },
  ]

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Orcamentos</h1>
        <Link href="/orcamentos/novo">
          <Button>
            <span className="flex items-center gap-2">
              <Plus size={16} /> Novo orcamento
            </span>
          </Button>
        </Link>
      </div>
      <Table columns={columns} data={orcamentos} />
    </div>
  )
}
