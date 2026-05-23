import { supabase } from "@/lib/supabaseClient"
import { Prestador } from "@/types/database.types"

const PAGAMENTO_MARKER = "[PAGAMENTO_JSON]"

type PrestadorPayload = Omit<Prestador, "id" | "created_at">

function extrairColunaAusente(message: string | undefined): string | null {
  if (!message) return null

  const match = message.match(/Could not find the '([^']+)' column/)
  return match?.[1] ?? null
}

function construirResumoPagamento(prestador: PrestadorPayload): string | null {
  const pagamento = {
    faturamento_tipo: prestador.faturamento_tipo,
    metodo_recebimento: prestador.metodo_recebimento,
    dia_recebimento: prestador.dia_recebimento,
    dados_recebimento: prestador.dados_recebimento,
  }

  const temDados = Object.values(pagamento).some((value) => Boolean(value))
  if (!temDados) return null

  return `${PAGAMENTO_MARKER}${JSON.stringify(pagamento)}`
}

function limparOuExtrairPagamento(especialidade: string | null) {
  const base = {
    especialidadeLimpa: especialidade,
    faturamento_tipo: null as Prestador["faturamento_tipo"],
    metodo_recebimento: null as Prestador["metodo_recebimento"],
    dia_recebimento: null as Prestador["dia_recebimento"],
    dados_recebimento: null as Prestador["dados_recebimento"],
  }

  if (!especialidade) return base

  const markerIndex = especialidade.indexOf(PAGAMENTO_MARKER)
  if (markerIndex === -1) return base

  const jsonRaw = especialidade.slice(markerIndex + PAGAMENTO_MARKER.length).trim()
  const especialidadeLimpa = especialidade.slice(0, markerIndex).trim() || null

  try {
    const parsed = JSON.parse(jsonRaw) as Partial<PrestadorPayload>

    return {
      especialidadeLimpa,
      faturamento_tipo: (parsed.faturamento_tipo as Prestador["faturamento_tipo"]) ?? null,
      metodo_recebimento: (parsed.metodo_recebimento as Prestador["metodo_recebimento"]) ?? null,
      dia_recebimento: (parsed.dia_recebimento as Prestador["dia_recebimento"]) ?? null,
      dados_recebimento: (parsed.dados_recebimento as Prestador["dados_recebimento"]) ?? null,
    }
  } catch {
    return {
      ...base,
      especialidadeLimpa,
    }
  }
}

function normalizarPrestador(prestador: Record<string, unknown>): Prestador {
  const especialidadeOriginal = (prestador.especialidade as string | null) ?? null
  const pagamentoFallback = limparOuExtrairPagamento(especialidadeOriginal)

  return {
    id: prestador.id as string,
    imobiliaria_id: prestador.imobiliaria_id as string,
    nome: prestador.nome as string,
    telefone: (prestador.telefone as string | null) ?? null,
    especialidade: pagamentoFallback.especialidadeLimpa,
    faturamento_tipo:
      (prestador.faturamento_tipo as Prestador["faturamento_tipo"]) ??
      pagamentoFallback.faturamento_tipo,
    metodo_recebimento:
      (prestador.metodo_recebimento as Prestador["metodo_recebimento"]) ??
      pagamentoFallback.metodo_recebimento,
    dia_recebimento:
      (prestador.dia_recebimento as Prestador["dia_recebimento"]) ??
      pagamentoFallback.dia_recebimento,
    dados_recebimento:
      (prestador.dados_recebimento as Prestador["dados_recebimento"]) ??
      pagamentoFallback.dados_recebimento,
    created_at: prestador.created_at as string,
  }
}

function criarPayloadCompativel(prestador: PrestadorPayload): Omit<
  PrestadorPayload,
  "faturamento_tipo" | "metodo_recebimento" | "dia_recebimento" | "dados_recebimento"
> {
  const resumoPagamento = construirResumoPagamento(prestador)
  const especialidadeBase = (prestador.especialidade ?? "").trim()

  return {
    imobiliaria_id: prestador.imobiliaria_id,
    nome: prestador.nome,
    telefone: prestador.telefone,
    especialidade: resumoPagamento
      ? [especialidadeBase, resumoPagamento].filter(Boolean).join("\n")
      : prestador.especialidade,
  }
}

export async function listarPrestadores(imobiliaria_id: string) {
  const { data, error } = await supabase
    .from("prestadores")
    .select("*")
    .eq("imobiliaria_id", imobiliaria_id)

  if (error) throw error

  return ((data ?? []) as Record<string, unknown>[]).map(normalizarPrestador)
}

export async function criarPrestador(prestador: PrestadorPayload) {
  const { data, error } = await supabase
    .from("prestadores")
    .insert(prestador)
    .select()
    .single()

  if (!error && data) {
    return normalizarPrestador(data as Record<string, unknown>)
  }

  const colunaAusente = extrairColunaAusente(error?.message)
  const ehErroDeSchemaNovo =
    error?.code === "PGRST204" &&
    ["faturamento_tipo", "metodo_recebimento", "dia_recebimento", "dados_recebimento"].includes(
      colunaAusente ?? ""
    )

  if (!ehErroDeSchemaNovo) {
    throw error
  }

  const payloadCompat = criarPayloadCompativel(prestador)
  const { data: compatData, error: compatError } = await supabase
    .from("prestadores")
    .insert(payloadCompat)
    .select()
    .single()

  if (compatError) {
    throw compatError
  }

  return normalizarPrestador(compatData as Record<string, unknown>)
}

export async function atualizarPrestador(id: string, prestador: Partial<Prestador>) {
  const { data, error } = await supabase
    .from("prestadores")
    .update(prestador)
    .eq("id", id)
    .select()
    .single()

  if (error) throw error
  return normalizarPrestador(data as Record<string, unknown>)
}
