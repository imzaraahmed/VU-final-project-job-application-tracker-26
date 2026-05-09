import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Link } from "react-router-dom"
import { useState } from "react"
import axios from "axios"
import { useNavigate } from "react-router-dom"
import { setSessionUser, type SessionUser } from "@/lib/sessionUser"

export default function LoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const res = await axios.post<{ message?: string; user: SessionUser }>(
        "http://localhost:5000/api/jobApplications/login",
        {
          email,
          password,
        }
      )

      const u = res.data?.user
      if (u?.id != null) {
        setSessionUser({
          id: Number(u.id),
          email: String(u.email ?? ""),
          first_name: String(u.first_name ?? ""),
          last_name: String(u.last_name ?? ""),
        })
      }

      navigate("/")
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const backendMessage =
          typeof err.response?.data?.message === "string"
            ? err.response.data.message
            : ""
        const statusText = err.response?.status
          ? ` (HTTP ${err.response.status})`
          : ""
        setError(backendMessage || `Login failed${statusText}`)
      } else {
        setError("Login failed")
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="p-6 flex min-h-[70vh] items-center justify-center">
        <div className="w-[40%]">
          <div className="mb-4">
            <h1 className="text-3xl font-bold">Login</h1>
          </div>

          <Card>
            <CardContent>
              <div className="grid grid-cols-1 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="login-email">Email</Label>
                  <Input
                    id="login-email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="login-password">Password</Label>
                  <Input
                    id="login-password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>

                {error && (
                  <p className="text-sm text-red-600">{error}</p>
                )}

                <div className="flex justify-end gap-4">
                  <Link to="/">
                    <Button type="button" variant="outline">
                      Cancel
                    </Button>
                  </Link>

                  <Button type="submit" disabled={loading}>
                    {loading ? "Logging in..." : "Login"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </form>
  )
}
