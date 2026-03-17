"use client"

// Re-exporta useUsuario para compatibilidade com imports existentes
import { useUsuario } from "@/lib/useUsuario"

export function useImobiliaria() {
  const { imobiliariaId, loading } = useUsuario()
  return { imobiliariaId, loading }
}
