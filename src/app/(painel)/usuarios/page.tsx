"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useUsuario } from "@/lib/useUsuario"
import { listarUsuarios } from "@/services/usuariosService"
import { Usuario } from "@/types/database.types"
import Table from "@/components/ui/Table"
import Button from "@/components/ui/Button"

const LABEL_TIPO: Record<string, string> = {
  admin: "Admin Master",
  gestor: "Gestor",
  atendente: "Atendente",
  prestador: "Prestador",
}

export default function UsuariosPage() {
  const { imobiliariaId, loading: loadingUser } = useUsuario()
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!imobiliariaId) return
    listarUsuarios(imobiliariaId).then((data) => {
      setUsuarios(data)
      setLoading(false)
    })
  }, [imobiliariaId])

  if (loadingUser || loading) return <p className="text-gray-500">Carregando...</p>

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Usuários</h1>
        <Link href="/usuarios/novo">
          <Button>Novo Usuário</Button>
        </Link>
      </div>
      <Table
        columns={[
          { key: "nome", label: "Nome" },
          { key: "username", label: "Usuário" },
          { key: "email", label: "E-mail" },
          {
            key: "tipo",
            label: "Perfil",
            render: (u) => (
              <span className="inline-block px-2 py-1 text-xs font-medium rounded-full bg-primary-50 text-primary-700">
                {LABEL_TIPO[u.tipo] ?? u.tipo}
              </span>
            ),
          },
          {
            key: "ativo",
            label: "Status",
            render: (u) => (
              <span
                className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${
                  u.ativo
                    ? "bg-green-50 text-green-700"
                    : "bg-red-50 text-red-700"
                }`}
              >
                {u.ativo ? "Ativo" : "Inativo"}
              </span>
            ),
          },
        ]}
        data={usuarios}
        emptyMessage="Nenhum usuário cadastrado."
      />
    </div>
  )
}
