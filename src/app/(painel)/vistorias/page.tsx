"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { listarVistorias } from "@/services/vistoriasService"
import { Vistoria } from "@/types/database.types"
import Button from "@/components/ui/Button"
import Table from "@/components/ui/Table"
import { Plus } from "lucide-react"

export default function VistoriasPage() {
  const [vistorias, setVistorias] = useState<Vistoria[]>([])

  useEffect(() => {
    async function carregar() {
      try {
        const data = await listarVistorias()
        setVistorias(data)
      } catch (err) {
        console.error("Erro ao carregar vistorias:", err)
      }
    }
    carregar()
  }, [])

  const columns = [
    { key: "tipo_vistoria", label: "Tipo" },
    { key: "data_solicitacao", label: "Data Solicitação" },
    { key: "data_execucao", label: "Data Execução" },
    { key: "status", label: "Status" },
  ]

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Vistorias</h1>
        <Link href="/vistorias/nova">
          <Button>
            <span className="flex items-center gap-2">
              <Plus size={16} /> Nova Vistoria
            </span>
          </Button>
        </Link>
      </div>
      <Table columns={columns} data={vistorias} />
    </div>
  )
}
