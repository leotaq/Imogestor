"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabaseClient"
import Button from "@/components/ui/Button"
import Input from "@/components/ui/Input"

export default function LoginPage() {
  const router = useRouter()
  const [login, setLogin] = useState("")
  const [senha, setSenha] = useState("")
  const [erro, setErro] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setErro("")
    setLoading(true)

    let email = login.trim()

    if (!email) {
      setErro("Informe seu e-mail ou usuario.")
      setLoading(false)
      return
    }

    if (!email.includes("@")) {
      const { data, error } = await supabase
        .from("usuarios")
        .select("email, ativo")
        .ilike("username", email)
        .maybeSingle()

      if (error || !data) {
        setErro("Usuario nao encontrado.")
        setLoading(false)
        return
      }

      if (!data.ativo) {
        setErro("Seu usuario esta inativo.")
        setLoading(false)
        return
      }

      email = data.email
    }

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password: senha,
    })

    if (error) {
      setErro("Credenciais invalidas.")
      setLoading(false)
      return
    }

    const { data: usuario, error: usuarioError } = await supabase
      .from("usuarios")
      .select("id, ativo")
      .ilike("email", email)
      .maybeSingle()

    if (usuarioError || !usuario) {
      await supabase.auth.signOut()
      setErro("Login autenticado, mas seu cadastro nao foi encontrado na tabela usuarios.")
      setLoading(false)
      return
    }

    if (!usuario.ativo) {
      await supabase.auth.signOut()
      setErro("Seu usuario esta inativo.")
      setLoading(false)
      return
    }

    router.replace("/dashboard")
    router.refresh()
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200 w-full max-w-md">
        <h1 className="text-2xl font-bold text-center mb-2">ImobiGestor</h1>
        <p className="text-sm text-gray-500 text-center mb-6">
          Acesse sua conta para continuar
        </p>

        <form onSubmit={handleLogin} className="space-y-4">
          <Input
            label="E-mail ou Usuario"
            type="text"
            value={login}
            onChange={(e) => setLogin(e.target.value)}
            placeholder="email@exemplo.com ou nome.usuario"
            required
          />
          <Input
            label="Senha"
            type="password"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            required
          />

          {erro && (
            <p className="text-sm text-red-500 text-center">{erro}</p>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Entrando..." : "Entrar"}
          </Button>
        </form>
      </div>
    </div>
  )
}
