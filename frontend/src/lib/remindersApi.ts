import axios from "axios"

const REMINDERS_URL = "http://localhost:5000/api/reminders"

export const REMINDER_STATUS_OPTIONS = ["pending", "completed", "dismissed"] as const
export type ReminderStatus = (typeof REMINDER_STATUS_OPTIONS)[number]

export type Reminder = {
  id: number
  user_id: number
  job_id: number | null
  title: string
  description: string | null
  reminder_datetime: string
  status: ReminderStatus
  snoozed_until: string | null
  created_at: string
  updated_at: string
}

export type ReminderPayload = {
  user_id: number
  job_id?: number | null
  title: string
  description?: string | null
  reminder_datetime: string
  status?: ReminderStatus
  snoozed_until?: string | null
}

export type ReminderUpdatePayload = Partial<Omit<ReminderPayload, "user_id">> & {
  user_id: number
}

export async function fetchReminders(userId: number, status?: ReminderStatus): Promise<Reminder[]> {
  const params = new URLSearchParams({ user_id: String(userId) })
  if (status) params.set("status", status)
  const res = await axios.get<{ data: Reminder[] }>(`${REMINDERS_URL}?${params.toString()}`)
  return res.data.data ?? []
}

export async function createReminder(payload: ReminderPayload): Promise<number> {
  const res = await axios.post<{ id: number }>(REMINDERS_URL, payload)
  return res.data.id
}

export async function updateReminder(reminderId: number, payload: ReminderUpdatePayload): Promise<void> {
  await axios.put(`${REMINDERS_URL}/${reminderId}`, payload)
}

export async function deleteReminder(reminderId: number, userId: number): Promise<void> {
  await axios.delete(`${REMINDERS_URL}/${reminderId}?user_id=${encodeURIComponent(String(userId))}`)
}

export function toDateTimeLocalInputValue(value: string | null | undefined): string {
  if (!value) return ""
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return ""
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, "0")
  const dd = String(d.getDate()).padStart(2, "0")
  const hh = String(d.getHours()).padStart(2, "0")
  const mi = String(d.getMinutes()).padStart(2, "0")
  return `${yyyy}-${mm}-${dd}T${hh}:${mi}`
}
