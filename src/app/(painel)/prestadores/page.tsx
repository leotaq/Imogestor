"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { listarPrestadores } from "@/services/prestadoresService"
import { Prestador } from "@/types/database.types"
import Button from "@/components/ui/Button"
import Table from "@/components/ui/Table"
import { Plus } from "lucide-react"

export default function PrestadoresPage() {
  const [prestadores, setPrestadores] = useState<Prestador[]>([])

  useEffect(() => {
    async function carregar() {
      try {
        const data = await listarPrestadores("")
        setPrestadores(data)
      } catch (err) {
        console.error("Erro ao carregar prestadores:", err)
      }
    }
    carregar()
  }, [])

  const columns = [
    { key: "nome", label: "Nome" },
    { key: "telefone", label: "Telefone" },
    { key: "especialidade", label: "Especialidade" },
  ]

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Prestadores</h1>
        <Link href="/prestadores/novo">
          <Button>
            <span className="flex items-center gap-2">
              <Plus size={16} /> Novo Prestador
            </span>
          </Button>
        </Link>
      </div>
      <Table columns={columns} data={prestadores} />
    </div>
  )
}
