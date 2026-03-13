"use client"

import { useRouter } from "next/navigation"
import ImovelForm from "@/components/forms/ImovelForm"
import { criarImovel } from "@/services/imoveisService"
import { Imovel } from "@/types/database.types"

export default function NovoImovelPage() {
  const router = useRouter()

  async function handleSubmit(dados: Omit<Imovel, "id">) {
    await criarImovel(dados)
    router.push("/imoveis")
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Novo Imóvel</h1>
      <ImovelForm onSubmit={handleSubmit} />
    </div>
  )
}
