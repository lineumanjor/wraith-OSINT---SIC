'use client'

import { CaptureDetail } from '@/components/dashboard/capture-detail'
import { CaptureFeed } from '@/components/dashboard/capture-feed'
import { StatGrid } from '@/components/dashboard/stat-grid'
import { WorldMap } from '@/components/world-map'
import type { Capture, DashboardData } from '@/lib/spectre/types'
import { cn } from '@/lib/utils'
import { RefreshCw } from 'lucide-react'
import { useState } from 'react'
import useSWR from 'swr'

const fetcher = (url: string) => fetch(url).then((res) => res.json() as Promise<DashboardData>)

export function Dashboard({ initial }: { initial: DashboardData }) {
  const { data, isValidating, mutate } = useSWR<DashboardData>('/api/captures', fetcher, {
    fallbackData: initial,
    refreshInterval: 5000,
    revalidateOnFocus: true,
  })

  const [selectedId, setSelectedId] = useState<number | null>(null)
  const payload = data ?? initial
  const selected = payload.captures.find((c) => c.id === selectedId) ?? null

  function handleSelect(capture: Capture) {
    setSelectedId((current) => (current === capture.id ? null : capture.id))
  }

  return (
    <div className="mx-auto w-full max-w-[1500px] px-4 py-6 sm:px-6 lg:py-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="font-mono text-[10px] tracking-[0.22em] text-primary/80 uppercase">
            Painel operacional
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            Wraith Dashboard
          </h1>
          <p className="mt-1 max-w-xl text-sm text-muted-foreground">
            Perfis técnicos capturados pelo Spectre Engine e origem de rede dos acessos, em tempo
            real.
          </p>
        </div>

        <button
          type="button"
          onClick={() => mutate()}
          className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
        >
          <RefreshCw className={cn('size-3.5', isValidating && 'animate-spin')} aria-hidden />
          <span className="font-mono tracking-wide">atualizar</span>
          <span className="relative flex size-1.5">
            <span className="absolute inline-flex size-full animate-wraith-pulse rounded-full bg-accent" />
            <span className="relative inline-flex size-1.5 rounded-full bg-accent" />
          </span>
        </button>
      </div>

      <div className="mt-6">
        <StatGrid stats={payload.stats} />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <WorldMap captures={payload.captures} />
        </div>
        <div className="lg:col-span-2">
          <CaptureDetail capture={selected} />
        </div>
      </div>

      <div className="mt-4">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="font-mono text-[10px] tracking-[0.18em] text-muted-foreground uppercase">
            Feed de captura
          </h2>
          <span className="font-mono text-[10px] text-muted-foreground">
            {payload.captures.length} registros · polling 5s
          </span>
        </div>
        <CaptureFeed
          captures={payload.captures}
          selectedId={selectedId}
          onSelect={handleSelect}
        />
      </div>
    </div>
  )
}
