import { useEffect, useMemo, useState } from "react"
import { Link, useLocation } from "react-router-dom"
import {
  Briefcase,
  Gift,
  Loader2,
  PenLine,
  Phone,
} from "lucide-react"
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import type { DashboardStats } from "@/lib/jobsApi"
import { fetchDashboardStats } from "@/lib/jobsApi"
import { getSessionUser } from "@/lib/sessionUser"

const SLICE_COLORS: Record<string, string> = {
  applied: "#2563eb",
  screening: "#ea580c",
  interview: "#9333ea",
  offer: "#16a34a",
  rejected: "#dc2626",
}

const BAR_FILL = "#9333ea"

function DashboardPage() {
  const location = useLocation()
  const session = useMemo(() => getSessionUser(), [location.pathname])

  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (!session?.id) {
      setStats(null)
      return
    }
    let cancelled = false
    setLoading(true)
    setError("")
    void fetchDashboardStats(session.id)
      .then((data) => {
        if (!cancelled) setStats(data)
      })
      .catch(() => {
        if (!cancelled) setError("Could not load dashboard statistics.")
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [session?.id, location.pathname])

  if (!session) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 text-center">
        <p className="text-muted-foreground max-w-md">
          Sign in to see an overview of your applications and charts.
        </p>
        <Button type="button" asChild>
          <Link to="/login">Log in</Link>
        </Button>
      </div>
    )
  }

  const chartRows =
    stats?.status_distribution?.map((s) => ({
      ...s,
      fill: SLICE_COLORS[s.key] ?? "#64748b",
    })) ?? []

  const pieData = chartRows.filter((r) => r.count > 0)

  return (
    <div className="space-y-8 pb-10">
      <header>
        <h1 className="text-foreground text-3xl font-bold tracking-tight">
          Dashboard
        </h1>
        <p className="text-muted-foreground mt-1">
          Overview of your job search activities
        </p>
      </header>

      {error ? (
        <p className="text-destructive text-sm">{error}</p>
      ) : null}

      {loading && !stats ? (
        <div className="text-muted-foreground flex items-center gap-2 text-sm">
          <Loader2 className="size-4 animate-spin" />
          Loading dashboard…
        </div>
      ) : null}

      {stats ? (
        <>
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-start justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Applications
                </CardTitle>
                <Briefcase
                  className="text-muted-foreground size-4 shrink-0"
                  aria-hidden
                />
              </CardHeader>
              <CardContent className="space-y-1">
                <p className="text-3xl font-bold tabular-nums">
                  {stats.total_applications}
                </p>
                <CardDescription className="text-xs">
                  All tracked jobs (every status)
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-start justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  Interviews Scheduled
                </CardTitle>
                <Phone
                  className="size-4 shrink-0 text-violet-600"
                  aria-hidden
                />
              </CardHeader>
              <CardContent className="space-y-1">
                <p className="text-3xl font-bold tabular-nums">
                  {stats.interviews_scheduled}
                </p>
                <CardDescription className="text-xs">
                  Jobs with &quot;
                  {stats.scheduled_status_bindings.interviews_scheduled}
                  &quot; status
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-start justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  Test Scheduled
                </CardTitle>
                <PenLine
                  className="size-4 shrink-0 text-amber-600"
                  aria-hidden
                />
              </CardHeader>
              <CardContent className="space-y-1">
                <p className="text-3xl font-bold tabular-nums">
                  {stats.tests_scheduled}
                </p>
                <CardDescription className="text-xs">
                  Jobs with &quot;
                  {stats.scheduled_status_bindings.tests_scheduled}
                  &quot; status
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-start justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  Offers Received
                </CardTitle>
                <Gift
                  className="size-4 shrink-0 text-emerald-600"
                  aria-hidden
                />
              </CardHeader>
              <CardContent className="space-y-1">
                <p className="text-3xl font-bold tabular-nums">
                  {stats.offers_received}
                </p>
                <CardDescription className="text-xs">
                  {stats.total_applications > 0
                    ? `${stats.success_rate_percent}% success rate`
                    : "No applications yet"}
                </CardDescription>
              </CardContent>
            </Card>
          </section>

          <div className="border-primary/80 border-b-2" aria-hidden />

          <section className="grid gap-6 lg:grid-cols-2">
            <Card className="overflow-hidden">
              <CardHeader>
                <CardTitle className="text-base">
                  Application Status Distribution
                </CardTitle>
              </CardHeader>
              <CardContent className="min-h-[280px]">
                {pieData.length === 0 ? (
                  <p className="text-muted-foreground py-12 text-center text-sm">
                    No tracked applications yet. Add jobs and update their
                    statuses (beyond &quot;Not Applied&quot;) to populate this
                    chart.
                  </p>
                ) : (
                  <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                      <Pie
                        data={pieData}
                        dataKey="count"
                        nameKey="label"
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        paddingAngle={2}
                        labelLine={false}
                        label={(props: {
                          name?: string
                          payload?: { count?: number }
                        }) =>
                          `${props.name ?? ""}: ${props.payload?.count ?? 0}`
                        }
                      >
                        {pieData.map((entry) => (
                          <Cell key={entry.key} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: number | string) => [
                          value,
                          "Count",
                        ]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                )}
                {pieData.length > 0 ? (
                  <ul className="text-muted-foreground mt-4 flex flex-wrap justify-center gap-x-6 gap-y-2 text-xs">
                    {chartRows.map((row) => (
                      <li
                        key={row.key}
                        className="flex items-center gap-2 whitespace-nowrap"
                      >
                        <span
                          className="size-2.5 shrink-0 rounded-full"
                          style={{ backgroundColor: row.fill }}
                          aria-hidden
                        />
                        <span>
                          {row.label}:{" "}
                          <span className="text-foreground font-medium">
                            {row.count}
                          </span>
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </CardContent>
            </Card>

            <Card className="overflow-hidden">
              <CardHeader>
                <CardTitle className="text-base">
                  Applications by Status
                </CardTitle>
              </CardHeader>
              <CardContent className="min-h-[280px]">
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={chartRows}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis
                      dataKey="label"
                      tick={{ fontSize: 11 }}
                      interval={0}
                      angle={-25}
                      textAnchor="end"
                      height={72}
                    />
                    <YAxis allowDecimals={false} width={32} />
                    <Tooltip
                      formatter={(value: number | string) => [
                        value,
                        "Applications",
                      ]}
                    />
                    <Bar dataKey="count" fill={BAR_FILL} radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </section>
        </>
      ) : null}
    </div>
  )
}

export default DashboardPage
