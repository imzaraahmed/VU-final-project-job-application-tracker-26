import axios from "axios"

const NOTIFICATIONS_URL = "http://localhost:5000/api/notifications"

export type AppNotification = {
  id: number
  user_id: number
  reminder_id: number | null
  job_id: number | null
  title: string
  message: string
  is_read: number | boolean
  sent_at: string
  created_at: string
  updated_at: string
}

export function isNotificationUnread(n: AppNotification): boolean {
  const v = n.is_read
  if (typeof v === "boolean") return !v
  return Number(v) === 0
}

export async function fetchNotifications(
  userId: number,
  opts?: { unreadOnly?: boolean; limit?: number }
): Promise<AppNotification[]> {
  const params = new URLSearchParams({ user_id: String(userId) })
  if (opts?.unreadOnly) params.set("unread_only", "1")
  if (opts?.limit) params.set("limit", String(opts.limit))
  const res = await axios.get<{ data: AppNotification[] }>(`${NOTIFICATIONS_URL}?${params.toString()}`)
  return res.data.data ?? []
}

export async function fetchUnreadNotificationCount(userId: number): Promise<number> {
  const params = new URLSearchParams({ user_id: String(userId) })
  const res = await axios.get<{ unread_count: number }>(`${NOTIFICATIONS_URL}/unread-count?${params.toString()}`)
  return Number(res.data.unread_count ?? 0)
}

export async function markNotificationRead(notificationId: number, userId: number): Promise<void> {
  await axios.patch(`${NOTIFICATIONS_URL}/${notificationId}/read`, { user_id: userId })
}

export async function markAllNotificationsRead(userId: number): Promise<void> {
  await axios.patch(`${NOTIFICATIONS_URL}/read-all`, { user_id: userId })
}

export async function triggerReminderNotificationCheck(): Promise<void> {
  await axios.post(`${NOTIFICATIONS_URL}/run-reminder-check`)
}
