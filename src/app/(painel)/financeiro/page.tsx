"use client"

import { useEffect, useState } from "react"
import { useUsuario } from "@/lib/useUsuario"
import { listarFinanceiro } from "@/services/financeiroService"
import { Financeiro } from "@/types/database.types"
import Table from "@/components/ui/Table"

export default function FinanceiroPage() {
  const { imobiliariaId, loading: loadingUser } = useUsuario()
  const [registros, setRegistros] = useState<Financeiro[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!imobiliariaId) return
    async function carregar() {
      try {
        const data = await listarFinanceiro(imobiliariaId!)
        setRegistros(data)
      } catch (err) {
        console.error("Erro ao carregar financeiro:", err)
      } finally {
        setLoading(false)
      }
    }
    carregar()
  }, [imobiliariaId])

  if (loadingUser || loading) return <p className="text-gray-500">Carregando...</p>

  const columns = [
    {
      key: "valor_total",
      label: "Valor Total",
      render: (item: Financeiro) =>
        `R$ ${item.valor_total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
    },
    {
      key: "taxa_administrativa",
      label: "Taxa Administrativa",
      render: (item: Financeiro) =>
        `R$ ${item.taxa_administrativa.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
    },
    { key: "data_registro", label: "Data Registro" },
  ]

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Financeiro</h1>
      <Table columns={columns} data={registros} />
    </div>
  )
}
