import type { DashboardStats } from '@/lib/spectre/types'
import { Activity, Globe2, Link2, Smartphone, Bot, Clock3 } from 'lucide-react'

const CARDS = [
  {
    key: 'total' as const,
    label: 'Perfis capturados',
    icon: Activity,
    format: (s: DashboardStats) => String(s.total),
    hint: 'total acumulado',
  },
  {
    key: 'last24h' as const,
    label: 'Últimas 24h',
    icon: Clock3,
    format: (s: DashboardStats) => String(s.last24h),
    hint: 'acessos recentes',
  },
  {
    key: 'countries' as const,
    label: 'Países',
    icon: Globe2,
    format: (s: DashboardStats) => String(s.countries),
    hint: 'origens distintas',
  },
  {
    key: 'mobileShare' as const,
    label: 'Móvel',
    icon: Smartphone,
    format: (s: DashboardStats) => `${s.mobileShare}%`,
    hint: 'do total',
  },
  {
    key: 'bots' as const,
    label: 'Bots / preview',
    icon: Bot,
    format: (s: DashboardStats) => String(s.bots),
    hint: 'crawlers de preview',
  },
  {
    key: 'activeLinks' as const,
    label: 'Links ativos',
    icon: Link2,
    format: (s: DashboardStats) => String(s.activeLinks),
    hint: 'em circulação',
  },
]

export function StatGrid({ stats }: { stats: DashboardStats }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
      {CARDS.map((card) => {
        const Icon = card.icon
        return (
          <div
            key={card.key}
            className="group relative overflow-hidden rounded-xl border border-border bg-card p-3.5 transition-colors hover:border-primary/30"
          >
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] tracking-[0.14em] text-muted-foreground uppercase">
                {card.label}
              </span>
              <Icon className="size-3.5 text-muted-foreground/70" aria-hidden />
            </div>
            <p className="mt-2 font-mono text-2xl leading-none font-semibold tracking-tight text-foreground">
              {card.format(stats)}
            </p>
            <p className="mt-1.5 text-[10px] text-muted-foreground/70">{card.hint}</p>
            <div
              className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent opacity-0 transition-opacity group-hover:opacity-100"
              aria-hidden
            />
          </div>
        )
      })}
    </div>
  )
}
