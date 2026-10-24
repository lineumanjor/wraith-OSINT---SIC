'use client'

import type { Capture } from '@/lib/spectre/types'
import { useMemo, useState } from 'react'
import { ComposableMap, Geographies, Geography, Marker } from 'react-simple-maps'

const GEO_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json'

type Cluster = {
  key: string
  coordinates: [number, number]
  count: number
  label: string
  latest: string
}

function clusterCaptures(captures: Capture[]): Cluster[] {
  const map = new Map<string, Cluster>()

  for (const capture of captures) {
    if (capture.latitude == null || capture.longitude == null) continue
    const lat = Math.round(capture.latitude * 10) / 10
    const lng = Math.round(capture.longitude * 10) / 10
    const key = `${lat}:${lng}`
    const existing = map.get(key)

    if (existing) {
      existing.count += 1
      if (capture.createdAt > existing.latest) existing.latest = capture.createdAt
    } else {
      map.set(key, {
        key,
        coordinates: [lng, lat],
        count: 1,
        label: [capture.city, capture.country].filter(Boolean).join(', ') || 'Origem desconhecida',
        latest: capture.createdAt,
      })
    }
  }

  return [...map.values()].sort((a, b) => b.count - a.count)
}

export function WorldMap({ captures }: { captures: Capture[] }) {
  const clusters = useMemo(() => clusterCaptures(captures), [captures])
  const [active, setActive] = useState<string | null>(null)

  return (
    <div className="relative overflow-hidden rounded-xl border border-border bg-[oklch(0.155_0.016_285)]">
      <div className="pointer-events-none absolute inset-0 grid-field opacity-40" aria-hidden />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-primary/[0.07] to-transparent" aria-hidden />

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
          const radius = Math.min(4 + cluster.count * 1.6, 13)
          return (
            <Marker
              key={cluster.key}
              coordinates={cluster.coordinates}
              onMouseEnter={() => setActive(cluster.key)}
              onMouseLeave={() => setActive(null)}
            >
              <circle
                r={radius + 6}
                fill="oklch(0.72 0.15 292)"
                opacity={isActive ? 0.28 : 0.14}
                className="animate-wraith-pulse"
              />
              <circle r={radius} fill="oklch(0.72 0.15 292)" opacity={0.9} />
              <circle r={radius * 0.4} fill="oklch(0.98 0.01 285)" />
              {isActive && (
                <g transform={`translate(0, ${-radius - 12})`}>
                  <rect
                    x={-58}
                    y={-16}
                    width={116}
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
                    {cluster.label.slice(0, 22)} · {cluster.count}
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
            aguardando coordenadas de rede
          </p>
        </div>
      )}

      <div className="flex items-center justify-between border-t border-border px-3 py-2">
        <span className="font-mono text-[10px] tracking-[0.14em] text-muted-foreground uppercase">
          Origem de rede
        </span>
        <span className="font-mono text-[10px] text-muted-foreground">
          {clusters.length} {clusters.length === 1 ? 'ponto' : 'pontos'} ·{' '}
          {clusters.reduce((sum, c) => sum + c.count, 0)} acessos
        </span>
      </div>
    </div>
  )
}
