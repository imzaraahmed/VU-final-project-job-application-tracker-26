import { useEffect, useMemo, useState } from "react"
import { Link, useLocation } from "react-router-dom"
import axios from "axios"
import { BellPlus, Eye, MapPin, Pencil, PencilLine, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { fetchJobs, normalizeJobStatus, removeJob, toDateInputValue, type Job } from "@/lib/jobsApi"
import { getJobStatusDisplay } from "@/lib/jobStatusDisplay"
import {
  createReminder,
  fetchReminders,
  toDateTimeLocalInputValue,
  updateReminder,
  type Reminder,
} from "@/lib/remindersApi"
import { getSessionUser } from "@/lib/sessionUser"

function formatDisplayDate(value: string | null | undefined): string {
  if (!value) return "—"
  const d = toDateInputValue(value)
  return d || "—"
}

type ReminderFormState = {
  title: string
  description: string
  reminder_datetime: string
}

function emptyReminderForm(): ReminderFormState {
  return {
    title: "",
    description: "",
    reminder_datetime: "",
  }
}

export default function Joblist() {
  const location = useLocation()
  const session = useMemo(() => getSessionUser(), [location.pathname])
  const [jobs, setJobs] = useState<Job[]>([])
  const [loadError, setLoadError] = useState<string | null>(null)
  const [remindersByJobId, setRemindersByJobId] = useState<Record<number, Reminder>>({})
  const [remindersError, setRemindersError] = useState<string | null>(null)
  const [reminderDialogOpen, setReminderDialogOpen] = useState(false)
  const [reminderForm, setReminderForm] = useState<ReminderFormState>(emptyReminderForm())
  const [reminderFormErrors, setReminderFormErrors] = useState<Record<string, string>>({})
  const [savingReminder, setSavingReminder] = useState(false)
  const [savingReminderError, setSavingReminderError] = useState<string | null>(null)
  const [activeJobIdForReminder, setActiveJobIdForReminder] = useState<number | null>(null)
  const [editingReminder, setEditingReminder] = useState<Reminder | null>(null)

  const load = async () => {
    setLoadError(null)
    try {
      const rows = await fetchJobs(getSessionUser()?.id)
      setJobs(rows)
    } catch (err) {
      console.error("Failed to fetch jobs:", err)
      if (axios.isAxiosError(err) && err.response?.data && typeof err.response.data === "object") {
        const msg = (err.response.data as { message?: string }).message
        setLoadError(msg ?? "Could not load jobs.")
      } else {
        setLoadError("Could not load jobs.")
      }
    }
  }

  useEffect(() => {
    void load()
  }, [location.pathname])

  const loadReminders = async () => {
    const current = getSessionUser()
    if (!current) {
      setRemindersByJobId({})
      return
    }

    try {
      setRemindersError(null)
      const rows = await fetchReminders(current.id)
      const mapped: Record<number, Reminder> = {}
      for (const r of rows) {
        if (r.job_id != null) {
          mapped[r.job_id] = r
        }
      }
      setRemindersByJobId(mapped)
    } catch (err) {
      console.error("Failed to fetch reminders:", err)
      if (axios.isAxiosError(err) && err.response?.data && typeof err.response.data === "object") {
        const msg = (err.response.data as { message?: string }).message
        setRemindersError(msg ?? "Could not load reminders.")
      } else {
        setRemindersError("Could not load reminders.")
      }
    }
  }

  useEffect(() => {
    void loadReminders()
  }, [location.pathname])

  const openReminderDialogForJob = (job: Job) => {
    const existing = job.job_id != null ? remindersByJobId[job.job_id] : undefined
    setActiveJobIdForReminder(job.job_id)
    setEditingReminder(existing ?? null)

    if (existing) {
      setReminderForm({
        title: existing.title ?? "",
        description: existing.description ?? "",
        reminder_datetime: toDateTimeLocalInputValue(existing.reminder_datetime),
      })
    } else {
      setReminderForm(emptyReminderForm())
    }

    setReminderFormErrors({})
    setSavingReminderError(null)
    setReminderDialogOpen(true)
  }

  const validateReminderForm = (): boolean => {
    const next: Record<string, string> = {}
    if (!reminderForm.title.trim()) next.title = "Reminder title is required."
    if (!reminderForm.reminder_datetime) next.reminder_datetime = "Reminder date and time is required."
    setReminderFormErrors(next)
    return Object.keys(next).length === 0
  }

  const handleSaveReminder = async () => {
    const current = getSessionUser()
    if (!current || activeJobIdForReminder == null) return
    if (!validateReminderForm()) return

    try {
      setSavingReminder(true)
      setSavingReminderError(null)

      const payload = {
        user_id: current.id,
        job_id: activeJobIdForReminder,
        title: reminderForm.title.trim(),
        description: reminderForm.description.trim() || null,
        reminder_datetime: new Date(reminderForm.reminder_datetime).toISOString(),
      }

      if (editingReminder) {
        await updateReminder(editingReminder.id, payload)
      } else {
        await createReminder(payload)
      }

      setReminderDialogOpen(false)
      await loadReminders()
    } catch (err) {
      console.error("Failed to save reminder:", err)
      if (axios.isAxiosError(err) && err.response?.data && typeof err.response.data === "object") {
        const msg = (err.response.data as { message?: string }).message
        setSavingReminderError(msg ?? "Could not save reminder.")
      } else {
        setSavingReminderError("Could not save reminder.")
      }
    } finally {
      setSavingReminder(false)
    }
  }

  const handleDelete = async (jobId: number) => {
    const ok = window.confirm("Delete this job posting? This cannot be undone.")
    if (!ok) return

    try {
      await removeJob(jobId)
      setJobs((prev) => prev.filter((j) => j.job_id !== jobId))
    } catch (err) {
      console.error("Failed to delete job:", err)
      window.alert("Failed to delete job. Check the console for details.")
    }
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-3xl font-bold">Job postings</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {session
              ? "Showing jobs linked to your account."
              : "Log in to see only your jobs; otherwise all jobs are listed."}
          </p>
        </div>

        <Link to="/addjob">
          <Button>Add job</Button>
        </Link>
      </div>

      {loadError && (
        <p className="text-destructive text-sm mb-3" role="alert">
          {loadError}
        </p>
      )}

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Position</TableHead>
              <TableHead>Company</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Posted</TableHead>
              <TableHead>Deadline</TableHead>
              <TableHead>Reminder</TableHead>
              <TableHead className="text-center w-[200px]">Actions</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {jobs.length > 0 ? (
              jobs.map((job) => {
                const jobStatus = normalizeJobStatus(job.status)
                const { Icon: StatusIcon, iconClass } =
                  getJobStatusDisplay(jobStatus)
                const hasReminder =
                  job.job_id != null && Boolean(remindersByJobId[job.job_id])
                return (
                  <TableRow key={job.job_id}>
                    <TableCell className="font-medium max-w-[220px] truncate">
                      {job.job_title}
                    </TableCell>
                    <TableCell>{job.company_name}</TableCell>
                    <TableCell className="max-w-[200px]">
                      <span className="text-muted-foreground flex min-w-0 items-start gap-1.5">
                        <MapPin
                          className="mt-0.5 size-3.5 shrink-0 opacity-90"
                          aria-hidden
                        />
                        <span className="text-foreground min-w-0 truncate">
                          {job.job_location?.trim()
                            ? job.job_location
                            : "—"}
                        </span>
                      </span>
                    </TableCell>
                    <TableCell>{job.job_type ?? "—"}</TableCell>
                    <TableCell className="max-w-[220px]">
                      <span className="flex min-w-0 items-center gap-2">
                        <StatusIcon
                          className={`size-4 shrink-0 ${iconClass}`}
                          aria-hidden
                        />
                        <span className="truncate">{jobStatus}</span>
                      </span>
                    </TableCell>
                    <TableCell>{formatDisplayDate(job.posted_date)}</TableCell>
                    <TableCell>
                      {formatDisplayDate(job.application_deadline)}
                    </TableCell>
                    <TableCell>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className={
                          hasReminder
                            ? "gap-1.5 border-violet-200 text-violet-700 hover:border-violet-300 hover:bg-violet-50 hover:text-violet-950"
                            : "gap-1.5"
                        }
                        disabled={!session}
                        onClick={() => openReminderDialogForJob(job)}
                      >
                        {hasReminder ? (
                          <>
                            <PencilLine
                              className="size-3.5 shrink-0 text-violet-600 group-hover/button:text-violet-800"
                              aria-hidden
                            />
                            Edit reminder
                          </>
                        ) : (
                          <>
                            <BellPlus
                              className="size-3.5 shrink-0"
                              aria-hidden
                            />
                            Add reminder
                          </>
                        )}
                      </Button>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-center gap-3">
                        <Link to={`/job/${job.job_id}`} title="View">
                          <Eye className="text-muted-foreground hover:text-foreground h-4 w-4 cursor-pointer" />
                        </Link>
                        <Link to={`/editjob/${job.job_id}`} title="Edit">
                          <Pencil className="h-4 w-4 cursor-pointer text-blue-600 hover:text-blue-800" />
                        </Link>
                        <Trash2
                          className="h-4 w-4 cursor-pointer text-red-600 hover:text-red-800"
                          title="Delete"
                          onClick={() => void handleDelete(job.job_id)}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })
            ) : (
            <TableRow>
              <TableCell colSpan={9} className="text-center text-muted-foreground">
                No jobs yet. Add one to get started.
              </TableCell>
            </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={reminderDialogOpen} onOpenChange={setReminderDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingReminder ? "Edit reminder" : "Add reminder"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <Field data-invalid={!!reminderFormErrors.title}>
              <FieldLabel htmlFor="job_reminder_title">Reminder title *</FieldLabel>
              <Input
                id="job_reminder_title"
                value={reminderForm.title}
                onChange={(e) => setReminderForm((prev) => ({ ...prev, title: e.target.value }))}
                placeholder="e.g. Follow up with HR"
              />
              <FieldError errors={reminderFormErrors.title ? [{ message: reminderFormErrors.title }] : []} />
            </Field>

            <Field>
              <FieldLabel htmlFor="job_reminder_description">Reminder description</FieldLabel>
              <Textarea
                id="job_reminder_description"
                value={reminderForm.description}
                onChange={(e) => setReminderForm((prev) => ({ ...prev, description: e.target.value }))}
                rows={3}
              />
            </Field>

            <Field data-invalid={!!reminderFormErrors.reminder_datetime}>
              <FieldLabel htmlFor="job_reminder_datetime">Reminder date and time *</FieldLabel>
              <Input
                id="job_reminder_datetime"
                type="datetime-local"
                value={reminderForm.reminder_datetime}
                onChange={(e) =>
                  setReminderForm((prev) => ({
                    ...prev,
                    reminder_datetime: e.target.value,
                  }))
                }
              />
              <FieldError
                errors={reminderFormErrors.reminder_datetime ? [{ message: reminderFormErrors.reminder_datetime }] : []}
              />
            </Field>

            {savingReminderError && (
              <p className="text-destructive text-sm" role="alert">
                {savingReminderError}
              </p>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setReminderDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="button" disabled={savingReminder} onClick={() => void handleSaveReminder()}>
              {savingReminder ? "Saving..." : editingReminder ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
