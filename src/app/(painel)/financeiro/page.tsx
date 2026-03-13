"use client"

import { useEffect, useState } from "react"
import { listarFinanceiro } from "@/services/financeiroService"
import { Financeiro } from "@/types/database.types"
import Table from "@/components/ui/Table"

export default function FinanceiroPage() {
  const [registros, setRegistros] = useState<Financeiro[]>([])

  useEffect(() => {
    async function carregar() {
      try {
        const data = await listarFinanceiro("")
        setRegistros(data)
      } catch (err) {
        console.error("Erro ao carregar financeiro:", err)
      }
    }
    carregar()
  }, [])

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
