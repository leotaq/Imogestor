"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useUsuario } from "@/lib/useUsuario"
import { criarPrestador } from "@/services/prestadoresService"
import {
  DiaRecebimentoPrestador,
  FaturamentoPrestador,
  MetodoRecebimentoPrestador,
} from "@/types/database.types"
import Button from "@/components/ui/Button"
import Input from "@/components/ui/Input"
import Select from "@/components/ui/Select"

const FATURAMENTO_OPTIONS: { value: FaturamentoPrestador; label: string }[] = [
  { value: "nota_fiscal", label: "Nota fiscal" },
  { value: "recibo", label: "Recibo" },
]

const METODO_RECEBIMENTO_OPTIONS: {
  value: MetodoRecebimentoPrestador
  label: string
}[] = [
  { value: "pix", label: "Pix" },
  { value: "dinheiro", label: "Dinheiro" },
  { value: "deposito", label: "Deposito" },
]

const DIA_RECEBIMENTO_OPTIONS: { value: DiaRecebimentoPrestador; label: string }[] = [
  { value: "segunda", label: "Segunda-feira" },
  { value: "terca", label: "Terca-feira" },
  { value: "quarta", label: "Quarta-feira" },
  { value: "quinta", label: "Quinta-feira" },
  { value: "sexta", label: "Sexta-feira" },
  { value: "sabado", label: "Sabado" },
  { value: "domingo", label: "Domingo" },
]

function getDadosRecebimentoConfig(metodo: MetodoRecebimentoPrestador | "") {
  if (metodo === "pix") {
    return {
      label: "Chave Pix para pagamento",
      placeholder: "Ex.: CPF, telefone, e-mail ou chave aleatoria",
    }
  }

  if (metodo === "deposito") {
    return {
      label: "Dados bancarios para deposito",
      placeholder: "Ex.: Banco, agencia, conta e titular",
    }
  }

  if (metodo === "dinheiro") {
    return {
      label: "Orientacoes para pagamento em dinheiro",
      placeholder: "Ex.: Local de entrega, responsavel e observacoes",
    }
  }

  return null
}

export default function NovoPrestadorPage() {
  const router = useRouter()
  const { imobiliariaId, loading: loadingUser } = useUsuario()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    nome: "",
    telefone: "",
    especialidade: "",
    faturamento_tipo: "" as FaturamentoPrestador | "",
    metodo_recebimento: "" as MetodoRecebimentoPrestador | "",
    dia_recebimento: "" as DiaRecebimentoPrestador | "",
    dados_recebimento: "",
  })

  const dadosRecebimentoConfig = getDadosRecebimentoConfig(form.metodo_recebimento)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!imobiliariaId) return

    setLoading(true)
    try {
      await criarPrestador({
        imobiliaria_id: imobiliariaId,
        nome: form.nome,
        telefone: form.telefone || null,
        especialidade: form.especialidade || null,
        faturamento_tipo: form.faturamento_tipo || null,
        metodo_recebimento: form.metodo_recebimento || null,
        dia_recebimento: form.dia_recebimento || null,
        dados_recebimento: form.dados_recebimento.trim() || null,
      })

      router.push("/prestadores")
    } catch (err) {
      console.error("Erro ao salvar prestador:", err)
      const message = err instanceof Error ? err.message : "Erro ao salvar prestador."
      alert(`Erro ao salvar prestador: ${message}`)
      setLoading(false)
    }
  }

  if (loadingUser) return <p className="text-gray-500">Carregando...</p>

  if (!imobiliariaId) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        Nao foi possivel identificar sua imobiliaria.
      </div>
    )
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Novo Prestador</h1>

      <form onSubmit={handleSubmit} className="max-w-xl space-y-4">
        <Input
          label="Nome"
          value={form.nome}
          onChange={(e) => setForm({ ...form, nome: e.target.value })}
          required
        />

        <Input
          label="Telefone"
          value={form.telefone}
          onChange={(e) => setForm({ ...form, telefone: e.target.value })}
        />

        <Input
          label="Especialidade"
          value={form.especialidade}
          onChange={(e) => setForm({ ...form, especialidade: e.target.value })}
        />

        <Select
          label="Faturamento"
          options={FATURAMENTO_OPTIONS}
          value={form.faturamento_tipo}
          onChange={(e) =>
            setForm({ ...form, faturamento_tipo: e.target.value as FaturamentoPrestador | "" })
          }
          required
        />

        <Select
          label="Metodo de recebimento"
          options={METODO_RECEBIMENTO_OPTIONS}
          value={form.metodo_recebimento}
          onChange={(e) =>
            setForm({
              ...form,
              metodo_recebimento: e.target.value as MetodoRecebimentoPrestador | "",
              dados_recebimento: "",
            })
          }
          required
        />

        {dadosRecebimentoConfig && (
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">
              {dadosRecebimentoConfig.label}
            </label>
            <textarea
              value={form.dados_recebimento}
              onChange={(e) =>
                setForm({
                  ...form,
                  dados_recebimento: e.target.value,
                })
              }
              placeholder={dadosRecebimentoConfig.placeholder}
              className="min-h-24 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary-500"
              required
            />
          </div>
        )}

        <Select
          label="Dia para recebimento"
          options={DIA_RECEBIMENTO_OPTIONS}
          value={form.dia_recebimento}
          onChange={(e) =>
            setForm({
              ...form,
              dia_recebimento: e.target.value as DiaRecebimentoPrestador | "",
            })
          }
          required
        />

        <Button type="submit" disabled={loading}>
          {loading ? "Salvando..." : "Salvar Prestador"}
        </Button>
      </form>
    </div>
  )
}
