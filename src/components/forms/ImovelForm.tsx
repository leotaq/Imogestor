"use client"

import { useState } from "react"
import { Imovel } from "@/types/database.types"
import Button from "@/components/ui/Button"
import Input from "@/components/ui/Input"

interface ImovelFormProps {
  onSubmit: (dados: Omit<Imovel, "id">) => Promise<void>
  initialData?: Imovel
}

export default function ImovelForm({ onSubmit, initialData }: ImovelFormProps) {
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    imobiliaria_id: initialData?.imobiliaria_id ?? "",
    codigo: initialData?.codigo ?? "",
    endereco: initialData?.endereco ?? "",
    cidade: initialData?.cidade ?? "",
    bairro: initialData?.bairro ?? "",
    numero: initialData?.numero ?? "",
    proprietario: initialData?.proprietario ?? "",
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
        label="Código"
        value={form.codigo}
        onChange={(e) => setForm({ ...form, codigo: e.target.value })}
        required
      />
      <Input
        label="Endereço"
        value={form.endereco}
        onChange={(e) => setForm({ ...form, endereco: e.target.value })}
        required
      />
      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Cidade"
          value={form.cidade}
          onChange={(e) => setForm({ ...form, cidade: e.target.value })}
          required
        />
        <Input
          label="Bairro"
          value={form.bairro}
          onChange={(e) => setForm({ ...form, bairro: e.target.value })}
          required
        />
      </div>
      <Input
        label="Número"
        value={form.numero}
        onChange={(e) => setForm({ ...form, numero: e.target.value })}
        required
      />
      <Input
        label="Proprietário"
        value={form.proprietario}
        onChange={(e) => setForm({ ...form, proprietario: e.target.value })}
        required
      />
      <Button type="submit" disabled={loading}>
        {loading ? "Salvando..." : "Salvar Imóvel"}
      </Button>
    </form>
  )
}
