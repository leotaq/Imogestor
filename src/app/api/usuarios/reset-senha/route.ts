import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabaseAdmin"

export async function POST(req: NextRequest) {
  try {
    const { email, novaSenha } = await req.json()

    if (!email || !novaSenha) {
      return NextResponse.json(
        { error: "Campos obrigatórios: email, novaSenha" },
        { status: 400 }
      )
    }

    // Buscar o auth user pelo email
    const { data: users, error: listError } = await supabaseAdmin.auth.admin.listUsers()

    if (listError) {
      return NextResponse.json(
        { error: `Erro ao buscar usuários: ${listError.message}` },
        { status: 500 }
      )
    }

    const authUser = users.users.find((u) => u.email === email)

    if (!authUser) {
      return NextResponse.json(
        { error: "Usuário não encontrado no Auth" },
        { status: 404 }
      )
    }

    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      authUser.id,
      { password: novaSenha }
    )

    if (updateError) {
      return NextResponse.json(
        { error: `Erro ao alterar senha: ${updateError.message}` },
        { status: 400 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}
