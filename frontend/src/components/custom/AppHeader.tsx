import { useCallback, useEffect, useMemo, useState } from "react"
import { NavLink, useLocation, useNavigate } from "react-router-dom"
import {
  Briefcase,
  LayoutDashboard,
  Users,
  Bell,
  Megaphone,
  CalendarClock,
  UserCircle,
} from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  clearSessionUser,
  getSessionUser,
  isAdminEmailUser,
  sessionDisplayName,
} from "@/lib/sessionUser"
import {
  fetchNotifications,
  fetchUnreadNotificationCount,
  isNotificationUnread,
  markNotificationRead,
  type AppNotification,
} from "@/lib/notificationsApi"

function formatShortTime(value: string): string {
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return ""
  return d.toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })
}

export default function AppHeader() {
  const navigate = useNavigate()
  const location = useLocation()
  const session = useMemo(() => getSessionUser(), [location.pathname])

  const [unreadCount, setUnreadCount] = useState(0)
  const [menuOpen, setMenuOpen] = useState(false)
  const [preview, setPreview] = useState<AppNotification[]>([])
  const [previewLoading, setPreviewLoading] = useState(false)

  const userId = session?.id ?? null
  const showUsersNav = isAdminEmailUser(session)
  const loggedIn = Boolean(session)
  const onLoginPage = location.pathname === "/login"
  const onRegisterPage = location.pathname === "/register"
  const onLandingPage = location.pathname === "/"
  const hideEntryNavLinks =
    onLoginPage ||
    onRegisterPage ||
    (onLandingPage && !loggedIn)

  const refreshUnread = useCallback(async () => {
    if (!userId) {
      setUnreadCount(0)
      return
    }
    try {
      const c = await fetchUnreadNotificationCount(userId)
      setUnreadCount(c)
    } catch {
      /* ignore */
    }
  }, [userId])

  useEffect(() => {
    void refreshUnread()
  }, [refreshUnread, location.pathname])

  useEffect(() => {
    if (!userId) return
    const t = window.setInterval(() => void refreshUnread(), 60000)
    return () => window.clearInterval(t)
  }, [userId, refreshUnread])

  const loadPreview = useCallback(async () => {
    if (!userId) return
    try {
      setPreviewLoading(true)
      const rows = await fetchNotifications(userId, { limit: 8 })
      setPreview(rows)
    } catch {
      setPreview([])
    } finally {
      setPreviewLoading(false)
    }
  }, [userId])

  useEffect(() => {
    if (menuOpen && userId) void loadPreview()
  }, [menuOpen, userId, loadPreview])

  const navClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-2 text-sm font-medium ${
      isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
    }`

  const initials = session
    ? `${session.first_name?.[0] ?? ""}${session.last_name?.[0] ?? ""}`.trim() ||
      session.email.slice(0, 2).toUpperCase()
    : "?"

  const onOpenNotification = async (n: AppNotification) => {
    if (!userId) return
    if (isNotificationUnread(n)) {
      try {
        await markNotificationRead(n.id, userId)
        void refreshUnread()
      } catch {
        /* ignore */
      }
    }
    setMenuOpen(false)
    if (n.job_id) navigate(`/job/${n.job_id}`)
    else navigate("/notifications")
  }

  return (
    <header className="border-b bg-white">
      <div className="flex items-center justify-between px-6 py-4">
        {/* Left Section */}
        <div className="flex items-center gap-10">
          <div className="flex items-center gap-2.5">
            <span
              className="bg-primary/10 text-primary ring-primary/20 flex size-9 shrink-0 items-center justify-center rounded-lg ring-1"
              aria-hidden
            >
              <Briefcase className="size-[1.35rem]" strokeWidth={2} />
            </span>
            <span className="text-xl font-bold leading-tight">
              Job Application Tracker
            </span>
          </div>

          <nav className="flex flex-wrap items-center gap-4 sm:gap-6">
            {!hideEntryNavLinks ? (
              <NavLink to="/dashboard" className={navClass}>
                <LayoutDashboard size={18} />
                Dashboard
              </NavLink>
            ) : null}

            {showUsersNav ? (
              <NavLink to="/jobapplications" className={navClass}>
                <Users size={18} />
                Users
              </NavLink>
            ) : null}

            {!hideEntryNavLinks ? (
              <NavLink to="/jobs" className={navClass}>
                <Megaphone size={18} />
                Jobs
              </NavLink>
            ) : null}

            {loggedIn ? (
              <NavLink to="/reminders" className={navClass}>
                <CalendarClock size={18} />
                Reminders
              </NavLink>
            ) : null}

            {loggedIn ? (
              <NavLink to="/notifications" className={navClass}>
                <Bell size={18} />
                Notifications
              </NavLink>
            ) : null}

            {loggedIn ? (
              <NavLink to="/account" className={navClass}>
                <UserCircle size={18} />
                My Profile
              </NavLink>
            ) : null}
          </nav>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-3">
          {session ? (
            <>
              <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
                <DropdownMenuTrigger asChild>
                  <Button type="button" variant="outline" size="icon" className="relative shrink-0" aria-label="Notifications">
                    <Bell className="size-4" />
                    {unreadCount > 0 ? (
                      <Badge
                        variant="destructive"
                        className="absolute -right-1 -top-1 min-w-5 px-1 text-[10px] leading-none"
                      >
                        {unreadCount > 99 ? "99+" : unreadCount}
                      </Badge>
                    ) : null}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80">
                  <DropdownMenuLabel>Notifications</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {previewLoading ? (
                    <div className="text-muted-foreground px-2 py-3 text-sm">Loading…</div>
                  ) : preview.length === 0 ? (
                    <div className="text-muted-foreground px-2 py-3 text-sm">You&apos;re all caught up.</div>
                  ) : (
                    preview.map((n) => (
                      <DropdownMenuItem
                        key={n.id}
                        className="cursor-pointer flex-col items-start gap-1 py-2"
                        onSelect={(e) => {
                          e.preventDefault()
                          void onOpenNotification(n)
                        }}
                      >
                        <div className="flex w-full items-start justify-between gap-2">
                          <span className="line-clamp-1 font-medium">{n.title}</span>
                          {isNotificationUnread(n) ? (
                            <span className="bg-primary size-2 shrink-0 rounded-full" aria-hidden />
                          ) : null}
                        </div>
                        <span className="text-muted-foreground line-clamp-2 text-xs">{n.message}</span>
                        <span className="text-muted-foreground text-[11px]">{formatShortTime(n.sent_at)}</span>
                      </DropdownMenuItem>
                    ))
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="cursor-pointer justify-center font-medium"
                    onSelect={() => {
                      setMenuOpen(false)
                      navigate("/notifications")
                    }}
                  >
                    View all
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Avatar>
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
              <span className="font-medium hidden sm:inline max-w-[200px] truncate">
                {sessionDisplayName(session)}
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  clearSessionUser()
                  navigate("/login")
                }}
              >
                Log out
              </Button>
            </>
          ) : onLoginPage ? (
            <Button type="button" variant="outline" size="sm" asChild>
              <NavLink to="/register">Register</NavLink>
            </Button>
          ) : (
            <Button type="button" variant="outline" size="sm" asChild>
              <NavLink to="/login">Log in</NavLink>
            </Button>
          )}
        </div>
      </div>
    </header>
  )
}
