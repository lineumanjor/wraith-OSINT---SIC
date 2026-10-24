'use client'

import { Button } from '@/components/ui/button'
import {
  LOCATION_DETAIL,
  LOCATION_LABEL,
  LOCATION_TONE,
  mapsEmbedUrl,
  mapsLink,
  type SandboxSession,
} from '@/lib/sandbox/types'
import { cn } from '@/lib/utils'
import { MapPin, RefreshCw } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'

const TONE_CLASS = {
  ok: 'border-emerald-400/30 bg-emerald-400/10 text-emerald-300',
  warn: 'border-amber-400/30 bg-amber-400/10 text-amber-300',
  off: 'border-border bg-white/[0.04] text-muted-foreground',
} as const

function formatTime(iso: string) {
  return new Date(iso).toLocaleString('pt-PT', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function SandboxMonitor({ sessions }: { sessions: SandboxSession[] }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [selectedId, setSelectedId] = useState<string | null>(sessions[0]?.id ?? null)

  const selected = sessions.find((item) => item.id === selectedId) ?? sessions[0] ?? null

  const counts = {
    gps: sessions.filter((item) => item.locationSource === 'gps').length,
    ip: sessions.filter((item) => item.locationSource === 'ip').length,
    unavailable: sessions.filter((item) => item.locationSource === 'unavailable').length,
  }

  if (sessions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-card/20 px-6 py-16 text-center">
        <MapPin className="size-5 text-muted-foreground/60" aria-hidden />
        <p className="text-sm font-medium text-foreground">Sem sessões registadas</p>
        <p className="max-w-[42ch] text-xs text-muted-foreground">
          Abra o simulador de treino e conclua uma sessão para ver os registos aqui.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <Stat label="Precisa (GPS)" value={counts.gps} tone="ok" />
        <Stat label="Aproximada (IP)" value={counts.ip} tone="warn" />
        <Stat label="Indisponível" value={counts.unavailable} tone="off" />
      </div>

      <div className="grid gap-4 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <div className="rounded-xl border border-border bg-card/40">
            <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
              <h2 className="font-mono text-[10px] tracking-[0.16em] text-muted-foreground uppercase">
                Sessões
              </h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => startTransition(() => router.refresh())}
                disabled={pending}
                className="h-7 gap-1.5 px-2 text-xs"
              >
                <RefreshCw className={cn('size-3', pending && 'animate-spin')} aria-hidden />
                Atualizar
              </Button>
            </div>
            <ul className="max-h-[520px] divide-y divide-border overflow-y-auto">
              {sessions.map((session) => {
                const active = session.id === selected?.id
                return (
                  <li key={session.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedId(session.id)}
                      aria-current={active ? 'true' : undefined}
                      className={cn(
                        'flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors',
                        active ? 'bg-primary/10' : 'hover:bg-white/[0.03]',
                      )}
                    >
                      <span
                        className={cn(
                          'size-1.5 shrink-0 rounded-full',
                          session.locationSource === 'gps'
                            ? 'bg-emerald-400'
                            : session.locationSource === 'ip'
                              ? 'bg-amber-400'
                              : 'bg-muted-foreground/40',
                        )}
                        aria-hidden
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-xs text-foreground">
                          {session.label ?? session.id}
                        </span>
                        <span className="mt-0.5 block truncate font-mono text-[10px] text-muted-foreground">
                          {formatTime(session.createdAt)} ·{' '}
                          {session.city ?? session.country ?? 'sem região'}
                        </span>
                      </span>
                      <span
                        className={cn(
                          'shrink-0 rounded-full border px-2 py-0.5 font-mono text-[9px] tracking-[0.1em] uppercase',
                          TONE_CLASS[LOCATION_TONE[session.locationSource]],
                        )}
                      >
                        {session.locationSource === 'unavailable'
                          ? 'indisponível'
                          : session.locationSource}
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
          </div>
        </div>

        <div className="lg:col-span-7">
          {selected ? <SessionDetail session={selected} /> : null}
        </div>
      </div>
    </div>
  )
}

function Stat({ label, value, tone }: { label: string; value: number; tone: 'ok' | 'warn' | 'off' }) {
  return (
    <div className="rounded-xl border border-border bg-card/40 px-4 py-3">
      <p className="font-mono text-[10px] tracking-[0.14em] text-muted-foreground uppercase">
        {label}
      </p>
      <p
        className={cn(
          'mt-1 font-mono text-2xl tabular-nums',
          tone === 'ok' ? 'text-emerald-300' : tone === 'warn' ? 'text-amber-300' : 'text-foreground',
        )}
      >
        {value}
      </p>
    </div>
  )
}

function SessionDetail({ session }: { session: SandboxSession }) {
  const hasCoords = session.latitude !== null && session.longitude !== null

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-xl border border-border bg-card/40">
        {hasCoords ? (
          <iframe
            title={`Mapa da sessão ${session.id}`}
            src={mapsEmbedUrl(
              session.latitude!,
              session.longitude!,
              session.locationSource === 'gps' ? 15 : 9,
            )}
            className="h-[300px] w-full border-0"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        ) : (
          <div className="flex h-[300px] flex-col items-center justify-center gap-2 px-6 text-center">
            <MapPin className="size-5 text-muted-foreground/60" aria-hidden />
            <p className="text-sm font-medium text-foreground">Localização Indisponível</p>
            <p className="max-w-[34ch] text-xs text-muted-foreground">
              {LOCATION_DETAIL.unavailable}
            </p>
          </div>
        )}
      </div>

      <div className="rounded-xl border border-border bg-card/40 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[10px] tracking-[0.12em] uppercase',
                TONE_CLASS[LOCATION_TONE[session.locationSource]],
              )}
            >
              <MapPin className="size-3" aria-hidden />
              {LOCATION_LABEL[session.locationSource]}
            </span>
            <span className="font-mono text-[10px] text-muted-foreground">{session.id}</span>
          </div>
          {hasCoords ? (
            <a
              href={mapsLink(session.latitude!, session.longitude!)}
              target="_blank"
              rel="noreferrer noopener"
              className="text-xs text-primary underline-offset-4 hover:underline"
            >
              Abrir no Google Maps
            </a>
          ) : null}
        </div>

        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
          {LOCATION_DETAIL[session.locationSource]}
        </p>

        <dl className="mt-4 grid gap-x-4 gap-y-2.5 sm:grid-cols-2">
          <Field label="Coordenadas">
            {hasCoords ? `${session.latitude!.toFixed(4)}, ${session.longitude!.toFixed(4)}` : '—'}
          </Field>
          <Field label="Precisão">
            {session.accuracy !== null ? `± ${Math.round(session.accuracy)} m` : '—'}
          </Field>
          <Field label="Cidade / região">
            {[session.city, session.region].filter(Boolean).join(' · ') || '—'}
          </Field>
          <Field label="País">{session.country ?? '—'}</Field>
          <Field label="Endereço IP">{session.ip ?? '—'}</Field>
          <Field label="Operadora">{session.asOrg ?? '—'}</Field>
          <Field label="Fuso horário">{session.timezone ?? '—'}</Field>
          <Field label="Ecrã">{session.screen ?? '—'}</Field>
          <Field label="Navegador">
            {[session.browser, session.os].filter(Boolean).join(' · ') || '—'}
          </Field>
          <Field label="Idiomas">{session.languages ?? '—'}</Field>
        </dl>
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="font-mono text-[10px] tracking-[0.12em] text-muted-foreground uppercase">
        {label}
      </dt>
      <dd className="mt-0.5 truncate text-xs text-foreground">{children}</dd>
    </div>
  )
}
