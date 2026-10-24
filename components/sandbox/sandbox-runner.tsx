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
import { Check, Loader2, MapPin, ShieldCheck } from 'lucide-react'
import { useState } from 'react'

type Step = 'briefing' | 'locating' | 'done'

const TONE_CLASS = {
  ok: 'border-emerald-400/30 bg-emerald-400/10 text-emerald-300',
  warn: 'border-amber-400/30 bg-amber-400/10 text-amber-300',
  off: 'border-border bg-white/[0.04] text-muted-foreground',
} as const

function requestPosition(): Promise<GeolocationPosition | null> {
  return new Promise((resolve) => {
    if (typeof navigator === 'undefined' || !('geolocation' in navigator)) {
      resolve(null)
      return
    }
    navigator.geolocation.getCurrentPosition(
      (position) => resolve(position),
      () => resolve(null),
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 },
    )
  })
}

export function SandboxRunner() {
  const [step, setStep] = useState<Step>('briefing')
  const [consent, setConsent] = useState(false)
  const [label, setLabel] = useState('')
  const [session, setSession] = useState<SandboxSession | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function start() {
    setError(null)
    setStep('locating')

    const position = await requestPosition()

    try {
      const response = await fetch('/api/sandbox', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          consent: true,
          label: label.trim() || null,
          coords: position
            ? {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
                accuracy: position.coords.accuracy,
              }
            : null,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          screen: `${window.screen.width}x${window.screen.height}`,
          languages: (navigator.languages ?? [navigator.language]).filter(Boolean).join(','),
        }),
      })

      if (!response.ok) throw new Error(`http_${response.status}`)
      const data = (await response.json()) as { session: SandboxSession }
      setSession(data.session)
      setStep('done')
    } catch {
      setError('Não foi possível registar a sessão. Tente novamente.')
      setStep('briefing')
    }
  }

  function reset() {
    setSession(null)
    setConsent(false)
    setLabel('')
    setError(null)
    setStep('briefing')
  }

  if (step === 'done' && session) {
    const tone = LOCATION_TONE[session.locationSource]
    const hasCoords = session.latitude !== null && session.longitude !== null

    return (
      <div className="grid gap-4 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <div className="rounded-xl border border-border bg-card/40 p-5">
            <div className="flex items-center gap-2">
              <ShieldCheck className="size-4 text-emerald-400" aria-hidden />
              <h2 className="text-sm font-semibold text-foreground">Sessão registada</h2>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Este é o registo completo do que ficou guardado. Nada além disto foi recolhido.
            </p>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[10px] tracking-[0.12em] uppercase',
                  TONE_CLASS[tone],
                )}
              >
                <MapPin className="size-3" aria-hidden />
                {LOCATION_LABEL[session.locationSource]}
              </span>
              <span className="font-mono text-[10px] text-muted-foreground">{session.id}</span>
            </div>

            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
              {LOCATION_DETAIL[session.locationSource]}
            </p>

            <dl className="mt-4 grid gap-x-4 gap-y-2.5 sm:grid-cols-2">
              <Field label="Coordenadas">
                {hasCoords
                  ? `${session.latitude!.toFixed(4)}, ${session.longitude!.toFixed(4)}`
                  : '—'}
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

            <div className="mt-5 flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={reset}>
                Nova sessão
              </Button>
              {hasCoords ? (
                <a
                  href={mapsLink(session.latitude!, session.longitude!)}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="inline-flex h-8 items-center rounded-md border border-border px-3 text-xs text-muted-foreground transition-colors hover:text-foreground"
                >
                  Abrir no Google Maps
                </a>
              ) : null}
            </div>
          </div>
        </div>

        <div className="lg:col-span-5">
          {hasCoords ? (
            <div className="overflow-hidden rounded-xl border border-border bg-card/40">
              <iframe
                title="Mapa da localização registada"
                src={mapsEmbedUrl(session.latitude!, session.longitude!, session.locationSource === 'gps' ? 15 : 9)}
                className="h-[320px] w-full border-0"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          ) : (
            <div className="flex h-[320px] flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-card/20 px-6 text-center">
              <MapPin className="size-5 text-muted-foreground/60" aria-hidden />
              <p className="text-sm font-medium text-foreground">Localização Indisponível</p>
              <p className="max-w-[26ch] text-xs text-muted-foreground">
                Sem coordenadas do navegador e sem estimativa por IP. O registo mantém-se válido.
              </p>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="grid gap-4 lg:grid-cols-12">
      <div className="lg:col-span-7">
        <div className="rounded-xl border border-border bg-card/40 p-5">
          <h2 className="text-sm font-semibold text-foreground">Antes de começar</h2>
          <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
            Esta é uma simulação de treino. Ao continuar, o seu navegador vai pedir autorização para
            partilhar a localização. Se recusar, a região é estimada a partir do endereço IP. Se
            nenhum dos dois funcionar, o registo fica marcado como{' '}
            <span className="text-foreground">Localização Indisponível</span>.
          </p>

          <ul className="mt-4 space-y-2">
            {[
              'Coordenadas do navegador, apenas se autorizar',
              'Região estimada por IP, se recusar',
              'Fuso horário, idiomas, ecrã e navegador',
            ].map((item) => (
              <li key={item} className="flex items-start gap-2 text-xs text-muted-foreground">
                <Check className="mt-0.5 size-3.5 shrink-0 text-primary" aria-hidden />
                {item}
              </li>
            ))}
          </ul>

          <div className="mt-5">
            <label
              htmlFor="sandbox-label"
              className="font-mono text-[10px] tracking-[0.16em] text-muted-foreground uppercase"
            >
              Etiqueta da sessão (opcional)
            </label>
            <input
              id="sandbox-label"
              value={label}
              onChange={(event) => setLabel(event.target.value)}
              placeholder="ex.: turma A — exercício 3"
              maxLength={120}
              className="mt-1.5 w-full rounded-md border border-border bg-background/60 px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground/60 focus:border-primary/50"
            />
          </div>

          <label className="mt-4 flex cursor-pointer items-start gap-2.5 rounded-lg border border-border bg-background/40 p-3">
            <input
              type="checkbox"
              checked={consent}
              onChange={(event) => setConsent(event.target.checked)}
              className="mt-0.5 size-4 shrink-0 accent-[var(--primary)]"
            />
            <span className="text-xs leading-relaxed text-muted-foreground">
              Compreendo que esta é uma simulação de treino e autorizo o registo dos dados acima
              para esta sessão.
            </span>
          </label>

          {error ? (
            <p role="alert" className="mt-3 text-xs text-destructive">
              {error}
            </p>
          ) : null}

          <div className="mt-4 flex items-center gap-3">
            <Button onClick={start} disabled={!consent || step === 'locating'}>
              {step === 'locating' ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" aria-hidden />
                  A localizar…
                </>
              ) : (
                'Iniciar simulação'
              )}
            </Button>
            <p aria-live="polite" className="text-xs text-muted-foreground">
              {step === 'locating' ? 'A aguardar resposta do navegador.' : ''}
            </p>
          </div>
        </div>
      </div>

      <div className="lg:col-span-5">
        <div className="rounded-xl border border-border bg-card/40 p-5">
          <h2 className="font-mono text-[10px] tracking-[0.16em] text-muted-foreground uppercase">
            Como funciona o fallback
          </h2>
          <ol className="mt-3 space-y-3">
            {[
              {
                step: '01',
                title: 'Geolocalização do navegador',
                body: 'O navegador pede autorização. Se aceitar, as coordenadas são exatas.',
              },
              {
                step: '02',
                title: 'Estimativa por endereço IP',
                body: 'Se recusar, a região é estimada pela operadora e pela rede de origem.',
              },
              {
                step: '03',
                title: 'Localização Indisponível',
                body: 'Se ambos falharem, o estado é registado sem coordenadas.',
              },
            ].map((item) => (
              <li key={item.step} className="flex gap-3">
                <span className="font-mono text-[10px] text-primary/70">{item.step}</span>
                <div>
                  <p className="text-xs font-medium text-foreground">{item.title}</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                    {item.body}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>
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
