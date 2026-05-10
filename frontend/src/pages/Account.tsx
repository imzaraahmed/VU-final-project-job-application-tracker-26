import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Link } from "react-router-dom"
import { fetchAuthenticatedProfile } from "@/lib/authApi"
import type { SessionUser } from "@/lib/sessionUser"

export default function AccountPage() {
  const [user, setUser] = useState<SessionUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError("")
    void fetchAuthenticatedProfile()
      .then((u) => {
        if (!cancelled) setUser(u)
      })
      .catch(() => {
        if (!cancelled) setError("Could not load your profile.")
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="py-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Account</h1>
          <p className="text-muted-foreground text-sm">
            This page calls the JWT-protected API route{" "}
            <code className="text-xs">GET /api/auth/me</code>.
          </p>
        </div>
        <Button type="button" variant="outline" asChild>
          <Link to="/dashboard">Back home</Link>
        </Button>
      </div>

      <Card className="max-w-lg">
        <CardContent className="pt-6 space-y-2">
          {loading ? (
            <p className="text-muted-foreground text-sm">Loading profile…</p>
          ) : error ? (
            <p className="text-red-600 text-sm">{error}</p>
          ) : user ? (
            <>
              <p className="text-sm font-medium">{user.email}</p>
              <p className="text-muted-foreground text-sm">
                {user.first_name} {user.last_name}
              </p>
              <p className="text-muted-foreground text-xs pt-2">
                User ID: {user.id}
              </p>
            </>
          ) : (
            <p className="text-muted-foreground text-sm">No profile data.</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
