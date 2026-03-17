"use client"

import { useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import Sidebar from "@/components/layout/Sidebar"
import Header from "@/components/layout/Header"
import { useUsuario } from "@/lib/useUsuario"
import { temAcesso } from "@/lib/permissions"

export default function PainelLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const { usuario, tipo, loading } = useUsuario()

  useEffect(() => {
    if (loading) return
    if (!usuario) {
      router.replace("/login")
      return
    }
    if (tipo && !temAcesso(tipo, pathname)) {
      router.replace("/dashboard")
    }
  }, [loading, usuario, tipo, pathname, router])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500">Carregando...</p>
      </div>
    )
  }

  if (!usuario) return null

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header />
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  )
}
