'use client'

import { GhostPreview } from '@/components/ghost-preview'
import { collectFingerprint, sendCapture } from '@/lib/spectre/collect-client'
import type { PreviewStyle } from '@/lib/spectre/types'
import { cn } from '@/lib/utils'
import { ArrowRight, FlaskConical, Loader2, ShieldCheck } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

type GhostRedirectProps = {
  linkId: string
  destination: string
  style: PreviewStyle
  title: string
  description: string | null
  source: string | null
  active: boolean
}

type Phase = 'collecting' | 'ready' | 'failed'

export function GhostRedirect({
  linkId,
  destination,
  style,
  title,
  description,
  source,
  active,
}: GhostRedirectProps) {
  const [phase, setPhase] = useState<Phase>('collecting')
  const started = useRef(false)

  useEffect(() => {
    if (!active || started.current) return
    started.current = true

    let cancelled = false

    async function run() {
      try {
        const fingerprint = collectFingerprint()
        await sendCapture(linkId, fingerprint)
        if (!cancelled) setPhase('ready')
      } catch {
        if (!cancelled) setPhase('failed')
      }
    }

    void run()
    return () => {
      cancelled = true
    }
  }, [active, linkId])

  useEffect(() => {
    if (phase === 'collecting') return
    const timer = window.setTimeout(() => {
      window.location.replace(destination)
    }, 1100)
    return () => window.clearTimeout(timer)
  }, [phase, destination])

  if (!active) {
    return (
      <div className="flex min-h-dvh items-center justify-center px-4">
        <div className="w-full max-w-sm rounded-xl border border-border bg-card p-6 text-center">
          <p className="font-mono text-[10px] tracking-[0.18em] text-muted-foreground uppercase">
            Wraith OSINT · laboratório
          </p>
          <h1 className="mt-2 text-lg font-semibold text-foreground">Link desativado</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Este link de laboratório foi encerrado pelo operador.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden px-4 py-10">
      <div className="pointer-events-none absolute inset-0 grid-field opacity-30" aria-hidden />
      <div
        className="pointer-events-none absolute top-0 left-1/2 h-64 w-[36rem] -translate-x-1/2 rounded-full bg-primary/10 blur-3xl"
        aria-hidden
      />

      <div className="relative w-full max-w-md">
        <div className="mb-5 flex items-center justify-center gap-2">
          <span className="relative flex size-2">
            <span className="absolute inline-flex size-full animate-wraith-pulse rounded-full bg-primary" />
            <span className="relative inline-flex size-2 rounded-full bg-primary" />
          </span>
          <span className="font-mono text-[10px] tracking-[0.24em] text-muted-foreground uppercase">
            Wraith OSINT · laboratório
          </span>
        </div>

        <div className="rounded-2xl border border-border bg-card/80 p-5 backdrop-blur-sm">
          <GhostPreview style={style} title={title} description={description} source={source} />

          <div className="mt-6">
            <div className="h-1 w-full overflow-hidden rounded-full bg-white/8">
              <div
                className={cn(
                  'h-full rounded-full bg-primary transition-all duration-700 ease-out',
                  phase === 'collecting' ? 'w-1/3' : 'w-full',
                )}
              />
            </div>

            <p className="mt-3 flex items-center justify-center gap-2 text-xs text-muted-foreground">
              {phase === 'collecting' ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" aria-hidden />
                  Verificando integridade do link…
                </>
              ) : phase === 'ready' ? (
                <>
                  <ShieldCheck className="size-3.5 text-accent" aria-hidden />
                  Link verificado. Redirecionando…
                </>
              ) : (
                <>
                  <ShieldCheck className="size-3.5 text-muted-foreground" aria-hidden />
                  Não foi possível registrar o acesso. Redirecionando…
                </>
              )}
            </p>

            <a
              href={destination}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-background/60 px-4 py-2.5 text-sm text-foreground transition-colors hover:border-primary/40"
            >
              Continuar agora
              <ArrowRight className="size-3.5" aria-hidden />
            </a>
          </div>
        </div>

        <div className="mt-4 flex items-start gap-2 rounded-lg border border-accent/20 bg-accent/[0.05] px-3 py-2.5">
          <FlaskConical className="mt-0.5 size-3.5 shrink-0 text-accent" aria-hidden />
          <p className="text-[11px] leading-relaxed text-muted-foreground">
            <span className="font-medium text-accent">Ambiente de laboratório.</span> Este
            redirecionamento registra dados técnicos do seu navegador (tela, hardware, fuso, IP e
            User-Agent) para fins de estudo. Não insira dados pessoais reais.
          </p>
        </div>
      </div>
    </div>
  )
}
