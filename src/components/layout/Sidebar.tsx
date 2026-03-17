"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Home,
  Building2,
  ClipboardCheck,
  Wrench,
  FileText,
  Users,
  Play,
  DollarSign,
  BarChart3,
  UserCog,
  type LucideIcon,
} from "lucide-react"
import { useUsuario } from "@/lib/useUsuario"
import { rotasDoUsuario } from "@/lib/permissions"

interface MenuItemDef {
  label: string
  href: string
  icon: LucideIcon
}

const todosMenuItems: MenuItemDef[] = [
  { label: "Dashboard", href: "/dashboard", icon: Home },
  { label: "Imóveis", href: "/imoveis", icon: Building2 },
  { label: "Vistorias", href: "/vistorias", icon: ClipboardCheck },
  { label: "Manutenções", href: "/manutencoes", icon: Wrench },
  { label: "Orçamentos", href: "/orcamentos", icon: FileText },
  { label: "Prestadores", href: "/prestadores", icon: Users },
  { label: "Execução", href: "/execucao", icon: Play },
  { label: "Financeiro", href: "/financeiro", icon: DollarSign },
  { label: "Relatórios", href: "/relatorios", icon: BarChart3 },
  { label: "Usuários", href: "/usuarios", icon: UserCog },
]

export default function Sidebar() {
  const pathname = usePathname()
  const { tipo } = useUsuario()

  const rotasPermitidas = tipo ? rotasDoUsuario(tipo) : []
  const menuItems = todosMenuItems.filter((item) =>
    rotasPermitidas.includes(item.href)
  )

  return (
    <aside className="w-64 min-h-screen bg-white border-r border-gray-200 flex flex-col">
      <div className="p-6 border-b border-gray-200">
        <h1 className="text-xl font-bold text-primary-700">ImobiGestor</h1>
      </div>
      <nav className="flex-1 p-4 space-y-1">
        {menuItems.map((item) => {
          const isActive = pathname.startsWith(item.href)
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? "bg-primary-50 text-primary-700"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              }`}
            >
              <Icon size={18} />
              {item.label}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
