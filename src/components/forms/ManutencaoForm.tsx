"use client"

import { useState } from "react"
import { SolicitacaoManutencao } from "@/types/database.types"
import Button from "@/components/ui/Button"
import Input from "@/components/ui/Input"
import Select from "@/components/ui/Select"

interface ManutencaoFormProps {
  onSubmit: (dados: Omit<SolicitacaoManutencao, "id">) => Promise<void>
}

export default function ManutencaoForm({ onSubmit }: ManutencaoFormProps) {
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    imovel_id: "",
    solicitante_tipo: "",
    nome_solicitante: "",
    telefone: "",
    tipo_manutencao: "",
    descricao: "",
    prazo: "",
    status: "aberta",
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
        label="ID do Imóvel"
        value={form.imovel_id}
        onChange={(e) => setForm({ ...form, imovel_id: e.target.value })}
        required
      />
      <Select
        label="Tipo de Solicitante"
        options={[
          { value: "proprietario", label: "Proprietário" },
          { value: "inquilino", label: "Inquilino" },
          { value: "imobiliaria", label: "Imobiliária" },
        ]}
        value={form.solicitante_tipo}
        onChange={(e) => setForm({ ...form, solicitante_tipo: e.target.value })}
        required
      />
      <Input
        label="Nome do Solicitante"
        value={form.nome_solicitante}
        onChange={(e) => setForm({ ...form, nome_solicitante: e.target.value })}
        required
      />
      <Input
        label="Telefone"
        value={form.telefone}
        onChange={(e) => setForm({ ...form, telefone: e.target.value })}
        required
      />
      <Select
        label="Tipo de Manutenção"
        options={[
          { value: "eletrica", label: "Elétrica" },
          { value: "hidraulica", label: "Hidráulica" },
          { value: "pintura", label: "Pintura" },
          { value: "alvenaria", label: "Alvenaria" },
          { value: "outros", label: "Outros" },
        ]}
        value={form.tipo_manutencao}
        onChange={(e) => setForm({ ...form, tipo_manutencao: e.target.value })}
        required
      />
      <Input
        label="Descrição"
        value={form.descricao}
        onChange={(e) => setForm({ ...form, descricao: e.target.value })}
        required
      />
      <Input
        label="Prazo"
        type="date"
        value={form.prazo}
        onChange={(e) => setForm({ ...form, prazo: e.target.value })}
        required
      />
      <Button type="submit" disabled={loading}>
        {loading ? "Salvando..." : "Salvar Solicitação"}
      </Button>
    </form>
  )
}
