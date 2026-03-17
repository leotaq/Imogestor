import { supabase } from "@/lib/supabaseClient"
import { Inspection, InspectionStatus } from "@/types/database.types"
import { recordInspectionStatusEvent } from "@/lib/inspectionStatusEvent"

export async function listarInspections(imobiliaria_id: string) {
  const { data, error } = await supabase
    .from("inspections")
    .select("*")
    .eq("imobiliaria_id", imobiliaria_id)
    .order("created_at", { ascending: false })

  if (error) throw error
  return data as Inspection[]
}

export async function buscarInspection(id: string) {
  const { data, error } = await supabase
    .from("inspections")
    .select("*")
    .eq("id", id)
    .single()

  if (error) throw error
  return data as Inspection
}

export async function criarInspection(
  inspection: Omit<Inspection, "id" | "created_at" | "updated_at" | "status" | "received_at" | "completed_at">,
  changedBy: string | null
) {
  const { data, error } = await supabase
    .from("inspections")
    .insert({ ...inspection, status: "new" })
    .select()
    .single()

  if (error) throw error

  const created = data as Inspection
  await recordInspectionStatusEvent({
    inspectionId: created.id,
    fromStatus: null,
    toStatus: "new",
    changedBy,
  })

  return created
}

export async function transitarStatus(
  id: string,
  fromStatus: InspectionStatus,
  toStatus: InspectionStatus,
  changedBy: string | null,
  extraFields?: Partial<Inspection>
) {
  const updatePayload: Record<string, unknown> = {
    status: toStatus,
    ...extraFields,
  }

  const { data, error } = await supabase
    .from("inspections")
    .update(updatePayload)
    .eq("id", id)
    .eq("status", fromStatus)
    .select()
    .single()

  if (error) throw error

  const updated = data as Inspection
  await recordInspectionStatusEvent({
    inspectionId: id,
    fromStatus,
    toStatus,
    changedBy,
  })

  return updated
}

export async function receberInspection(
  id: string,
  changedBy: string,
  schedule: {
    scheduled_start: string
    duration_minutes: number
    scheduled_end: string
  }
) {
  return transitarStatus(id, "new", "received", changedBy, {
    ...schedule,
    received_at: new Date().toISOString(),
  })
}

export async function iniciarInspection(id: string, changedBy: string) {
  return transitarStatus(id, "received", "in_progress", changedBy)
}

export async function completarInspection(id: string, changedBy: string) {
  return transitarStatus(id, "in_progress", "completed", changedBy, {
    completed_at: new Date().toISOString(),
  })
}

export async function finalizarInspection(id: string, changedBy: string) {
  return transitarStatus(id, "completed", "finalized", changedBy)
}

export async function cancelarInspection(
  id: string,
  currentStatus: InspectionStatus,
  changedBy: string
) {
  return transitarStatus(id, currentStatus, "canceled", changedBy)
}

export async function agendarInspection(
  id: string,
  changedBy: string,
  schedule: {
    scheduled_start: string
    duration_minutes: number
    scheduled_end: string
  }
) {
  const { data, error } = await supabase
    .from("inspections")
    .update(schedule)
    .eq("id", id)
    .select()
    .single()

  if (error) throw error
  return data as Inspection
}
