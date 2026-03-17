import { INSPECTION_STATUS_LABEL } from "@/lib/labels"
import type { InspectionStatus } from "@/types/database.types"

const STATUS_CLASSES: Record<InspectionStatus, string> = {
  new: "bg-purple-100 text-purple-700",
  received: "bg-blue-100 text-blue-700",
  in_progress: "bg-yellow-100 text-yellow-700",
  completed: "bg-green-100 text-green-700",
  awaiting_contract: "bg-orange-100 text-orange-700",
  finalized: "bg-emerald-200 text-emerald-800",
  canceled: "bg-gray-100 text-gray-500",
}

export default function StatusBadge({ status }: { status: InspectionStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_CLASSES[status]}`}
    >
      {INSPECTION_STATUS_LABEL[status]}
    </span>
  )
}
