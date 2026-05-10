import type { ReactNode } from "react"
import { Navigate, useLocation } from "react-router-dom"
import { getAuthToken } from "@/lib/sessionUser"

type ProtectedRouteProps = {
  children: ReactNode
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const location = useLocation()
  if (!getAuthToken()) {
    return (
      <Navigate to="/login" replace state={{ from: location.pathname }} />
    )
  }
  return <>{children}</>
}
