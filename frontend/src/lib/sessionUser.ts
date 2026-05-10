const STORAGE_KEY = "jat_session_user"
const TOKEN_KEY = "jat_access_token"

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

export function getAuthToken(): string | null {
  if (typeof window === "undefined") return null
  const t = window.localStorage.getItem(TOKEN_KEY)
  return t && t.length > 0 ? t : null
}

export function setAuthToken(token: string): void {
  window.localStorage.setItem(TOKEN_KEY, token)
}

export function clearAuthToken(): void {
  window.localStorage.removeItem(TOKEN_KEY)
}

export function setSessionUser(user: SessionUser): void {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(user))
}

/** Clears cached profile and JWT (call on logout and after invalid/expired token). */
export function clearSessionUser(): void {
  window.localStorage.removeItem(STORAGE_KEY)
  window.localStorage.removeItem(TOKEN_KEY)
}

/** Drop mismatched localStorage from older builds (user without token or token without user). */
export function reconcileClientSession(): void {
  if (typeof window === "undefined") return
  const u = getSessionUser()
  const t = getAuthToken()
  if (u && !t) window.localStorage.removeItem(STORAGE_KEY)
  if (t && !u) window.localStorage.removeItem(TOKEN_KEY)
}

export function sessionDisplayName(u: SessionUser): string {
  const full = `${u.first_name} ${u.last_name}`.trim()
  return full || u.email || "User"
}

const ADMIN_EMAIL = "admin@gmail.com"

/** Full admin nav (including Users): only this account. */
export function isAdminEmailUser(u: SessionUser | null): boolean {
  if (!u?.email) return false
  return u.email.trim().toLowerCase() === ADMIN_EMAIL
}
