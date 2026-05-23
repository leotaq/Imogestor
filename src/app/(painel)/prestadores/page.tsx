"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useUsuario } from "@/lib/useUsuario"
import { listarPrestadores } from "@/services/prestadoresService"
import { Prestador } from "@/types/database.types"
import Button from "@/components/ui/Button"
import Table from "@/components/ui/Table"
import { Plus } from "lucide-react"

const FATURAMENTO_LABEL: Record<string, string> = {
  nota_fiscal: "Nota fiscal",
  recibo: "Recibo",
}

const METODO_RECEBIMENTO_LABEL: Record<string, string> = {
  pix: "Pix",
  dinheiro: "Dinheiro",
  deposito: "Deposito",
}

const DIA_RECEBIMENTO_LABEL: Record<string, string> = {
  segunda: "Segunda-feira",
  terca: "Terca-feira",
  quarta: "Quarta-feira",
  quinta: "Quinta-feira",
  sexta: "Sexta-feira",
  sabado: "Sabado",
  domingo: "Domingo",
}

export default function PrestadoresPage() {
  const { imobiliariaId, loading: loadingUser } = useUsuario()
  const [prestadores, setPrestadores] = useState<Prestador[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!imobiliariaId) return
    async function carregar() {
      try {
        const data = await listarPrestadores(imobiliariaId!)
        setPrestadores(data)
      } catch (err) {
        console.error("Erro ao carregar prestadores:", err)
      } finally {
        setLoading(false)
      }
    }
    carregar()
  }, [imobiliariaId])

  if (loadingUser || loading) return <p className="text-gray-500">Carregando...</p>

  const columns = [
    { key: "nome", label: "Nome" },
    { key: "telefone", label: "Telefone" },
    { key: "especialidade", label: "Especialidade" },
    {
      key: "faturamento_tipo",
      label: "Faturamento",
      render: (item: Prestador) =>
        item.faturamento_tipo ? FATURAMENTO_LABEL[item.faturamento_tipo] : "-",
    },
    {
      key: "metodo_recebimento",
      label: "Metodo",
      render: (item: Prestador) =>
        item.metodo_recebimento
          ? METODO_RECEBIMENTO_LABEL[item.metodo_recebimento]
          : "-",
    },
    {
      key: "dados_recebimento",
      label: "Dados pagamento",
      render: (item: Prestador) => item.dados_recebimento || "-",
    },
    {
      key: "dia_recebimento",
      label: "Dia recebimento",
      render: (item: Prestador) =>
        item.dia_recebimento ? DIA_RECEBIMENTO_LABEL[item.dia_recebimento] : "-",
    },
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
