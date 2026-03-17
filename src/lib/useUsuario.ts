"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabaseClient"
import { Usuario, TipoUsuario } from "@/types/database.types"

interface UsuarioContexto {
  usuario: Usuario | null
  imobiliariaId: string | null
  tipo: TipoUsuario | null
  loading: boolean
}

export function useUsuario(): UsuarioContexto {
  const [usuario, setUsuario] = useState<Usuario | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let ativo = true

    async function carregarPerfil(email?: string | null) {
      if (!ativo) return

      if (!email) {
        setUsuario(null)
        setLoading(false)
        return
      }

      setLoading(true)

      const { data, error } = await supabase
        .from("usuarios")
        .select("*")
        .ilike("email", email)
        .maybeSingle()

      if (!ativo) return

      if (error) {
        console.error("Erro ao carregar perfil do usuario", error)
        setUsuario(null)
        setLoading(false)
        return
      }

      setUsuario((data as Usuario | null) ?? null)
      setLoading(false)
    }

    async function carregarSessaoInicial() {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession()

      if (error) {
        console.error("Erro ao carregar sessao", error)
        if (ativo) {
          setUsuario(null)
          setLoading(false)
        }
        return
      }

      await carregarPerfil(session?.user.email)
    }

    void carregarSessaoInicial()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setTimeout(() => {
        void carregarPerfil(session?.user.email)
      }, 0)
    })

    return () => {
      ativo = false
      subscription.unsubscribe()
    }
  }, [])

  return {
    usuario,
    imobiliariaId: usuario?.imobiliaria_id ?? null,
    tipo: usuario?.tipo ?? null,
    loading,
  }
}
