import { useEffect, useState } from "react"
import { Link, useParams } from "react-router-dom"
import axios from "axios"
import { Building2, MapPin } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  fetchJob,
  fetchJobDocuments,
  normalizeJobStatus,
  removeJobDocument,
  toDateInputValue,
  type Job,
  type JobDocument,
} from "@/lib/jobsApi"

function formatDisplayDate(value: string | null | undefined): string {
  if (!value) return "—"
  const d = toDateInputValue(value)
  return d || "—"
}

export default function Jobdetail() {
  const { id } = useParams()
  const jobId = id ? Number.parseInt(id, 10) : NaN

  const [job, setJob] = useState<Job | null>(null)
  const [documents, setDocuments] = useState<JobDocument[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [documentsError, setDocumentsError] = useState<string | null>(null)
  const [deletingDocumentId, setDeletingDocumentId] = useState<number | null>(null)

  useEffect(() => {
    if (!Number.isInteger(jobId) || jobId < 1) {
      setError("Invalid job id.")
      setLoading(false)
      return
    }

    let cancelled = false

    const run = async () => {
      setError(null)
      setDocumentsError(null)
      try {
        const [jobData, docsData] = await Promise.all([fetchJob(jobId), fetchJobDocuments(jobId)])
        if (!cancelled) {
          setJob(jobData)
          setDocuments(docsData)
        }
      } catch (err) {
        console.error("Failed to fetch job:", err)
        if (!cancelled) {
          if (axios.isAxiosError(err) && err.response?.status === 404) {
            setError("Job not found.")
          } else if (axios.isAxiosError(err) && err.response?.data && typeof err.response.data === "object") {
            const msg = (err.response.data as { message?: string }).message
            setError(msg ?? "Could not load job.")
          } else {
            setError("Could not load job.")
          }
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void run()
    return () => {
      cancelled = true
    }
  }, [jobId])

  const handleDeleteDocument = async (documentId: number) => {
    if (!job) return
    const confirmed = window.confirm("Are you sure you want to delete this document?")
    if (!confirmed) return

    try {
      setDeletingDocumentId(documentId)
      setDocumentsError(null)
      await removeJobDocument(job.job_id, documentId)
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

  if (loading) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">Loading…</p>
      </div>
    )
  }

  if (error || !job) {
    return (
      <div className="p-6 space-y-4">
        <p className="text-destructive" role="alert">
          {error ?? "Job not found."}
        </p>
        <Link to="/jobs">
          <Button variant="outline">Back to jobs</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">{job.job_title}</h1>
          <div className="text-muted-foreground mt-2 flex flex-wrap items-center gap-x-5 gap-y-1 text-base">
            <span className="inline-flex min-w-0 items-center gap-2">
              <Building2 className="size-5 shrink-0 opacity-90" aria-hidden />
              <span className="min-w-0">{job.company_name}</span>
            </span>
            {job.job_location?.trim() ? (
              <span className="inline-flex min-w-0 items-center gap-2">
                <MapPin className="size-5 shrink-0 opacity-90" aria-hidden />
                <span className="min-w-0">{job.job_location}</span>
              </span>
            ) : null}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to="/jobs">
            <Button variant="outline">All jobs</Button>
          </Link>
          <Link to={`/editjob/${job.job_id}`}>
            <Button>Edit</Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="whitespace-nowrap">Type</TableHead>
                    <TableHead className="whitespace-nowrap">Status</TableHead>
                    <TableHead className="whitespace-nowrap">Salary</TableHead>
                    <TableHead className="whitespace-nowrap">Posted</TableHead>
                    <TableHead className="whitespace-nowrap">Deadline</TableHead>
                    <TableHead className="whitespace-nowrap">Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell>{job.job_type ?? "—"}</TableCell>
                    <TableCell className="min-w-[9rem]">
                      {normalizeJobStatus(job.status)}
                    </TableCell>
                    <TableCell className="min-w-[7rem]">
                      {job.salary_range ?? "—"}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {formatDisplayDate(job.posted_date)}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {formatDisplayDate(job.application_deadline)}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {job.created_at ? formatDisplayDate(job.created_at) : "—"}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Description</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap">{job.job_description ?? "—"}</p>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Requirements</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap">{job.requirements ?? "—"}</p>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Documents</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {documentsError && (
              <p className="text-destructive text-sm" role="alert">
                {documentsError}
              </p>
            )}

            {documents.length === 0 ? (
              <p className="text-sm text-muted-foreground">No documents uploaded.</p>
            ) : (
              <div className="space-y-2">
                {documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded border px-3 py-2"
                  >
                    <div className="text-sm">
                      <p className="font-medium">{doc.document_name}</p>
                      <p className="text-muted-foreground">
                        {doc.type === "resume" ? "Resume" : "Cover Letter"} - {toDateInputValue(doc.created_at)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <a
                        href={`http://localhost:5000/${doc.file_path}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sm underline"
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
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
