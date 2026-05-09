import { useEffect, useMemo, useState } from "react"
import axios from "axios"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { fetchJobs, type Job } from "@/lib/jobsApi"
import {
  createReminder,
  deleteReminder,
  fetchReminders,
  REMINDER_STATUS_OPTIONS,
  toDateTimeLocalInputValue,
  updateReminder,
  type Reminder,
  type ReminderStatus,
} from "@/lib/remindersApi"
import { getSessionUser } from "@/lib/sessionUser"

type ReminderFormState = {
  title: string
  description: string
  reminder_datetime: string
  status: ReminderStatus
  job_id: string
}

function emptyForm(): ReminderFormState {
  return {
    title: "",
    description: "",
    reminder_datetime: "",
    status: "pending",
    job_id: "none",
  }
}

export default function ReminderPage() {
  const [reminders, setReminders] = useState<Reminder[]>([])
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [form, setForm] = useState<ReminderFormState>(emptyForm())
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [editingReminder, setEditingReminder] = useState<Reminder | null>(null)

  const session = useMemo(() => getSessionUser(), [])

  const userId = session?.id ?? null

  const loadData = async () => {
    if (!userId) {
      setError("Please log in to manage reminders.")
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)
      const [reminderRows, jobRows] = await Promise.all([fetchReminders(userId), fetchJobs(userId)])
      setReminders(reminderRows)
      setJobs(jobRows)
    } catch (err) {
      console.error("Failed to load reminders:", err)
      if (axios.isAxiosError(err) && err.response?.data && typeof err.response.data === "object") {
        setError((err.response.data as { message?: string }).message ?? "Could not load reminders.")
      } else {
        setError("Could not load reminders.")
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadData()
  }, [userId])

  const openAddDialog = () => {
    setEditingReminder(null)
    setForm(emptyForm())
    setFormErrors({})
    setSaveError(null)
    setDialogOpen(true)
  }

  const openEditDialog = (item: Reminder) => {
    setEditingReminder(item)
    setForm({
      title: item.title ?? "",
      description: item.description ?? "",
      reminder_datetime: toDateTimeLocalInputValue(item.reminder_datetime),
      status: item.status ?? "pending",
      job_id: item.job_id ? String(item.job_id) : "none",
    })
    setFormErrors({})
    setSaveError(null)
    setDialogOpen(true)
  }

  const validate = (): boolean => {
    const nextErrors: Record<string, string> = {}
    if (!form.title.trim()) nextErrors.title = "Reminder title is required."
    if (!form.reminder_datetime) nextErrors.reminder_datetime = "Reminder date and time is required."
    if (form.job_id !== "none") {
      const parsed = Number.parseInt(form.job_id, 10)
      if (!Number.isInteger(parsed) || parsed < 1) nextErrors.job_id = "Invalid selected job."
    }
    setFormErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const handleSave = async () => {
    if (!userId) return
    if (!validate()) return

    try {
      setSaving(true)
      setSaveError(null)
      const payload = {
        user_id: userId,
        title: form.title.trim(),
        description: form.description.trim() || null,
        reminder_datetime: new Date(form.reminder_datetime).toISOString(),
        status: form.status,
        job_id: form.job_id === "none" ? null : Number.parseInt(form.job_id, 10),
      }

      if (editingReminder) {
        await updateReminder(editingReminder.id, payload)
      } else {
        await createReminder(payload)
      }
      setDialogOpen(false)
      await loadData()
    } catch (err) {
      console.error("Failed to save reminder:", err)
      if (axios.isAxiosError(err) && err.response?.data && typeof err.response.data === "object") {
        setSaveError((err.response.data as { message?: string }).message ?? "Could not save reminder.")
      } else {
        setSaveError("Could not save reminder.")
      }
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!userId) return
    const ok = window.confirm("Delete this reminder?")
    if (!ok) return

    try {
      setDeletingId(id)
      await deleteReminder(id, userId)
      setReminders((prev) => prev.filter((r) => r.id !== id))
    } catch (err) {
      console.error("Failed to delete reminder:", err)
      window.alert("Could not delete reminder.")
    } finally {
      setDeletingId(null)
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">Loading reminders...</p>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Reminders</h1>
          <p className="text-sm text-muted-foreground mt-1">Track follow-ups, interview dates, and deadlines.</p>
        </div>
        <Button type="button" onClick={openAddDialog} disabled={!userId}>
          Add reminder
        </Button>
      </div>

      {error && (
        <p className="text-destructive text-sm" role="alert">
          {error}
        </p>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">All reminders</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {reminders.length === 0 ? (
            <p className="text-sm text-muted-foreground">No reminders yet.</p>
          ) : (
            reminders.map((item) => (
              <div key={item.id} className="rounded border p-3 flex flex-wrap items-start justify-between gap-4">
                <div className="space-y-1">
                  <p className="font-medium">{item.title}</p>
                  <p className="text-sm text-muted-foreground">{item.description || "No description"}</p>
                  <p className="text-xs text-muted-foreground">
                    Remind at: {toDateTimeLocalInputValue(item.snoozed_until ?? item.reminder_datetime) || "—"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Status: <span className="capitalize">{item.status}</span>
                    {item.job_id ? ` | Job ID: ${item.job_id}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => openEditDialog(item)}>
                    Edit
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={deletingId === item.id}
                    onClick={() => void handleDelete(item.id)}
                  >
                    {deletingId === item.id ? "Deleting..." : "Delete"}
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingReminder ? "Edit reminder" : "Add reminder"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <Field data-invalid={!!formErrors.title}>
              <FieldLabel htmlFor="reminder_title">Reminder title *</FieldLabel>
              <Input
                id="reminder_title"
                value={form.title}
                onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                placeholder="e.g. Follow up with HR"
              />
              <FieldError errors={formErrors.title ? [{ message: formErrors.title }] : []} />
            </Field>

            <Field>
              <FieldLabel htmlFor="reminder_description">Reminder description</FieldLabel>
              <Textarea
                id="reminder_description"
                value={form.description}
                onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                rows={3}
              />
            </Field>

            <Field data-invalid={!!formErrors.reminder_datetime}>
              <FieldLabel htmlFor="reminder_datetime">Reminder date and time *</FieldLabel>
              <Input
                id="reminder_datetime"
                type="datetime-local"
                value={form.reminder_datetime}
                onChange={(e) => setForm((prev) => ({ ...prev, reminder_datetime: e.target.value }))}
              />
              <FieldError errors={formErrors.reminder_datetime ? [{ message: formErrors.reminder_datetime }] : []} />
            </Field>

            <Field>
              <FieldLabel htmlFor="reminder_status">Status</FieldLabel>
              <Select
                value={form.status}
                onValueChange={(value) => setForm((prev) => ({ ...prev, status: value as ReminderStatus }))}
              >
                <SelectTrigger id="reminder_status" className="w-full">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {REMINDER_STATUS_OPTIONS.map((opt) => (
                    <SelectItem key={opt} value={opt}>
                      {opt}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field data-invalid={!!formErrors.job_id}>
              <FieldLabel htmlFor="reminder_job_id">Related job (optional)</FieldLabel>
              <Select value={form.job_id} onValueChange={(value) => setForm((prev) => ({ ...prev, job_id: value }))}>
                <SelectTrigger id="reminder_job_id" className="w-full">
                  <SelectValue placeholder="No job selected" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No job selected</SelectItem>
                  {jobs.map((job) => (
                    <SelectItem key={job.job_id} value={String(job.job_id)}>
                      #{job.job_id} - {job.job_title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldError errors={formErrors.job_id ? [{ message: formErrors.job_id }] : []} />
            </Field>

            {saveError && (
              <p className="text-destructive text-sm" role="alert">
                {saveError}
              </p>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="button" disabled={saving} onClick={() => void handleSave()}>
              {saving ? "Saving..." : editingReminder ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}