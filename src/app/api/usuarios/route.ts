import { NextRequest, NextResponse } from "next/server"
import { getSupabaseAdmin } from "@/lib/supabaseAdmin"

export async function POST(req: NextRequest) {
  try {
    const supabaseAdmin = getSupabaseAdmin()
    const body = await req.json()
    const { nome, email, username, tipo, ativo, imobiliaria_id, senha } = body

    if (!email || !senha || !nome || !username || !tipo || !imobiliaria_id) {
      return NextResponse.json(
        { error: "Campos obrigatórios: nome, email, username, tipo, imobiliaria_id, senha" },
        { status: 400 }
      )
    }

    // 1. Criar usuário no Supabase Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: senha,
      email_confirm: true,
    })

    if (authError) {
      return NextResponse.json(
        { error: `Erro ao criar login: ${authError.message}` },
        { status: 400 }
      )
    }

    // 2. Inserir na tabela usuarios
    const { data: usuario, error: dbError } = await supabaseAdmin
      .from("usuarios")
      .insert({
        nome,
        email,
        username,
        tipo,
        ativo: ativo ?? true,
        imobiliaria_id,
      })
      .select()
      .single()

    if (dbError) {
      // Rollback: deletar o auth user criado
      if (authData.user) {
        await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
      }
      return NextResponse.json(
        { error: `Erro ao salvar usuário: ${dbError.message}` },
        { status: 400 }
      )
    }

    return NextResponse.json(usuario, { status: 201 })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erro interno do servidor" },
      { status: 500 }
    )
  }
}
