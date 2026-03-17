import { supabase } from "@/lib/supabaseClient"
import type { InspectionStatus } from "@/types/database.types"

export async function recordInspectionStatusEvent(input: {
  inspectionId: string
  fromStatus: InspectionStatus | null
  toStatus: InspectionStatus
  changedBy: string | null
  changedAt?: string
}) {
  const { error } = await supabase.from("inspection_status_events").insert({
    inspection_id: input.inspectionId,
    from_status: input.fromStatus,
    to_status: input.toStatus,
    changed_by: input.changedBy,
    changed_at: input.changedAt ?? new Date().toISOString(),
  })

  if (error) {
    console.warn("Falha ao registrar histórico de status.", error)
  }
}
