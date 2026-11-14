'use client'

import { cn } from '@/lib/utils'
import { ExternalLink, Layers, MapPin } from 'lucide-react'
import { useMemo, useState } from 'react'

export type MapPoint = {
  id: string
  label: string
  detail?: string | null
  coordinates: [number, number]
  tone?: 'primary' | 'accent' | 'warn'
}

const TONE_DOT: Record<NonNullable<MapPoint['tone']>, string> = {
  primary: 'bg-[oklch(0.72_0.15_292)]',
  accent: 'bg-[oklch(0.78_0.13_195)]',
  warn: 'bg-[oklch(0.78_0.14_75)]',
}

function formatCoordinates([lng, lat]: [number, number]) {
  return `${lat.toFixed(4)}, ${lng.toFixed(4)}`
}

function embedSource([lng, lat]: [number, number], mode: (typeof MAP_MODES)[number]['value']) {
  const embedMode = mode === 'roadmap' ? 'm' : mode === 'satellite' ? 'k' : mode === 'hybrid' ? 'h' : 'p'
  return `https://maps.google.com/maps?q=${lat},${lng}&z=13&t=${embedMode}&hl=pt-PT&output=embed`
}

const MAP_MODES = [
  { value: 'roadmap', label: 'Mapa' },
  { value: 'satellite', label: 'Satélite' },
  { value: 'hybrid', label: 'Híbrido' },
  { value: 'terrain', label: 'Terreno' },
] as const

export function GeoMap({
  points,
  caption = 'Localizações registadas',
  emptyLabel = 'sem coordenadas registadas',
  className,
}: {
  points: MapPoint[]
  caption?: string
  emptyLabel?: string
  className?: string
}) {
  const valid = useMemo(
    () =>
      points.filter(
        (point) => Number.isFinite(point.coordinates[0]) && Number.isFinite(point.coordinates[1]),
      ),
    [points],
  )

  const [activeId, setActiveId] = useState<string | null>(null)
  const [mapMode, setMapMode] = useState<(typeof MAP_MODES)[number]['value']>('roadmap')
  const active = valid.find((point) => point.id === activeId) ?? valid[0] ?? null

  return (
    <div
      className={cn(
        'overflow-hidden rounded-xl border border-border bg-card/40',
        className,
      )}
    >
      <div className="flex items-center justify-between gap-3 border-b border-border px-3 py-2">
        <span className="font-mono text-[10px] tracking-[0.14em] text-muted-foreground uppercase">
          {caption}
        </span>
        <span className="font-mono text-[10px] text-muted-foreground">
          {valid.length} {valid.length === 1 ? 'ponto' : 'pontos'} · Google Maps
        </span>
      </div>

      <div className="flex flex-col md:flex-row">
        <div className="relative min-h-[280px] flex-1 bg-[oklch(0.155_0.016_285)] md:min-h-[340px]">
          {active ? (
            <iframe
              key={`${active.id}-${mapMode}`}
              title={`Mapa de ${active.label}`}
              src={embedSource(active.coordinates, mapMode)}
              className="absolute inset-0 size-full border-0"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <p className="rounded-md border border-border bg-background/80 px-3 py-1.5 font-mono text-[11px] tracking-wide text-muted-foreground">
                {emptyLabel}
              </p>
            </div>
          )}
          {active && (
            <div className="absolute left-3 top-3 flex items-center gap-1 rounded-lg border border-border/80 bg-background/90 p-1 shadow-lg backdrop-blur">
              <Layers className="ml-1 size-3 text-muted-foreground" aria-hidden />
              {MAP_MODES.map((mode) => (
                <button
                  key={mode.value}
                  type="button"
                  onClick={() => setMapMode(mode.value)}
                  aria-pressed={mapMode === mode.value}
                  className={cn(
                    'rounded-md px-2 py-1 font-mono text-[10px] transition-colors',
                    mapMode === mode.value
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                  )}
                >
                  {mode.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {valid.length > 0 && (
          <ul className="max-h-[340px] shrink-0 divide-y divide-border overflow-y-auto border-t border-border md:w-60 md:border-t-0 md:border-l">
            {valid.map((point) => {
              const isActive = active?.id === point.id
              return (
                <li key={point.id}>
                  <button
                    type="button"
                    onClick={() => setActiveId(point.id)}
                    aria-pressed={isActive}
                    className={cn(
                      'flex w-full items-start gap-2 px-3 py-2.5 text-left transition-colors',
                      isActive ? 'bg-primary/10' : 'hover:bg-white/[0.03]',
                    )}
                  >
                    <span
                      className={cn(
                        'mt-1 size-1.5 shrink-0 rounded-full',
                        TONE_DOT[point.tone ?? 'primary'],
                      )}
                      aria-hidden
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-xs text-foreground">{point.label}</span>
                      <span className="mt-0.5 block font-mono text-[10px] text-muted-foreground">
                        {formatCoordinates(point.coordinates)}
                      </span>
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      {active && (
        <div className="flex items-center justify-between gap-3 border-t border-border px-3 py-2">
          <span className="flex min-w-0 items-center gap-1.5 text-[11px] text-muted-foreground">
            <MapPin className="size-3 shrink-0" aria-hidden />
            <span className="truncate">{active.label}</span>
          </span>
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${active.coordinates[1]},${active.coordinates[0]}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex shrink-0 items-center gap-1 font-mono text-[10px] tracking-wide text-primary uppercase transition-colors hover:text-primary/80"
          >
            Abrir
            <ExternalLink className="size-3" aria-hidden />
          </a>
        </div>
      )}
    </div>
  )
}
