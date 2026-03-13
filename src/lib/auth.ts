import { supabase } from "./supabaseClient"

export async function getUsuarioAtual() {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user
}

export async function getSession() {
  const {
    data: { session },
  } = await supabase.auth.getSession()
  return session
}

export async function logout() {
  await supabase.auth.signOut()
}
