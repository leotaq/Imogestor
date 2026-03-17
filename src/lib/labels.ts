import type { InspectionType, InspectionStatus } from "@/types/database.types"

export const INSPECTION_TYPE_LABEL: Record<InspectionType, string> = {
  ocupacao: "Ocupação",
  desocupacao: "Desocupação",
  revistoria: "Revistoria",
  visita: "Visita",
  placa_fotos: "Placa/Fotos",
}

export const INSPECTION_STATUS_LABEL: Record<InspectionStatus, string> = {
  new: "Nova",
  received: "Recebida",
  in_progress: "Em andamento",
  completed: "Concluída",
  awaiting_contract: "Sem Contrato",
  finalized: "Finalizada",
  canceled: "Cancelada",
}
