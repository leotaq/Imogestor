"use client"

import { useState } from "react"
import { Usuario, TipoUsuario } from "@/types/database.types"
import Button from "@/components/ui/Button"
import Input from "@/components/ui/Input"

interface UsuarioFormProps {
  onSubmit: (dados: Omit<Usuario, "id" | "created_at"> & { senha: string }) => Promise<void>
  initialData?: Usuario
  imobiliariaId: string
}

const TIPOS: { value: TipoUsuario; label: string }[] = [
  { value: "admin", label: "Admin Master" },
  { value: "gestor", label: "Gestor Imobiliária" },
  { value: "atendente", label: "Atendente" },
  { value: "prestador", label: "Prestador" },
]

export default function UsuarioForm({ onSubmit, initialData, imobiliariaId }: UsuarioFormProps) {
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    nome: initialData?.nome ?? "",
    email: initialData?.email ?? "",
    username: initialData?.username ?? "",
    tipo: (initialData?.tipo ?? "atendente") as TipoUsuario,
    ativo: initialData?.ativo ?? true,
    senha: "",
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      await onSubmit({
        imobiliaria_id: imobiliariaId,
        nome: form.nome,
        email: form.email,
        username: form.username,
        tipo: form.tipo,
        ativo: form.ativo,
        senha: form.senha,
      })
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erro ao salvar usuário."
      alert(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-xl space-y-4">
      <Input
        label="Nome"
        value={form.nome}
        onChange={(e) => setForm({ ...form, nome: e.target.value })}
        required
      />
      <Input
        label="E-mail"
        type="email"
        value={form.email}
        onChange={(e) => setForm({ ...form, email: e.target.value })}
        required
      />
      <Input
        label="Usuário (login)"
        value={form.username}
        onChange={(e) => setForm({ ...form, username: e.target.value })}
        placeholder="nome.usuario"
        required
      />
      <Input
        label="Senha"
        type="password"
        value={form.senha}
        onChange={(e) => setForm({ ...form, senha: e.target.value })}
        minLength={6}
        placeholder="Mínimo 6 caracteres"
        required
      />
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-gray-700">Perfil</label>
        <select
          value={form.tipo}
          onChange={(e) => setForm({ ...form, tipo: e.target.value as TipoUsuario })}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          required
        >
          {TIPOS.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </div>
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="ativo"
          checked={form.ativo}
          onChange={(e) => setForm({ ...form, ativo: e.target.checked })}
          className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
        />
        <label htmlFor="ativo" className="text-sm font-medium text-gray-700">
          Ativo
        </label>
      </div>
      <Button type="submit" disabled={loading}>
        {loading ? "Salvando..." : "Salvar Usuário"}
      </Button>
    </form>
  )
}
