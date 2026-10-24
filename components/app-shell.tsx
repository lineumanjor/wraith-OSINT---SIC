'use client'

import { LabNotice } from '@/components/lab-notice'
import { cn } from '@/lib/utils'
import { Cpu, Eye, FlaskConical, Link2, Radar } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV = [
  { href: '/', label: 'Wraith Dashboard', short: 'Dashboard', icon: Radar, code: '01' },
  { href: '/forge', label: 'Link Forge', short: 'Forge', icon: Link2, code: '02' },
  { href: '/preview', label: 'Ghost Preview', short: 'Preview', icon: Eye, code: '03' },
  { href: '/engine', label: 'Spectre Engine', short: 'Engine', icon: Cpu, code: '04' },
]

function WraithMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden fill="none">
      <path
        d="M16 2.5 29 16 16 29.5 3 16 16 2.5Z"
        stroke="currentColor"
        strokeWidth="1.2"
        opacity="0.55"
      />
      <path d="M16 8.5 23.5 16 16 23.5 8.5 16 16 8.5Z" fill="currentColor" opacity="0.16" />
      <circle cx="16" cy="16" r="2.4" fill="currentColor" />
    </svg>
  )
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <div className="flex min-h-dvh">
      <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar lg:flex">
        <div className="flex items-center gap-3 px-5 py-5">
          <WraithMark className="size-8 text-primary" />
          <div className="leading-tight">
            <p className="font-mono text-sm font-semibold tracking-[0.22em] text-foreground">
              WRAITH
            </p>
            <p className="font-mono text-[10px] tracking-[0.28em] text-muted-foreground">
              OSINT LAB
            </p>
          </div>
        </div>

        <nav className="flex flex-1 flex-col gap-1 px-3 py-2" aria-label="Navegação principal">
          {NAV.map((item) => {
            const active = pathname === item.href
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors',
                  active
                    ? 'bg-primary/12 text-foreground'
                    : 'text-muted-foreground hover:bg-white/[0.04] hover:text-foreground',
                )}
              >
                {active && (
                  <span className="absolute top-1/2 left-0 h-5 w-0.5 -translate-y-1/2 rounded-full bg-primary" />
                )}
                <Icon
                  className={cn('size-4 shrink-0', active ? 'text-primary' : 'text-muted-foreground')}
                  aria-hidden
                />
                <span className="flex-1 truncate">{item.label}</span>
                <span className="font-mono text-[10px] text-muted-foreground/60">{item.code}</span>
              </Link>
            )
          })}
        </nav>

        <div className="border-t border-sidebar-border p-3">
          <div className="rounded-lg border border-accent/20 bg-accent/[0.05] p-3">
            <p className="flex items-center gap-1.5 font-mono text-[10px] font-semibold tracking-[0.16em] text-accent uppercase">
              <FlaskConical className="size-3" aria-hidden />
              Laboratório
            </p>
            <p className="mt-1.5 text-[11px] leading-relaxed text-muted-foreground">
              Uso educacional. Dados sintéticos ou consentidos.
            </p>
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 border-b border-border bg-background/85 backdrop-blur-md">
          <div className="flex items-center justify-between gap-3 px-4 py-3 sm:px-6">
            <div className="flex items-center gap-2.5 lg:hidden">
              <WraithMark className="size-6 text-primary" />
              <span className="font-mono text-xs font-semibold tracking-[0.2em]">WRAITH</span>
            </div>
            <div className="hidden items-center gap-2 lg:flex">
              <span className="relative flex size-2">
                <span className="absolute inline-flex size-full animate-wraith-pulse rounded-full bg-accent" />
                <span className="relative inline-flex size-2 rounded-full bg-accent" />
              </span>
              <span className="font-mono text-[11px] tracking-[0.16em] text-muted-foreground uppercase">
                Spectre Engine · operacional
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="rounded-full border border-border px-2.5 py-1 font-mono text-[10px] tracking-[0.14em] text-muted-foreground uppercase">
                v0.9 · lab
              </span>
            </div>
          </div>

          <nav
            className="flex gap-1 overflow-x-auto border-t border-border px-3 py-2 lg:hidden"
            aria-label="Navegação principal"
          >
            {NAV.map((item) => {
              const active = pathname === item.href
              const Icon = item.icon
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'flex shrink-0 items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs transition-colors',
                    active
                      ? 'bg-primary/15 text-foreground'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  <Icon className="size-3.5" aria-hidden />
                  {item.short}
                </Link>
              )
            })}
          </nav>
        </header>

        <LabNotice />

        <main className="flex-1">{children}</main>
      </div>
    </div>
  )
}
