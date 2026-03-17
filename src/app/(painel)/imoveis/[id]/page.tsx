"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { buscarImovel, atualizarImovel } from "@/services/imoveisService"
import { Imovel } from "@/types/database.types"
import ImovelForm from "@/components/forms/ImovelForm"

export default function EditarImovelPage() {
  const params = useParams()
  const router = useRouter()
  const [imovel, setImovel] = useState<Imovel | null>(null)

  useEffect(() => {
    async function carregar() {
      const data = await buscarImovel(params.id as string)
      setImovel(data)
    }
    carregar()
  }, [params.id])

  async function handleSubmit(dados: Omit<Imovel, "id" | "created_at">) {
    await atualizarImovel(params.id as string, dados)
    router.push("/imoveis")
  }

  if (!imovel) return <p className="text-gray-500">Carregando...</p>

  return (
    <div className="space-y-6">
      <div className="max-w-3xl">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Editar imovel</h1>
        <p className="mt-2 text-sm text-gray-500">
          Atualize as informacoes do cadastro para manter endereco e contato sempre corretos.
        </p>
      </div>

      <ImovelForm onSubmit={handleSubmit} initialData={imovel} />
    </div>
  )
}
