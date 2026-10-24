import { Link } from "react-router"
import { Button } from "@/components/ui/button"
import { routes } from "@/app/routes"

export function LandingPage() {
  return (
    <section className="flex max-w-2xl flex-col gap-4">
      <h1 className="text-3xl font-semibold tracking-tight text-balance">SuwaDaru</h1>
      <p className="text-lg text-balance">
        Every Child. Every Milestone. A Healthier Tomorrow.
      </p>
      <p className="text-muted-foreground">
        A caregiver companion preview for appointments, parent-reported
        vaccinations, growth history, and feeding education. The paper child
        health record remains the family-held record.
      </p>
      <div className="flex flex-wrap gap-2">
        <Button asChild size="lg" className="min-h-11">
          <Link to={routes.register}>Get started</Link>
        </Button>
        <Button asChild variant="outline" size="lg" className="min-h-11">
          <Link to={routes.login}>Sign in</Link>
        </Button>
      </div>
    </section>
  )
}
