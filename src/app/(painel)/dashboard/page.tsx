"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabaseClient"
import { useUsuario } from "@/lib/useUsuario"
import { ClipboardCheck, Wrench, CheckCircle } from "lucide-react"

interface DashboardStats {
  abertas: number
  emExecucao: number
  concluidas: number
}

export default function DashboardPage() {
  const { imobiliariaId, loading: loadingUser } = useUsuario()
  const [stats, setStats] = useState<DashboardStats>({
    abertas: 0,
    emExecucao: 0,
    concluidas: 0,
  })

  useEffect(() => {
    if (!imobiliariaId) return

    async function carregarDados() {
      const { data: manutencoes } = await supabase
        .from("solicitacoes_manutencao")
        .select("status")
        .eq("imobiliaria_id", imobiliariaId)

      const abertas = manutencoes?.filter((m) => m.status === "aberta").length ?? 0
      const emExecucao = manutencoes?.filter((m) => m.status === "em_execucao").length ?? 0
      const concluidas = manutencoes?.filter((m) => m.status === "concluida").length ?? 0

      setStats({ abertas, emExecucao, concluidas })
    }

    carregarDados()
  }, [imobiliariaId])

  if (loadingUser) return <p className="text-gray-500">Carregando...</p>

  const cards = [
    {
      label: "Solicitacoes Abertas",
      value: stats.abertas,
      icon: ClipboardCheck,
      color: "text-yellow-600 bg-yellow-50",
    },
    {
      label: "Em Execucao",
      value: stats.emExecucao,
      icon: Wrench,
      color: "text-blue-600 bg-blue-50",
    },
    {
      label: "Concluidas",
      value: stats.concluidas,
      icon: CheckCircle,
      color: "text-green-600 bg-green-50",
    },
  ]

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => {
          const Icon = card.icon
          return (
            <div
              key={card.label}
              className="rounded-xl border border-gray-200 bg-white p-5"
            >
              <div className="mb-3 flex items-center gap-3">
                <div className={`rounded-lg p-2 ${card.color}`}>
                  <Icon size={20} />
                </div>
              </div>
              <p className="text-2xl font-bold">{card.value}</p>
              <p className="mt-1 text-sm text-gray-500">{card.label}</p>
            </div>
          )
        })}
      </div>
    </div>
  )
}
