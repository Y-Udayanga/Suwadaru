import type { ReactNode } from "react"
import { AppLogo } from "@/components/layout/AppLogo"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface AuthCardProps {
  title: string
  description?: string
  children: ReactNode
  footer?: ReactNode
  className?: string
}

export function AuthCard({
  title,
  description,
  children,
  footer,
  className,
}: AuthCardProps) {
  return (
    <div className="flex w-full items-center justify-center py-6 sm:py-10">
      <Card
        className={cn(
          "w-full max-w-md border-border/80 bg-card/95 shadow-lg backdrop-blur-sm",
          "focus-within:ring-1 focus-within:ring-primary/20",
          className,
        )}
      >
        <CardHeader className="gap-3 pb-4 text-center sm:text-left">
          <div className="flex justify-center sm:justify-start">
            <AppLogo asLink />
          </div>
          <div>
            <CardTitle className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
              {title}
            </CardTitle>
            {description && (
              <CardDescription className="mt-1 text-sm text-muted-foreground">
                {description}
              </CardDescription>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-4 pt-0">{children}</CardContent>

        {footer && (
          <CardFooter className="flex flex-col gap-3 border-t border-border/50 bg-muted/30 pt-4 pb-4 text-center text-sm">
            {footer}
          </CardFooter>
        )}
      </Card>
    </div>
  )
}
