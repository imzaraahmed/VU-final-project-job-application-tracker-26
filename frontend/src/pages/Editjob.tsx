import { useEffect, useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
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
  jobToFormState,
  validateJobForm,
  type JobFormState,
} from "@/lib/jobFormValidation"
import {
  fetchJob,
  fetchJobDocuments,
  JOB_STATUS_OPTIONS,
  removeJobDocument,
  updateJob,
  uploadJobDocument,
  type JobDocument,
  type JobStatus,
} from "@/lib/jobsApi"

export default function Editjob() {
  const { id } = useParams()
  const navigate = useNavigate()
  const jobId = id ? Number.parseInt(id, 10) : NaN

  const [form, setForm] = useState<JobFormState>(emptyJobForm())
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [documents, setDocuments] = useState<JobDocument[]>([])
  const [documentsError, setDocumentsError] = useState<string | null>(null)
  const [deletingDocumentId, setDeletingDocumentId] = useState<number | null>(null)
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false)
  const [uploadType, setUploadType] = useState<"resume" | "coverLetter">("resume")
  const [documentName, setDocumentName] = useState("")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploadingDocument, setUploadingDocument] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)

  useEffect(() => {
    if (!Number.isInteger(jobId) || jobId < 1) {
      setFetchError("Invalid job id.")
      setFetching(false)
      return
    }

    let cancelled = false

    const run = async () => {
      setFetchError(null)
      try {
        const [job, docs] = await Promise.all([fetchJob(jobId), fetchJobDocuments(jobId)])
        if (!cancelled) {
          setForm(jobToFormState(job))
          setDocuments(docs)
        }
      } catch (err) {
        console.error("Failed to fetch job:", err)
        if (!cancelled) {
          if (axios.isAxiosError(err) && err.response?.status === 404) {
            setFetchError("Job not found.")
          } else if (axios.isAxiosError(err) && err.response?.data && typeof err.response.data === "object") {
            const msg = (err.response.data as { message?: string }).message
            setFetchError(msg ?? "Could not load job.")
          } else {
            setFetchError("Could not load job.")
          }
        }
      } finally {
        if (!cancelled) setFetching(false)
      }
    }

    void run()
    return () => {
      cancelled = true
    }
  }, [jobId])

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
    if (!Number.isInteger(jobId) || jobId < 1) return

    setSubmitError(null)
    const result = validateJobForm(form)
    if (!result.ok) {
      setErrors(result.errors)
      return
    }
    setErrors({})

    try {
      setLoading(true)
      const payload = jobFormToPayload(form)
      await updateJob(jobId, payload)
      navigate(`/job/${jobId}`)
    } catch (err) {
      console.error("Failed to update job:", err)
      if (axios.isAxiosError(err) && err.response?.data && typeof err.response.data === "object") {
        const msg = (err.response.data as { message?: string }).message
        setSubmitError(msg ?? "Could not update job.")
      } else {
        setSubmitError("Could not update job.")
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

  const handleUpload = async () => {
    if (!Number.isInteger(jobId) || jobId < 1) return
    if (!documentName.trim()) {
      setUploadError("Document name is required.")
      return
    }
    if (!selectedFile) {
      setUploadError("Please choose a document file.")
      return
    }

    try {
      setUploadingDocument(true)
      setUploadError(null)
      setDocumentsError(null)
      await uploadJobDocument(jobId, {
        document_name: documentName.trim(),
        type: uploadType === "resume" ? "resume" : "cover_letter",
        file: selectedFile,
      })
      const docs = await fetchJobDocuments(jobId)
      setDocuments(docs)
      closeUploadDialog()
    } catch (err) {
      console.error("Failed to upload document:", err)
      if (axios.isAxiosError(err) && err.response?.data && typeof err.response.data === "object") {
        const msg = (err.response.data as { message?: string }).message
        setUploadError(msg ?? "Could not upload document.")
      } else {
        setUploadError("Could not upload document.")
      }
    } finally {
      setUploadingDocument(false)
    }
  }

  const handleDeleteDocument = async (documentId: number) => {
    if (!Number.isInteger(jobId) || jobId < 1) return
    const confirmed = window.confirm("Are you sure you want to delete this document?")
    if (!confirmed) return

    try {
      setDeletingDocumentId(documentId)
      setDocumentsError(null)
      await removeJobDocument(jobId, documentId)
      setDocuments((prev) => prev.filter((doc) => doc.id !== documentId))
    } catch (err) {
      console.error("Failed to delete document:", err)
      if (axios.isAxiosError(err) && err.response?.data && typeof err.response.data === "object") {
        const msg = (err.response.data as { message?: string }).message
        setDocumentsError(msg ?? "Could not delete document.")
      } else {
        setDocumentsError("Could not delete document.")
      }
    } finally {
      setDeletingDocumentId(null)
    }
  }

  if (fetching) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">Loading job…</p>
      </div>
    )
  }

  if (fetchError) {
    return (
      <div className="p-6 space-y-4">
        <p className="text-destructive" role="alert">
          {fetchError}
        </p>
        <Link to="/jobs">
          <Button variant="outline">Back to jobs</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-3xl font-bold">Edit job</h1>
          <p className="text-muted-foreground text-sm mt-1">Job id: {jobId}</p>
        </div>

        <div className="flex gap-4">
          <Link to="/jobs">
            <Button variant="outline" type="button">
              Cancel
            </Button>
          </Link>
          <Button type="button" onClick={() => void handleSubmit()} disabled={loading}>
            {loading ? "Saving…" : "Update"}
          </Button>
        </div>
      </div>

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
              <Input id="job_type" name="job_type" value={form.job_type} onChange={handleChange} />
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

            <div className="md:col-span-2 rounded-md border p-4">
              <p className="font-medium mb-2">Uploaded documents</p>
              {documentsError && (
                <p className="text-destructive text-sm mb-2" role="alert">
                  {documentsError}
                </p>
              )}
              {documents.length === 0 ? (
                <p className="text-sm text-muted-foreground">No documents uploaded.</p>
              ) : (
                <div className="space-y-2">
                  {documents.map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between gap-3 rounded border px-3 py-2 text-sm">
                      <div>
                        <p className="font-medium">{doc.document_name}</p>
                        <p className="text-muted-foreground">
                          {doc.type === "resume" ? "Resume" : "Cover Letter"} - {doc.file_path.split("/").pop()}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <a
                          href={`http://localhost:5000/${doc.file_path}`}
                          target="_blank"
                          rel="noreferrer"
                          className="underline"
                        >
                          View
                        </a>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={deletingDocumentId === doc.id}
                          onClick={() => void handleDeleteDocument(doc.id)}
                        >
                          {deletingDocumentId === doc.id ? "Deleting…" : "Delete"}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
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
            <Button type="button" variant="outline" onClick={closeUploadDialog} disabled={uploadingDocument}>
              Cancel
            </Button>
            <Button type="button" onClick={() => void handleUpload()} disabled={uploadingDocument}>
              {uploadingDocument ? "Uploading…" : "Upload"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
