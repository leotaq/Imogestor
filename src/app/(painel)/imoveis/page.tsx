"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { listarImoveis } from "@/services/imoveisService"
import { Imovel } from "@/types/database.types"
import { useImobiliaria } from "@/lib/useImobiliaria"
import Button from "@/components/ui/Button"
import Table from "@/components/ui/Table"
import { Plus } from "lucide-react"

export default function ImoveisPage() {
  const [imoveis, setImoveis] = useState<Imovel[]>([])
  const { imobiliariaId } = useImobiliaria()

  useEffect(() => {
    if (!imobiliariaId) return
    async function carregar() {
      try {
        const data = await listarImoveis(imobiliariaId!)
        setImoveis(data)
      } catch (err) {
        console.error("Erro ao carregar imóveis:", err)
      }
    }
    carregar()
  }, [imobiliariaId])

  const columns = [
    { key: "codigo", label: "Código" },
    { key: "endereco", label: "Endereço" },
    { key: "bairro", label: "Bairro" },
    { key: "cidade", label: "Cidade" },
    { key: "proprietario", label: "Proprietário" },
    {
      key: "acoes",
      label: "Ações",
      render: (item: Imovel) => (
        <Link
          href={`/imoveis/${item.id}`}
          className="text-primary-600 hover:underline text-sm"
        >
          Ver detalhes
        </Link>
      ),
    },
  ]

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Imóveis</h1>
        <Link href="/imoveis/novo">
          <Button>
            <span className="flex items-center gap-2">
              <Plus size={16} /> Novo Imóvel
            </span>
          </Button>
        </Link>
      </div>
      <Table columns={columns} data={imoveis} />
    </div>
  )
}
