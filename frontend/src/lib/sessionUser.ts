const STORAGE_KEY = "jat_session_user"

export type SessionUser = {
  id: number
  email: string
  first_name: string
  last_name: string
}

function parseStored(json: string): SessionUser | null {
  try {
    const v = JSON.parse(json) as unknown
    if (!v || typeof v !== "object") return null
    const o = v as Record<string, unknown>
    const id = Number(o.id)
    if (!Number.isInteger(id) || id < 1) return null
    const email = String(o.email ?? "")
    const first_name = String(o.first_name ?? "")
    const last_name = String(o.last_name ?? "")
    return { id, email, first_name, last_name }
  } catch {
    return null
  }
}

export function getSessionUser(): SessionUser | null {
  if (typeof window === "undefined") return null
  const raw = window.localStorage.getItem(STORAGE_KEY)
  if (!raw) return null
  return parseStored(raw)
}

export function setSessionUser(user: SessionUser): void {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(user))
}

export function clearSessionUser(): void {
  window.localStorage.removeItem(STORAGE_KEY)
}

export function sessionDisplayName(u: SessionUser): string {
  const full = `${u.first_name} ${u.last_name}`.trim()
  return full || u.email || "User"
}
