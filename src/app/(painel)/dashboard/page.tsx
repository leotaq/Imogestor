"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabaseClient"
import { ClipboardCheck, Wrench, CheckCircle, DollarSign, TrendingUp } from "lucide-react"

interface DashboardStats {
  abertas: number
  emExecucao: number
  concluidas: number
  custoTotal: number
  taxaAdministrativa: number
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    abertas: 0,
    emExecucao: 0,
    concluidas: 0,
    custoTotal: 0,
    taxaAdministrativa: 0,
  })

  useEffect(() => {
    async function carregarDados() {
      const { data: manutencoes } = await supabase
        .from("solicitacoes_manutencao")
        .select("status")

      const { data: financeiro } = await supabase
        .from("financeiro")
        .select("valor_total, taxa_administrativa")

      const abertas = manutencoes?.filter((m) => m.status === "aberta").length ?? 0
      const emExecucao = manutencoes?.filter((m) => m.status === "em_execucao").length ?? 0
      const concluidas = manutencoes?.filter((m) => m.status === "concluida").length ?? 0

      const custoTotal = financeiro?.reduce((acc, f) => acc + (f.valor_total || 0), 0) ?? 0
      const taxaAdministrativa = financeiro?.reduce((acc, f) => acc + (f.taxa_administrativa || 0), 0) ?? 0

      setStats({ abertas, emExecucao, concluidas, custoTotal, taxaAdministrativa })
    }

    carregarDados()
  }, [])

  const cards = [
    { label: "Solicitações Abertas", value: stats.abertas, icon: ClipboardCheck, color: "text-yellow-600 bg-yellow-50" },
    { label: "Em Execução", value: stats.emExecucao, icon: Wrench, color: "text-blue-600 bg-blue-50" },
    { label: "Concluídas", value: stats.concluidas, icon: CheckCircle, color: "text-green-600 bg-green-50" },
    { label: "Custo Total", value: `R$ ${stats.custoTotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`, icon: DollarSign, color: "text-red-600 bg-red-50" },
    { label: "Taxa Administrativa", value: `R$ ${stats.taxaAdministrativa.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`, icon: TrendingUp, color: "text-primary-600 bg-primary-50" },
  ]

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {cards.map((card) => {
          const Icon = card.icon
          return (
            <div
              key={card.label}
              className="bg-white rounded-xl border border-gray-200 p-5"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className={`p-2 rounded-lg ${card.color}`}>
                  <Icon size={20} />
                </div>
              </div>
              <p className="text-2xl font-bold">{card.value}</p>
              <p className="text-sm text-gray-500 mt-1">{card.label}</p>
            </div>
          )
        })}
      </div>
    </div>
  )
}
