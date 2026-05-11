import { api } from "@/lib/api"

/** Full profile row from `GET /api/auth/me` (matches `users` table, no password). */
export type UserProfile = {
  id: number
  email: string
  first_name: string
  last_name: string
  phone: string | null
  position: string | null
  available_start_date: string | null
  employment_status: string | null
  resume: string | null
}

export type AuthMeResponse = {
  user: UserProfile
}

export async function fetchAuthenticatedProfile(): Promise<UserProfile> {
  const res = await api.get<AuthMeResponse>("/api/auth/me")
  return res.data.user
}
