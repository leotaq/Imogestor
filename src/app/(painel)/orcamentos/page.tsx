"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useUsuario } from "@/lib/useUsuario"
import { listarOrcamentos } from "@/services/orcamentosService"
import { Orcamento } from "@/types/database.types"
import Button from "@/components/ui/Button"
import Table from "@/components/ui/Table"
import { Plus } from "lucide-react"

export default function OrcamentosPage() {
  const { imobiliariaId, loading: loadingUser } = useUsuario()
  const [orcamentos, setOrcamentos] = useState<Orcamento[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!imobiliariaId) return
    async function carregar() {
      try {
        const data = await listarOrcamentos(imobiliariaId!)
        setOrcamentos(data)
      } catch (err) {
        console.error("Erro ao carregar orçamentos:", err)
      } finally {
        setLoading(false)
      }
    }
    carregar()
  }, [imobiliariaId])

  if (loadingUser || loading) return <p className="text-gray-500">Carregando...</p>

  const columns = [
    { key: "descricao", label: "Descrição" },
    {
      key: "valor",
      label: "Valor",
      render: (item: Orcamento) =>
        `R$ ${item.valor.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
    },
    { key: "status", label: "Status" },
  ]

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Orçamentos</h1>
        <Link href="/orcamentos/novo">
          <Button>
            <span className="flex items-center gap-2">
              <Plus size={16} /> Novo Orçamento
            </span>
          </Button>
        </Link>
      </div>
      <Table columns={columns} data={orcamentos} />
    </div>
  )
}
