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

  async function handleSubmit(dados: Omit<Imovel, "id">) {
    await atualizarImovel(params.id as string, dados)
    router.push("/imoveis")
  }

  if (!imovel) return <p className="text-gray-500">Carregando...</p>

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Editar Imóvel</h1>
      <ImovelForm onSubmit={handleSubmit} initialData={imovel} />
    </div>
  )
}
