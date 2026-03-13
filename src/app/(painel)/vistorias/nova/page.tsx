"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { criarVistoria } from "@/services/vistoriasService"
import Button from "@/components/ui/Button"
import Input from "@/components/ui/Input"
import Select from "@/components/ui/Select"

export default function NovaVistoriaPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    imovel_id: "",
    tipo_vistoria: "",
    data_solicitacao: new Date().toISOString(),
    data_execucao: null as string | null,
    status: "pendente",
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    await criarVistoria(form)
    router.push("/vistorias")
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Nova Vistoria</h1>
      <form onSubmit={handleSubmit} className="max-w-xl space-y-4">
        <Input
          label="ID do Imóvel"
          value={form.imovel_id}
          onChange={(e) => setForm({ ...form, imovel_id: e.target.value })}
          required
        />
        <Select
          label="Tipo de Vistoria"
          options={[
            { value: "entrada", label: "Entrada" },
            { value: "saida", label: "Saída" },
            { value: "periodica", label: "Periódica" },
          ]}
          value={form.tipo_vistoria}
          onChange={(e) => setForm({ ...form, tipo_vistoria: e.target.value })}
          required
        />
        <Button type="submit" disabled={loading}>
          {loading ? "Salvando..." : "Salvar Vistoria"}
        </Button>
      </form>
    </div>
  )
}
