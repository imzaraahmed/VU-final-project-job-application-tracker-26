import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Link } from "react-router-dom"
import { Briefcase, LogIn, UserPlus } from "lucide-react"

export default function LandingPage() {
  return (
    <div className="flex min-h-[calc(70vh-5rem)] flex-col items-center justify-center p-6">
      <Card className="w-full max-w-lg border shadow-sm">
        <CardContent className="flex flex-col items-center gap-6 pt-10 pb-10 text-center">
          <div className="bg-primary/10 ring-primary/20 flex size-16 items-center justify-center rounded-2xl ring-1">
            <Briefcase className="text-primary size-8" aria-hidden />
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">
              Job Application Tracker
            </h1>
            <p className="text-muted-foreground mx-auto max-w-sm text-sm">
              Sign in to manage your pipeline, or create an applicant account to
              get started.
            </p>
          </div>
          <div className="flex w-full flex-col gap-3 sm:flex-row sm:justify-center">
            <Button type="button" size="lg" className="w-full sm:w-auto sm:min-w-36" asChild>
              <Link to="/login">
                <LogIn className="size-4" />
                Login
              </Link>
            </Button>
            <Button
              type="button"
              variant="outline"
              size="lg"
              className="w-full sm:w-auto sm:min-w-36"
              asChild
            >
              <Link to="/register">
                <UserPlus className="size-4" />
                Register
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
