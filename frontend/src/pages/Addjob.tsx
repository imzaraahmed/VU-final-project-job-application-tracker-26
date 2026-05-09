import { useMemo, useState } from "react"
import { Link, useNavigate, useLocation } from "react-router-dom"
import axios from "axios"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
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
import {
  emptyJobForm,
  jobFormToPayload,
  validateJobForm,
  type JobFormState,
} from "@/lib/jobFormValidation"
import { createJob, JOB_STATUS_OPTIONS, uploadJobDocument, type JobDocumentType, type JobStatus } from "@/lib/jobsApi"
import { getSessionUser } from "@/lib/sessionUser"

type PendingDocument = {
  id: string
  document_name: string
  type: JobDocumentType
  file: File
}

export default function Addjob() {
  const navigate = useNavigate()
  const location = useLocation()
  const session = useMemo(() => getSessionUser(), [location.pathname])
  const [form, setForm] = useState<JobFormState>(emptyJobForm())
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false)
  const [uploadType, setUploadType] = useState<"resume" | "coverLetter">("resume")
  const [documentName, setDocumentName] = useState("")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [pendingDocuments, setPendingDocuments] = useState<PendingDocument[]>([])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
    setErrors((prev) => {
      const next = { ...prev }
      delete next[name]
      return next
    })
    setSubmitError(null)
  }

  const handleStatusChange = (value: string) => {
    setForm((prev) => ({ ...prev, status: value as JobStatus }))
    setErrors((prev) => {
      const next = { ...prev }
      delete next.status
      return next
    })
    setSubmitError(null)
  }

  const handleSubmit = async () => {
    setSubmitError(null)
    const current = getSessionUser()
    if (!current) {
      setSubmitError("You need to log in before adding a job. Use Log in from the home page.")
      return
    }

    const result = validateJobForm(form)
    if (!result.ok) {
      setErrors(result.errors)
      return
    }
    setErrors({})

    try {
      setLoading(true)
      const payload = { ...jobFormToPayload(form), user_id: current.id }
      const id = await createJob(payload)
      if (id && pendingDocuments.length) {
        for (const doc of pendingDocuments) {
          await uploadJobDocument(id, {
            document_name: doc.document_name,
            type: doc.type,
            file: doc.file,
          })
        }
      }
      navigate(id ? `/job/${id}` : "/jobs")
    } catch (err) {
      console.error("Failed to create job:", err)
      if (axios.isAxiosError(err) && err.response?.data && typeof err.response.data === "object") {
        const msg = (err.response.data as { message?: string }).message
        setSubmitError(msg ?? "Could not create job.")
      } else {
        setSubmitError("Could not create job.")
      }
    } finally {
      setLoading(false)
    }
  }

  const openUploadDialog = (type: "resume" | "coverLetter") => {
    setUploadType(type)
    setDocumentName("")
    setSelectedFile(null)
    setUploadError(null)
    setIsUploadDialogOpen(true)
  }

  const closeUploadDialog = () => {
    setIsUploadDialogOpen(false)
    setDocumentName("")
    setSelectedFile(null)
    setUploadError(null)
  }

  const handleUpload = () => {
    if (!documentName.trim()) {
      setUploadError("Document name is required.")
      return
    }
    if (!selectedFile) {
      setUploadError("Please choose a document file.")
      return
    }
    const newDocument: PendingDocument = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      document_name: documentName.trim(),
      type: uploadType === "resume" ? "resume" : "cover_letter",
      file: selectedFile,
    }
    setPendingDocuments((prev) => [...prev, newDocument])
    closeUploadDialog()
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-3xl font-bold">Add job</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Signed-in users only — your account id is sent with each new job.
          </p>
        </div>

        <div className="flex gap-4">
          <Link to="/jobs">
            <Button variant="outline" type="button">
              Cancel
            </Button>
          </Link>
          <Button type="button" onClick={() => void handleSubmit()} disabled={loading}>
            {loading ? "Saving…" : "Create"}
          </Button>
        </div>
      </div>

      {!session && (
        <p className="text-amber-700 dark:text-amber-500 text-sm mb-4">
          You must{" "}
          <Link to="/login" className="underline font-medium">
            log in
          </Link>{" "}
          so your user id can be saved with this job.
        </p>
      )}

      {submitError && (
        <p className="text-destructive text-sm mb-4" role="alert">
          {submitError}
        </p>
      )}

      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Field data-invalid={!!errors.job_title}>
              <FieldLabel htmlFor="job_title">Job title *</FieldLabel>
              <Input id="job_title" name="job_title" value={form.job_title} onChange={handleChange} />
              <FieldError errors={errors.job_title ? [{ message: errors.job_title }] : []} />
            </Field>

            <Field data-invalid={!!errors.company_name}>
              <FieldLabel htmlFor="company_name">Company name *</FieldLabel>
              <Input id="company_name" name="company_name" value={form.company_name} onChange={handleChange} />
              <FieldError errors={errors.company_name ? [{ message: errors.company_name }] : []} />
            </Field>

            <Field data-invalid={!!errors.job_location}>
              <FieldLabel htmlFor="job_location">Location</FieldLabel>
              <Input id="job_location" name="job_location" value={form.job_location} onChange={handleChange} />
              <FieldError errors={errors.job_location ? [{ message: errors.job_location }] : []} />
            </Field>

            <Field data-invalid={!!errors.job_type}>
              <FieldLabel htmlFor="job_type">Job type</FieldLabel>
              <Input id="job_type" name="job_type" value={form.job_type} onChange={handleChange} placeholder="e.g. Full-time" />
              <FieldError errors={errors.job_type ? [{ message: errors.job_type }] : []} />
            </Field>

            <Field data-invalid={!!errors.status}>
              <FieldLabel htmlFor="job_status">Application status</FieldLabel>
              <Select value={form.status} onValueChange={handleStatusChange}>
                <SelectTrigger id="job_status" className="w-full min-w-0">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  {JOB_STATUS_OPTIONS.map((opt) => (
                    <SelectItem key={opt} value={opt}>
                      {opt}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldError errors={errors.status ? [{ message: errors.status }] : []} />
            </Field>

            <Field data-invalid={!!errors.salary_range}>
              <FieldLabel htmlFor="salary_range">Salary range</FieldLabel>
              <Input id="salary_range" name="salary_range" value={form.salary_range} onChange={handleChange} />
              <FieldError errors={errors.salary_range ? [{ message: errors.salary_range }] : []} />
            </Field>

            <Field data-invalid={!!errors.posted_date}>
              <FieldLabel htmlFor="posted_date">Posted date</FieldLabel>
              <Input id="posted_date" type="date" name="posted_date" value={form.posted_date} onChange={handleChange} />
              <FieldError errors={errors.posted_date ? [{ message: errors.posted_date }] : []} />
            </Field>

            <Field data-invalid={!!errors.application_deadline}>
              <FieldLabel htmlFor="application_deadline">Application deadline</FieldLabel>
              <Input
                id="application_deadline"
                type="date"
                name="application_deadline"
                value={form.application_deadline}
                onChange={handleChange}
              />
              <FieldError errors={errors.application_deadline ? [{ message: errors.application_deadline }] : []} />
            </Field>

            <Field className="md:col-span-2" data-invalid={!!errors.job_description}>
              <FieldLabel htmlFor="job_description">Description</FieldLabel>
              <Textarea
                id="job_description"
                name="job_description"
                value={form.job_description}
                onChange={handleChange}
                rows={5}
              />
              <FieldError errors={errors.job_description ? [{ message: errors.job_description }] : []} />
            </Field>

            <Field className="md:col-span-2" data-invalid={!!errors.requirements}>
              <FieldLabel htmlFor="requirements">Requirements</FieldLabel>
              <Textarea
                id="requirements"
                name="requirements"
                value={form.requirements}
                onChange={handleChange}
                rows={4}
              />
              <FieldError errors={errors.requirements ? [{ message: errors.requirements }] : []} />
            </Field>

            <div className="md:col-span-2 flex flex-wrap gap-3">
              <Button type="button" variant="outline" onClick={() => openUploadDialog("resume")}>
                Upload Resume
              </Button>
              <Button type="button" variant="outline" onClick={() => openUploadDialog("coverLetter")}>
                Upload Cover Letter
              </Button>
            </div>

            {pendingDocuments.length > 0 && (
              <div className="md:col-span-2 rounded-md border p-4">
                <p className="font-medium mb-2">Documents to upload</p>
                <div className="space-y-2">
                  {pendingDocuments.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between gap-3 rounded border px-3 py-2 text-sm"
                    >
                      <div>
                        <p className="font-medium">{doc.document_name}</p>
                        <p className="text-muted-foreground">
                          {doc.type === "resume" ? "Resume" : "Cover Letter"} - {doc.file.name}
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setPendingDocuments((prev) => prev.filter((item) => item.id !== doc.id))
                        }
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload Documents</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <Field>
              <FieldLabel htmlFor="document_name">
                Document name {uploadType === "resume" ? "(Resume)" : "(Cover Letter)"}
              </FieldLabel>
              <Input
                id="document_name"
                name="document_name"
                value={documentName}
                onChange={(e) => {
                  setDocumentName(e.target.value)
                  setUploadError(null)
                }}
                placeholder={
                  uploadType === "resume" ? "e.g. Resume - April 2026" : "e.g. Cover Letter - April 2026"
                }
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="document_file">Upload document</FieldLabel>
              <Input
                id="document_file"
                name="document_file"
                type="file"
                onChange={(e) => {
                  setSelectedFile(e.target.files?.[0] ?? null)
                  setUploadError(null)
                }}
              />
            </Field>

            {uploadError && (
              <p className="text-destructive text-sm" role="alert">
                {uploadError}
              </p>
            )}
          </div>

          <DialogFooter className="mt-2">
            <Button type="button" variant="outline" onClick={closeUploadDialog}>
              Cancel
            </Button>
            <Button type="button" onClick={handleUpload}>
              Upload
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
