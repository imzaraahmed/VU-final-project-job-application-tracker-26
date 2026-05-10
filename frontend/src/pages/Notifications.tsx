import { useCallback, useEffect, useMemo, useState } from "react"
import axios from "axios"
import { Link } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  fetchNotifications,
  isNotificationUnread,
  markAllNotificationsRead,
  markNotificationRead,
  triggerReminderNotificationCheck,
  type AppNotification,
} from "@/lib/notificationsApi"
import { getSessionUser } from "@/lib/sessionUser"

function formatDateTime(value: string | null | undefined): string {
  if (!value) return "—"
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  return d.toLocaleString()
}

export default function NotificationsPage() {
  const session = useMemo(() => getSessionUser(), [])
  const userId = session?.id ?? null

  const [items, setItems] = useState<AppNotification[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filterUnread, setFilterUnread] = useState(false)
  const [busyId, setBusyId] = useState<number | null>(null)
  const [markingAll, setMarkingAll] = useState(false)
  const [syncing, setSyncing] = useState(false)

  const load = useCallback(async () => {
    if (!userId) {
      setError("Please log in to view notifications.")
      setLoading(false)
      return
    }
    try {
      setLoading(true)
      setError(null)
      const rows = await fetchNotifications(userId, { unreadOnly: filterUnread, limit: 200 })
      setItems(rows)
    } catch (err) {
      console.error(err)
      if (axios.isAxiosError(err) && err.response?.data && typeof err.response.data === "object") {
        setError((err.response.data as { message?: string }).message ?? "Could not load notifications.")
      } else {
        setError("Could not load notifications.")
      }
    } finally {
      setLoading(false)
    }
  }, [userId, filterUnread])

  useEffect(() => {
    void load()
  }, [load])

  const onMarkRead = async (n: AppNotification) => {
    if (!userId || !isNotificationUnread(n)) return
    try {
      setBusyId(n.id)
      await markNotificationRead(n.id, userId)
      await load()
    } catch (e) {
      console.error(e)
    } finally {
      setBusyId(null)
    }
  }

  const onMarkAll = async () => {
    if (!userId) return
    try {
      setMarkingAll(true)
      await markAllNotificationsRead(userId)
      await load()
    } catch (e) {
      console.error(e)
    } finally {
      setMarkingAll(false)
    }
  }

  const onSyncReminders = async () => {
    try {
      setSyncing(true)
      await triggerReminderNotificationCheck()
      await load()
    } catch (e) {
      console.error(e)
    } finally {
      setSyncing(false)
    }
  }

  const unreadCount = items.filter(isNotificationUnread).length

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Notifications</h1>
          <p className="text-muted-foreground text-sm">
            In-app alerts for due reminders. Email is sent when SMTP is configured on the server.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant={filterUnread ? "default" : "outline"} size="sm" onClick={() => setFilterUnread((v) => !v)}>
            {filterUnread ? "Showing unread" : "All"}
          </Button>
          <Button type="button" variant="outline" size="sm" disabled={!userId || markingAll} onClick={() => void onMarkAll()}>
            Mark all read
          </Button>
          <Button type="button" variant="secondary" size="sm" disabled={syncing} onClick={() => void onSyncReminders()} title="Ask server to process due reminders now">
            Check reminders
          </Button>
        </div>
      </div>

      {error ? <p className="text-destructive text-sm">{error}</p> : null}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-base font-medium">Activity</CardTitle>
          {!loading && userId ? (
            <span className="text-muted-foreground text-sm">
              {filterUnread ? `${unreadCount} unread (in view)` : `${items.length} shown`}
            </span>
          ) : null}
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground text-sm">Loading…</p>
          ) : !userId ? null : items.length === 0 ? (
            <p className="text-muted-foreground text-sm">No notifications yet. Due reminders appear here automatically.</p>
          ) : (
            <ul className="divide-y rounded-md border">
              {items.map((n) => {
                const unread = isNotificationUnread(n)
                return (
                  <li
                    key={n.id}
                    className={`flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-start sm:justify-between ${unread ? "bg-primary/5" : ""}`}
                  >
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium">{n.title}</span>
                        {unread ? <Badge variant="default">Unread</Badge> : <Badge variant="secondary">Read</Badge>}
                      </div>
                      <p className="text-muted-foreground text-sm whitespace-pre-wrap">{n.message}</p>
                      <p className="text-muted-foreground text-xs">{formatDateTime(n.sent_at)}</p>
                      {n.job_id ? (
                        <Link to={`/job/${n.job_id}`} className="text-primary text-sm font-medium hover:underline">
                          View related job
                        </Link>
                      ) : null}
                    </div>
                    {unread ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={busyId === n.id}
                        onClick={() => void onMarkRead(n)}
                      >
                        Mark read
                      </Button>
                    ) : null}
                  </li>
                )
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
