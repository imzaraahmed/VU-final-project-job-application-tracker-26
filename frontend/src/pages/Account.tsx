import type { ReactNode } from "react"
import { useEffect, useState } from "react"
import { Link } from "react-router-dom"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table"
import { API_BASE_URL } from "@/lib/api"
import { fetchAuthenticatedProfile, type UserProfile } from "@/lib/authApi"

function formatDisplayDate(value: string | null | undefined): string {
  if (!value) return "—"
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

export default function AccountPage() {
  const [user, setUser] = useState<UserProfile | null>(null)
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

  const resumeHref =
    user?.resume && user.resume.trim().length > 0
      ? `${API_BASE_URL.replace(/\/$/, "")}/${String(user.resume).replace(/^\//, "")}`
      : null

  const rows: { label: string; value: ReactNode }[] = user
    ? [
        { label: "Phone", value: user.phone?.trim() ? user.phone : "—" },
        { label: "Position", value: user.position?.trim() ? user.position : "—" },
        {
          label: "Available start date",
          value: formatDisplayDate(user.available_start_date),
        },
        {
          label: "Employment status",
          value: user.employment_status?.trim() ? user.employment_status : "—",
        },
        {
          label: "Resume",
          value: resumeHref ? (
            <a
              href={resumeHref}
              target="_blank"
              rel="noreferrer"
              className="text-primary font-medium underline"
            >
              View file
            </a>
          ) : (
            "—"
          ),
        },
      ]
    : []

  const displayFullName = user
    ? [user.first_name, user.last_name]
        .map((s) => s?.trim())
        .filter(Boolean)
        .join(" ")
        .trim() || "—"
    : ""

  return (
    <div className="space-y-6 py-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">My Profile</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Your profile from the account database (JWT-protected).
          </p>
        </div>
        <Button type="button" variant="outline" asChild>
          <Link to="/dashboard">Back home</Link>
        </Button>
      </div>

      <Card className="max-w-3xl border bg-card shadow-sm">
        <CardContent className="pt-8 pb-8">
          {loading ? (
            <p className="text-muted-foreground text-sm">Loading profile…</p>
          ) : error ? (
            <p className="text-destructive text-sm" role="alert">
              {error}
            </p>
          ) : user ? (
            <>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 space-y-2">
                  <p className="text-foreground text-2xl font-bold tracking-tight sm:text-3xl">
                    {displayFullName}
                  </p>
                  <p className="text-muted-foreground text-base">{user.email || "—"}</p>
                </div>
                <Button type="button" asChild className="shrink-0 sm:mt-0">
                  <Link to={`/editjobapplication/${user.id}`}>Update profile</Link>
                </Button>
              </div>

              <div className="mt-8">
                <div className="overflow-x-auto rounded-md border">
                  <Table>
                    <TableBody>
                      {rows.map((row) => (
                        <TableRow key={row.label}>
                          <TableCell className="text-muted-foreground font-medium">
                            {row.label}
                          </TableCell>
                          <TableCell className="min-w-[12rem]">{row.value}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </>
          ) : (
            <p className="text-muted-foreground text-sm">No profile data.</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
