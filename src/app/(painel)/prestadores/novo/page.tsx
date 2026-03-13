"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { criarPrestador } from "@/services/prestadoresService"
import Button from "@/components/ui/Button"
import Input from "@/components/ui/Input"

export default function NovoPrestadorPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    imobiliaria_id: "",
    nome: "",
    telefone: "",
    especialidade: "",
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    await criarPrestador(form)
    router.push("/prestadores")
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Novo Prestador</h1>
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
          required
        />
        <Input
          label="Especialidade"
          value={form.especialidade}
          onChange={(e) => setForm({ ...form, especialidade: e.target.value })}
          required
        />
        <Button type="submit" disabled={loading}>
          {loading ? "Salvando..." : "Salvar Prestador"}
        </Button>
      </form>
    </div>
  )
}
