"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useUsuario } from "@/lib/useUsuario"
import { listarInspections } from "@/services/inspectionsService"
import { Inspection } from "@/types/database.types"
import { INSPECTION_TYPE_LABEL } from "@/lib/labels"
import Button from "@/components/ui/Button"
import Table from "@/components/ui/Table"
import StatusBadge from "@/components/ui/StatusBadge"
import { Plus } from "lucide-react"

export default function VistoriasPage() {
  const { imobiliariaId, loading: loadingUser } = useUsuario()
  const [inspections, setInspections] = useState<Inspection[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!imobiliariaId) return
    async function carregar() {
      try {
        const data = await listarInspections(imobiliariaId!)
        setInspections(data)
      } catch (err) {
        console.error("Erro ao carregar vistorias:", err)
      } finally {
        setLoading(false)
      }
    }
    carregar()
  }, [imobiliariaId])

  if (loadingUser || loading) return <p className="text-gray-500">Carregando...</p>

  const columns = [
    { key: "property_code", label: "Código" },
    { key: "property_address", label: "Endereço" },
    {
      key: "type",
      label: "Tipo",
      render: (item: Inspection) => INSPECTION_TYPE_LABEL[item.type],
    },
    {
      key: "status",
      label: "Status",
      render: (item: Inspection) => <StatusBadge status={item.status} />,
    },
    {
      key: "scheduled_start",
      label: "Agendamento",
      render: (item: Inspection) =>
        item.scheduled_start
          ? new Date(item.scheduled_start).toLocaleString("pt-BR")
          : "—",
    },
    {
      key: "created_at",
      label: "Criada em",
      render: (item: Inspection) =>
        new Date(item.created_at).toLocaleDateString("pt-BR"),
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Vistorias</h1>
          <p className="mt-1 text-sm text-gray-500">
            Acompanhe as solicitacoes abertas e o andamento operacional das vistorias.
          </p>
        </div>
        <Link href="/vistorias/nova">
          <Button>
            <span className="flex items-center gap-2">
              <Plus size={16} /> Nova Vistoria
            </span>
          </Button>
        </Link>
      </div>
      <Table
        columns={columns}
        data={inspections}
        emptyMessage="Nenhuma vistoria cadastrada ainda. Crie a primeira para iniciar o fluxo."
      />
    </div>
  )
}
