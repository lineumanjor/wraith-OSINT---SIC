import { cn } from '@/lib/utils'
import type { LucideIcon } from 'lucide-react'

export const inputClass =
  'w-full rounded-lg border border-border bg-background/60 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/60 outline-none transition-colors focus:border-primary/60 focus:ring-2 focus:ring-primary/20'

export function Field({
  label,
  htmlFor,
  hint,
  children,
  className,
}: {
  label: string
  htmlFor?: string
  hint?: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={className}>
      <label htmlFor={htmlFor} className="mb-1.5 block text-xs font-medium text-muted-foreground">
        {label}
      </label>
      {children}
      {hint && <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground/70">{hint}</p>}
    </div>
  )
}

export function Panel({
  title,
  description,
  icon: Icon,
  children,
  className,
}: {
  title: string
  description?: string
  icon?: LucideIcon
  children: React.ReactNode
  className?: string
}) {
  return (
    <section className={cn('rounded-xl border border-border bg-card/40', className)}>
      <header className="flex items-start gap-2.5 border-b border-border px-4 py-3">
        {Icon && <Icon className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />}
        <div>
          <h2 className="text-sm font-semibold text-foreground">{title}</h2>
          {description && (
            <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">{description}</p>
          )}
        </div>
      </header>
      <div className="p-4">{children}</div>
    </section>
  )
}

export function EmptyState({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-lg border border-dashed border-border px-3 py-6 text-center text-xs text-muted-foreground">
      {children}
    </p>
  )
}
