import { useMemo } from "react"
import { NavLink, useLocation, useNavigate } from "react-router-dom"
import { LayoutDashboard, Users, Bell, Megaphone } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { clearSessionUser, getSessionUser, sessionDisplayName } from "@/lib/sessionUser"

export default function AppHeader() {
  const navigate = useNavigate()
  const location = useLocation()
  const session = useMemo(() => getSessionUser(), [location.pathname])

  const navClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-2 text-sm font-medium ${
      isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
    }`

  const initials = session
    ? `${session.first_name?.[0] ?? ""}${session.last_name?.[0] ?? ""}`.trim() ||
      session.email.slice(0, 2).toUpperCase()
    : "?"

  return (
    <header className="border-b bg-white">
      <div className="flex items-center justify-between px-6 py-4">
        {/* Left Section */}
        <div className="flex items-center gap-10">
          <div className="text-xl font-bold">Job Application Tracker</div>

          <nav className="flex items-center gap-6">
            <NavLink to="/" className={navClass}>
              <LayoutDashboard size={18} />
              Dashboard
            </NavLink>

            <NavLink to="/jobapplications" className={navClass}>
              <Users size={18} />
              Users
            </NavLink>

            <NavLink to="/jobs" className={navClass}>
              <Megaphone size={18} />
              Jobs
            </NavLink>

            <NavLink to="/reminders" className={navClass}>
              <Bell size={18} />
              Reminders
            </NavLink>
          </nav>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-3">
          {session ? (
            <>
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
