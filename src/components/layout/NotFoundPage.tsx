import { Link } from "react-router"
import { House } from "lucide-react"
import { Button } from "@/components/ui/button"
import { routes } from "@/app/routes"

export function NotFoundPage() {
  return (
    <section className="flex max-w-xl flex-col gap-4">
      <h1 className="text-2xl font-semibold tracking-tight text-balance">
        This page is not available
      </h1>
      <p className="text-muted-foreground">
        The address does not match a SuwaDaru screen. You can return home or
        open the dashboard placeholder.
      </p>
      <div className="flex flex-wrap gap-2">
        <Button asChild size="lg" className="min-h-11">
          <Link to={routes.home}>
            <House data-icon="inline-start" />
            Back to home
          </Link>
        </Button>
        <Button asChild variant="outline" size="lg" className="min-h-11">
          <Link to={routes.dashboard}>Dashboard</Link>
        </Button>
      </div>
    </section>
  )
}
