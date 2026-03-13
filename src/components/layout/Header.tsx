"use client"

import { LogOut, User } from "lucide-react"
import { supabase } from "@/lib/supabaseClient"
import { useRouter } from "next/navigation"

export default function Header() {
  const router = useRouter()

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push("/login")
  }

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
      <div />
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <User size={18} />
          <span>Usuário</span>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-red-600 transition-colors"
        >
          <LogOut size={18} />
          Sair
        </button>
      </div>
    </header>
  )
}
