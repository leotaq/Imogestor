"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabaseClient"
import { Execucao } from "@/types/database.types"
import Table from "@/components/ui/Table"

export default function ExecucaoPage() {
  const [execucoes, setExecucoes] = useState<Execucao[]>([])

  useEffect(() => {
    async function carregar() {
      const { data, error } = await supabase.from("execucao").select("*")
      if (!error && data) setExecucoes(data as Execucao[])
    }
    carregar()
  }, [])

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
