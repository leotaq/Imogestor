"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useUsuario } from "@/lib/useUsuario"
import { criarPrestador } from "@/services/prestadoresService"
import Button from "@/components/ui/Button"
import Input from "@/components/ui/Input"

export default function NovoPrestadorPage() {
  const router = useRouter()
  const { imobiliariaId, loading: loadingUser } = useUsuario()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    nome: "",
    telefone: "",
    especialidade: "",
  })

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
      })
      router.push("/prestadores")
    } catch (err) {
      console.error("Erro ao salvar prestador:", err)
      alert("Erro ao salvar prestador. Verifique os dados e tente novamente.")
      setLoading(false)
    }
  }

  if (loadingUser) return <p className="text-gray-500">Carregando...</p>

  if (!imobiliariaId) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm">
        Não foi possível identificar sua imobiliária.
      </div>
    )
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
        />
        <Input
          label="Especialidade"
          value={form.especialidade}
          onChange={(e) => setForm({ ...form, especialidade: e.target.value })}
        />
        <Button type="submit" disabled={loading}>
          {loading ? "Salvando..." : "Salvar Prestador"}
        </Button>
      </form>
    </div>
  )
}
