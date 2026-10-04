export function Swatch({ name, token, tint, note }: { name: string; token: string; tint?: string; note?: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex shrink-0">
        <span
          aria-hidden
          className="size-10 rounded-xl border border-border"
          style={{ background: `var(--${token})` }}
        />
        {tint ? (
          <span
            aria-hidden
            className="-ml-2 size-10 rounded-xl border-2 border-card"
            style={{ background: `var(--${tint})` }}
          />
        ) : null}
      </span>
      <span className="grid text-sm leading-tight">
        <span className="font-bold">{name}</span>
        <code className="text-xs text-muted-foreground">
          --{token}
          {tint ? ` · --${tint}` : ""}
        </code>
        {note ? <span className="text-xs text-muted-foreground">{note}</span> : null}
      </span>
    </div>
  )
}
