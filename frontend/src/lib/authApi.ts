import { api } from "@/lib/api"
import type { SessionUser } from "@/lib/sessionUser"

export type AuthMeResponse = {
  user: SessionUser
}

export async function fetchAuthenticatedProfile(): Promise<SessionUser> {
  const res = await api.get<AuthMeResponse>("/api/auth/me")
  return res.data.user
}
