import type { LucideIcon } from "lucide-react"
import {
  Ban,
  CircleDashed,
  ClipboardCheck,
  Gift,
  Mic2,
  PenLine,
  Phone,
  Send,
  SquareCheckBig,
} from "lucide-react"
import type { JobStatus } from "@/lib/jobsApi"

type StatusVisual = { Icon: LucideIcon; iconClass: string }

const STATUS_VISUAL: Record<JobStatus, StatusVisual> = {
  "Not Applied": {
    Icon: CircleDashed,
    iconClass: "text-muted-foreground",
  },
  Applied: {
    Icon: Send,
    iconClass: "text-sky-600",
  },
  "Interview Call": {
    Icon: Phone,
    iconClass: "text-violet-600",
  },
  "Interview Given": {
    Icon: Mic2,
    iconClass: "text-purple-600",
  },
  "Test Call": {
    Icon: PenLine,
    iconClass: "text-amber-600",
  },
  "Test Given": {
    Icon: ClipboardCheck,
    iconClass: "text-orange-600",
  },
  "Offer Received": {
    Icon: Gift,
    iconClass: "text-emerald-600",
  },
  "Offer Accepted": {
    Icon: SquareCheckBig,
    iconClass: "text-green-700",
  },
  Rejected: {
    Icon: Ban,
    iconClass: "text-red-600",
  },
}

/** Icon + Tailwind colour class beside status labels on job listings. */
export function getJobStatusDisplay(status: JobStatus): StatusVisual {
  return STATUS_VISUAL[status]
}
