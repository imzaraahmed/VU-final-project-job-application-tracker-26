import axios from "axios"

const JOBS_URL = "http://localhost:5000/api/jobs"

/** Allowed `jobs.status` values (keep in sync with backend ALLOWED_JOB_STATUSES) */
export const JOB_STATUS_OPTIONS = [
  "Not Applied",
  "Applied",
  "Interview Call",
  "Interview Given",
  "Test Call",
  "Test Given",
  "Offer Received",
  "Offer Accepted",
  "Rejected",
] as const

export type JobStatus = (typeof JOB_STATUS_OPTIONS)[number]

export const DEFAULT_JOB_STATUS: JobStatus = "Not Applied"

export function normalizeJobStatus(value: string | null | undefined): JobStatus {
  if (value != null && (JOB_STATUS_OPTIONS as readonly string[]).includes(value)) {
    return value as JobStatus
  }
  return DEFAULT_JOB_STATUS
}

export type Job = {
  job_id: number
  user_id: number | null
  job_title: string
  company_name: string
  job_location: string | null
  job_type: string | null
  salary_range: string | null
  job_description: string | null
  requirements: string | null
  posted_date: string | null
  application_deadline: string | null
  status: string | null
  created_at: string
}

/** Form / JSON body fields (no job_id) */
export type JobPayload = {
  job_title: string
  company_name: string
  /** Required when creating a job; associates the row with `users.id` */
  user_id?: number
  job_location?: string | null
  job_type?: string | null
  salary_range?: string | null
  job_description?: string | null
  requirements?: string | null
  posted_date?: string | null
  application_deadline?: string | null
  status?: JobStatus | null
}

export type JobDocumentType = "resume" | "cover_letter"

export type JobDocumentPayload = {
  document_name: string
  type: JobDocumentType
  file: File
}

export type JobDocument = {
  id: number
  job_id: number
  document_name: string
  type: JobDocumentType
  file_path: string
  created_at: string
}

export async function fetchJobs(forUserId?: number): Promise<Job[]> {
  const url =
    forUserId != null && Number.isInteger(forUserId) && forUserId > 0
      ? `${JOBS_URL}?user_id=${encodeURIComponent(String(forUserId))}`
      : JOBS_URL
  const res = await axios.get<{ data: Job[] }>(url)
  return res.data.data ?? []
}

export async function fetchJob(jobId: number): Promise<Job> {
  const res = await axios.get<{ data: Job }>(`${JOBS_URL}/${jobId}`)
  return res.data.data
}

export async function createJob(body: JobPayload): Promise<number> {
  const res = await axios.post<{ job_id: number }>(JOBS_URL, body)
  return res.data.job_id
}

export async function updateJob(jobId: number, body: Partial<JobPayload>): Promise<void> {
  await axios.put(`${JOBS_URL}/${jobId}`, body)
}

export async function removeJob(jobId: number): Promise<void> {
  await axios.delete(`${JOBS_URL}/${jobId}`)
}

export async function uploadJobDocument(jobId: number, body: JobDocumentPayload): Promise<void> {
  const formData = new FormData()
  formData.append("document_name", body.document_name)
  formData.append("type", body.type)
  formData.append("document", body.file)

  await axios.post(`${JOBS_URL}/${jobId}/documents`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  })
}

export async function fetchJobDocuments(jobId: number): Promise<JobDocument[]> {
  const res = await axios.get<{ data: JobDocument[] }>(`${JOBS_URL}/${jobId}/documents`)
  return res.data.data ?? []
}

export async function removeJobDocument(jobId: number, documentId: number): Promise<void> {
  await axios.delete(`${JOBS_URL}/${jobId}/documents/${documentId}`)
}

/** Format DB / ISO date strings for `<input type="date" />` */
export function toDateInputValue(value: string | null | undefined): string {
  if (!value) return ""
  const s = String(value)
  if (s.includes("T")) return s.split("T")[0] ?? ""
  return s.slice(0, 10)
}
