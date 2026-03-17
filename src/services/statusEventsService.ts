import { supabase } from "@/lib/supabaseClient"
import { InspectionStatusEvent } from "@/types/database.types"

export async function listarStatusEvents(inspection_id: string) {
  const { data, error } = await supabase
    .from("inspection_status_events")
    .select("*")
    .eq("inspection_id", inspection_id)
    .order("changed_at", { ascending: true })

  if (error) throw error
  return data as InspectionStatusEvent[]
}
