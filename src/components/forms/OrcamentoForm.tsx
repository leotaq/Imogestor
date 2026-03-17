"use client"

import { useState } from "react"
import { Orcamento } from "@/types/database.types"
import Button from "@/components/ui/Button"
import Input from "@/components/ui/Input"

interface OrcamentoFormProps {
  onSubmit: (dados: Omit<Orcamento, "id" | "created_at">) => Promise<void>
}

export default function OrcamentoForm({ onSubmit }: OrcamentoFormProps) {
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    imobiliaria_id: "",
    solicitacao_id: "",
    prestador_id: "",
    valor: 0,
    descricao: "",
    status: "pendente",
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    await onSubmit(form)
    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-xl space-y-4">
      <Input
        label="ID da Solicitação"
        value={form.solicitacao_id}
        onChange={(e) => setForm({ ...form, solicitacao_id: e.target.value })}
        required
      />
      <Input
        label="ID do Prestador"
        value={form.prestador_id}
        onChange={(e) => setForm({ ...form, prestador_id: e.target.value })}
        required
      />
      <Input
        label="Valor (R$)"
        type="number"
        step="0.01"
        value={form.valor}
        onChange={(e) => setForm({ ...form, valor: parseFloat(e.target.value) || 0 })}
        required
      />
      <Input
        label="Descrição"
        value={form.descricao}
        onChange={(e) => setForm({ ...form, descricao: e.target.value })}
        required
      />
      <Button type="submit" disabled={loading}>
        {loading ? "Salvando..." : "Salvar Orçamento"}
      </Button>
    </form>
  )
}
