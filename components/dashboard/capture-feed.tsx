'use client'

import { flagEmoji, relativeTime } from '@/lib/format'
import type { Capture } from '@/lib/spectre/types'
import { cn } from '@/lib/utils'
import { Monitor, Smartphone, Tablet, Bot, Inbox } from 'lucide-react'

const DEVICE_ICON = {
  mobile: Smartphone,
  tablet: Tablet,
  desktop: Monitor,
  bot: Bot,
  unknown: Monitor,
} as const

export function CaptureFeed({
  captures,
  selectedId,
  onSelect,
}: {
  captures: Capture[]
  selectedId: number | null
  onSelect: (capture: Capture) => void
}) {
  if (captures.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-card/40 px-6 py-14 text-center">
        <Inbox className="size-7 text-muted-foreground/40" aria-hidden />
        <div>
          <p className="text-sm font-medium text-foreground">Nenhum perfil capturado</p>
          <p className="mx-auto mt-1 max-w-sm text-xs leading-relaxed text-muted-foreground">
            Crie um link no Link Forge e abra-o em outro dispositivo ou aba anônima para gerar o
            primeiro registro do Spectre Engine.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <div className="hidden grid-cols-[80px_1fr_1fr_1fr_120px] gap-3 border-b border-border px-4 py-2 font-mono text-[9px] tracking-[0.14em] text-muted-foreground uppercase md:grid">
        <span>Hora</span>
        <span>Dispositivo</span>
        <span>Navegador</span>
        <span>Origem</span>
        <span className="text-right">IP</span>
      </div>

      <ul className="scrollbar-thin max-h-[26rem] divide-y divide-border overflow-y-auto">
        {captures.map((capture) => {
          const Icon =
            DEVICE_ICON[(capture.deviceType as keyof typeof DEVICE_ICON) ?? 'unknown'] ?? Monitor
          const active = selectedId === capture.id
          const place = [capture.city, capture.country].filter(Boolean).join(', ')

          return (
            <li key={capture.id}>
              <button
                type="button"
                onClick={() => onSelect(capture)}
                aria-pressed={active}
                className={cn(
                  'grid w-full grid-cols-[1fr_auto] items-center gap-3 px-4 py-2.5 text-left transition-colors md:grid-cols-[80px_1fr_1fr_1fr_120px]',
                  active ? 'bg-primary/10' : 'hover:bg-white/[0.03]',
                )}
              >
                <span className="hidden font-mono text-[11px] text-muted-foreground md:block">
                  {relativeTime(capture.createdAt)}
                </span>

                <span className="flex min-w-0 items-center gap-2">
                  <Icon
                    className={cn(
                      'size-3.5 shrink-0',
                      capture.isBot ? 'text-amber-300' : 'text-primary/80',
                    )}
                    aria-hidden
                  />
                  <span className="min-w-0">
                    <span className="block truncate text-[12px] text-foreground/90">
                      {capture.deviceModel || capture.os || 'Desconhecido'}
                    </span>
                    <span className="block truncate font-mono text-[10px] text-muted-foreground md:hidden">
                      {relativeTime(capture.createdAt)} · {place || 'origem n/d'}
                    </span>
                  </span>
                </span>

                <span className="hidden truncate font-mono text-[11px] text-muted-foreground md:block">
                  {[capture.browser, capture.browserVersion].filter(Boolean).join(' ') || '—'}
                </span>

                <span className="hidden min-w-0 items-center gap-1.5 md:flex">
                  <span className="text-[11px]">{flagEmoji(capture.countryCode)}</span>
                  <span className="truncate text-[11px] text-muted-foreground">
                    {place || 'n/d'}
                  </span>
                </span>

                <span className="hidden truncate text-right font-mono text-[11px] text-muted-foreground md:block">
                  {capture.ip ?? '—'}
                </span>

                <span className="font-mono text-[10px] text-muted-foreground md:hidden">
                  {capture.ip ?? '—'}
                </span>
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
