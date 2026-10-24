type FeaturePlaceholderProps = {
  title: string
  description: string
  childId?: string
}

export function FeaturePlaceholder({
  title,
  description,
  childId,
}: FeaturePlaceholderProps) {
  return (
    <article className="flex max-w-2xl min-w-0 flex-col gap-3 rounded-xl border border-border bg-card p-4">
      <p className="text-sm font-medium text-primary">Scaffold placeholder</p>
      <h1 className="text-2xl font-semibold tracking-tight text-balance">{title}</h1>
      <p className="text-muted-foreground">{description}</p>
      {childId ? (
        <p className="text-sm break-all">
          Route child id: <span className="font-mono">{childId}</span>
        </p>
      ) : null}
      <p className="text-sm">
        Fictional demonstration only. This screen does not load health records.
      </p>
    </article>
  )
}
