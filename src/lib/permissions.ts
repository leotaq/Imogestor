import { TipoUsuario } from "@/types/database.types"

export interface MenuItem {
  label: string
  href: string
  icon: string
}

const ROTAS_POR_PERFIL: Record<TipoUsuario, string[]> = {
  admin: [
    "/dashboard",
    "/imoveis",
    "/vistorias",
    "/manutencoes",
    "/orcamentos",
    "/prestadores",
    "/execucao",
    "/financeiro",
    "/relatorios",
    "/usuarios",
  ],
  gestor: [
    "/dashboard",
    "/imoveis",
    "/vistorias",
    "/manutencoes",
    "/orcamentos",
    "/prestadores",
    "/execucao",
    "/financeiro",
    "/relatorios",
    "/usuarios",
  ],
  atendente: [
    "/dashboard",
    "/imoveis",
    "/vistorias",
    "/manutencoes",
    "/orcamentos",
    "/prestadores",
    "/execucao",
    "/relatorios",
  ],
  prestador: [
    "/dashboard",
    "/minhas-solicitacoes",
    "/meus-orcamentos",
  ],
}

export function rotasDoUsuario(tipo: TipoUsuario): string[] {
  return ROTAS_POR_PERFIL[tipo] ?? []
}

export function temAcesso(tipo: TipoUsuario | null, rota: string): boolean {
  if (!tipo) return false
  const rotas = ROTAS_POR_PERFIL[tipo]
  return rotas.some((r) => rota.startsWith(r))
}
