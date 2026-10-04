export function Swatch({ name, token, note }: { name: string; token: string; note?: string }) {
  return (
    <div className="flex items-center gap-3">
      <span
        aria-hidden
        className="size-10 shrink-0 rounded-xl border border-border"
        style={{ background: `var(--${token})` }}
      />
      <span className="grid text-sm leading-tight">
        <span className="font-bold">{name}</span>
        <code className="text-xs text-muted-foreground">--{token}</code>
        {note ? <span className="text-xs text-muted-foreground">{note}</span> : null}
      </span>
    </div>
  )
}
