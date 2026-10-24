'use client'

import { cn } from '@/lib/utils'
import { useMemo, useState } from 'react'
import { ComposableMap, Geographies, Geography, Marker } from 'react-simple-maps'

const GEO_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json'

export type MapPoint = {
  id: string
  label: string
  detail?: string | null
  coordinates: [number, number]
  tone?: 'primary' | 'accent' | 'warn'
}

const TONE_FILL: Record<NonNullable<MapPoint['tone']>, string> = {
  primary: 'oklch(0.72 0.15 292)',
  accent: 'oklch(0.78 0.13 195)',
  warn: 'oklch(0.78 0.14 75)',
}

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
  const [active, setActive] = useState<string | null>(null)

  const clusters = useMemo(() => {
    const map = new Map<string, { key: string; coordinates: [number, number]; items: MapPoint[] }>()
    for (const point of points) {
      const [lng, lat] = point.coordinates
      if (!Number.isFinite(lng) || !Number.isFinite(lat)) continue
      const key = `${Math.round(lat * 10) / 10}:${Math.round(lng * 10) / 10}`
      const existing = map.get(key)
      if (existing) existing.items.push(point)
      else map.set(key, { key, coordinates: [lng, lat], items: [point] })
    }
    return [...map.values()]
  }, [points])

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-xl border border-border bg-[oklch(0.155_0.016_285)]',
        className,
      )}
    >
      <div className="pointer-events-none absolute inset-0 grid-field opacity-40" aria-hidden />
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-primary/[0.07] to-transparent"
        aria-hidden
      />

      <ComposableMap
        width={800}
        height={400}
        projection="geoEqualEarth"
        projectionConfig={{ scale: 175, center: [0, 5] }}
        className="relative w-full"
        style={{ height: 'auto' }}
      >
        <Geographies geography={GEO_URL}>
          {({ geographies }) =>
            geographies.map((geo) => (
              <Geography
                key={geo.rsmKey}
                geography={geo}
                strokeWidth={0.4}
                className="fill-[oklch(0.34_0.028_288)] stroke-[oklch(0.46_0.035_288)] outline-none transition-colors hover:fill-[oklch(0.44_0.05_290)]"
              />
            ))
          }
        </Geographies>

        {clusters.map((cluster) => {
          const isActive = active === cluster.key
          const tone = cluster.items[0]?.tone ?? 'primary'
          const fill = TONE_FILL[tone]
          const radius = Math.min(4 + cluster.items.length * 1.6, 12)
          const label = cluster.items[0]?.label ?? ''

          return (
            <Marker
              key={cluster.key}
              coordinates={cluster.coordinates}
              onMouseEnter={() => setActive(cluster.key)}
              onMouseLeave={() => setActive(null)}
            >
              <circle r={radius + 6} fill={fill} opacity={isActive ? 0.28 : 0.14} className="animate-wraith-pulse" />
              <circle r={radius} fill={fill} opacity={0.9} />
              <circle r={radius * 0.4} fill="oklch(0.98 0.01 285)" />
              {isActive && (
                <g transform={`translate(0, ${-radius - 12})`}>
                  <rect
                    x={-70}
                    y={-16}
                    width={140}
                    height={22}
                    rx={4}
                    fill="oklch(0.19 0.02 285)"
                    stroke="oklch(0.72 0.15 292 / 40%)"
                  />
                  <text
                    textAnchor="middle"
                    y={-1}
                    fill="oklch(0.95 0.006 285)"
                    style={{ fontSize: 8, fontFamily: 'var(--font-geist-mono)' }}
                  >
                    {label.slice(0, 26)}
                    {cluster.items.length > 1 ? ` · ${cluster.items.length}` : ''}
                  </text>
                </g>
              )}
            </Marker>
          )
        })}
      </ComposableMap>

      {clusters.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="rounded-md border border-border bg-background/80 px-3 py-1.5 font-mono text-[11px] tracking-wide text-muted-foreground">
            {emptyLabel}
          </p>
        </div>
      )}

      <div className="flex items-center justify-between border-t border-border px-3 py-2">
        <span className="font-mono text-[10px] tracking-[0.14em] text-muted-foreground uppercase">
          {caption}
        </span>
        <span className="font-mono text-[10px] text-muted-foreground">
          {clusters.length} {clusters.length === 1 ? 'ponto' : 'pontos'} · {points.length}{' '}
          {points.length === 1 ? 'registo' : 'registos'}
        </span>
      </div>
    </div>
  )
}
