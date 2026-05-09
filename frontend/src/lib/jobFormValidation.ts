import {
  DEFAULT_JOB_STATUS,
  JOB_STATUS_OPTIONS,
  normalizeJobStatus,
  toDateInputValue,
  type JobStatus,
} from "./jobsApi"

export type JobFormState = {
  job_title: string
  company_name: string
  job_location: string
  job_type: string
  salary_range: string
  job_description: string
  requirements: string
  posted_date: string
  application_deadline: string
  status: JobStatus
}

export const emptyJobForm = (): JobFormState => ({
  job_title: "",
  company_name: "",
  job_location: "",
  job_type: "",
  salary_range: "",
  job_description: "",
  requirements: "",
  posted_date: "",
  application_deadline: "",
  status: DEFAULT_JOB_STATUS,
})

export function validateJobForm(f: JobFormState): { ok: true } | { ok: false; errors: Record<string, string> } {
  const errors: Record<string, string> = {}

  if (!f.job_title.trim()) {
    errors.job_title = "Job title is required."
  } else if (f.job_title.trim().length > 500) {
    errors.job_title = "Job title must be at most 500 characters."
  }

  if (!f.company_name.trim()) {
    errors.company_name = "Company name is required."
  } else if (f.company_name.trim().length > 200) {
    errors.company_name = "Company name must be at most 200 characters."
  }

  if (!(JOB_STATUS_OPTIONS as readonly string[]).includes(f.status)) {
    errors.status = "Pick a valid application status."
  }

  if (f.posted_date.trim() && Number.isNaN(Date.parse(f.posted_date))) {
    errors.posted_date = "Posted date is not a valid date."
  }
  if (f.application_deadline.trim() && Number.isNaN(Date.parse(f.application_deadline))) {
    errors.application_deadline = "Application deadline is not a valid date."
  }
  if (f.posted_date.trim() && f.application_deadline.trim()) {
    const a = new Date(f.posted_date).getTime()
    const b = new Date(f.application_deadline).getTime()
    if (!Number.isNaN(a) && !Number.isNaN(b) && b < a) {
      errors.application_deadline = "Deadline cannot be before the posted date."
    }
  }

  return Object.keys(errors).length ? { ok: false, errors } : { ok: true }
}

/** Map form strings to API payload (empty string → null for optional fields) */
export function jobFormToPayload(f: JobFormState): {
  job_title: string
  company_name: string
  job_location: string | null
  job_type: string | null
  salary_range: string | null
  job_description: string | null
  requirements: string | null
  posted_date: string | null
  application_deadline: string | null
  status: JobStatus
} {
  const opt = (s: string) => (s.trim() === "" ? null : s.trim())
  return {
    job_title: f.job_title.trim(),
    company_name: f.company_name.trim(),
    job_location: opt(f.job_location),
    job_type: opt(f.job_type),
    salary_range: opt(f.salary_range),
    job_description: opt(f.job_description),
    requirements: opt(f.requirements),
    posted_date: opt(f.posted_date),
    application_deadline: opt(f.application_deadline),
    status: normalizeJobStatus(f.status),
  }
}

export function jobToFormState(job: {
  job_title: string
  company_name: string
  job_location: string | null
  job_type: string | null
  salary_range: string | null
  job_description: string | null
  requirements: string | null
  posted_date: string | null
  application_deadline: string | null
  status?: string | null
}): JobFormState {
  return {
    job_title: job.job_title ?? "",
    company_name: job.company_name ?? "",
    job_location: job.job_location ?? "",
    job_type: job.job_type ?? "",
    salary_range: job.salary_range ?? "",
    job_description: job.job_description ?? "",
    requirements: job.requirements ?? "",
    posted_date: toDateInputValue(job.posted_date),
    application_deadline: toDateInputValue(job.application_deadline),
    status: normalizeJobStatus(job.status),
  }
}
