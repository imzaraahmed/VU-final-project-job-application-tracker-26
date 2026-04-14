import { NavLink } from "react-router-dom"
import { LayoutDashboard, Briefcase, Bell, } from "lucide-react"
import { Avatar, AvatarFallback, } from "@/components/ui/avatar"

export default function AppHeader() {
  const navClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-2 text-sm font-medium ${
      isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
    }`

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
              <Briefcase size={18} />
              Job Applications
            </NavLink>

            <NavLink to="/reminders" className={navClass}>
              <Bell size={18} />
              Reminders
            </NavLink>

          </nav>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-3">
          <Avatar>
            
            <AvatarFallback>ZA</AvatarFallback>
          </Avatar>
          <span className="font-medium">Zara Ahmed</span>
        </div>
      </div>
    </header>
  )
}
