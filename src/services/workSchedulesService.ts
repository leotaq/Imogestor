import { supabase } from "@/lib/supabaseClient"
import { WorkSchedule } from "@/types/database.types"

const DEFAULT_SCHEDULE: Omit<WorkSchedule, "person_id" | "updated_at"> = {
  work_start: 8,
  work_start_min: 0,
  lunch_start: 12,
  lunch_start_min: 0,
  lunch_end: 13,
  lunch_end_min: 0,
  work_end: 18,
  work_end_min: 0,
}

export async function buscarWorkSchedule(person_id: string) {
  const { data, error } = await supabase
    .from("work_schedules")
    .select("*")
    .eq("person_id", person_id)
    .single()

  if (error && error.code !== "PGRST116") throw error
  return (data as WorkSchedule) ?? { person_id, ...DEFAULT_SCHEDULE }
}

export async function salvarWorkSchedule(
  person_id: string,
  schedule: Omit<WorkSchedule, "person_id" | "updated_at">
) {
  const { data, error } = await supabase
    .from("work_schedules")
    .upsert({ person_id, ...schedule })
    .select()
    .single()

  if (error) throw error
  return data as WorkSchedule
}
