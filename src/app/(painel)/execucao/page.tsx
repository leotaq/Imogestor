"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabaseClient"
import { useUsuario } from "@/lib/useUsuario"
import { Execucao } from "@/types/database.types"
import Table from "@/components/ui/Table"

export default function ExecucaoPage() {
  const { imobiliariaId, loading: loadingUser } = useUsuario()
  const [execucoes, setExecucoes] = useState<Execucao[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!imobiliariaId) return
    async function carregar() {
      const { data, error } = await supabase
        .from("execucao")
        .select("*")
        .eq("imobiliaria_id", imobiliariaId)
      if (!error && data) setExecucoes(data as Execucao[])
      setLoading(false)
    }
    carregar()
  }, [imobiliariaId])

  if (loadingUser || loading) return <p className="text-gray-500">Carregando...</p>

  const columns = [
    { key: "data_inicio", label: "Data Início" },
    { key: "data_fim", label: "Data Fim" },
    { key: "status", label: "Status" },
    { key: "observacoes", label: "Observações" },
  ]

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Execução de Serviços</h1>
      <Table columns={columns} data={execucoes} />
    </div>
  )
}
