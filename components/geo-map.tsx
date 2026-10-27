'use client'

import { cn } from '@/lib/utils'
import { ExternalLink, Layers, MapPin } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'

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

function embedSource([lng, lat]: [number, number]) {
  return `https://maps.google.com/maps?q=${lat},${lng}&z=13&hl=pt-PT&output=embed`
}

const MAP_MODES = [
  { value: 'roadmap', label: 'Mapa' },
  { value: 'satellite', label: 'Satélite' },
  { value: 'hybrid', label: 'Híbrido' },
  { value: 'terrain', label: 'Terreno' },
] as const

type GoogleMapInstance = {
  setCenter: (center: { lat: number; lng: number }) => void
  setZoom: (zoom: number) => void
  setMapTypeId: (type: string) => void
  fitBounds: (bounds: unknown, padding?: number) => void
}

type GoogleMarker = { setMap: (map: GoogleMapInstance | null) => void }

declare global {
  interface Window {
    google?: {
      maps: {
        Map: new (element: HTMLElement, options: Record<string, unknown>) => GoogleMapInstance
        Marker: new (options: Record<string, unknown>) => GoogleMarker
        LatLngBounds: new () => { extend: (point: { lat: number; lng: number }) => void }
      }
    }
  }
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
  const valid = useMemo(
    () =>
      points.filter(
        (point) => Number.isFinite(point.coordinates[0]) && Number.isFinite(point.coordinates[1]),
      ),
    [points],
  )

  const [activeId, setActiveId] = useState<string | null>(null)
  const [mapMode, setMapMode] = useState<(typeof MAP_MODES)[number]['value']>('roadmap')
  const [mapReady, setMapReady] = useState(false)
  const active = valid.find((point) => point.id === activeId) ?? valid[0] ?? null
  const mapElement = useRef<HTMLDivElement>(null)
  const mapInstance = useRef<GoogleMapInstance | null>(null)
  const markers = useRef<GoogleMarker[]>([])
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

  useEffect(() => {
    if (!apiKey || valid.length === 0 || !mapElement.current) return

    const initialize = () => {
      if (!window.google?.maps || !mapElement.current) return
      const center = valid[0].coordinates
      mapInstance.current = new window.google.maps.Map(mapElement.current, {
        center: { lat: center[1], lng: center[0] },
        zoom: valid.length === 1 ? 13 : 4,
        mapTypeId: mapMode,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: true,
        clickableIcons: false,
      })
      setMapReady(true)
    }

    if (window.google?.maps) {
      initialize()
      return
    }

    const existing = document.querySelector<HTMLScriptElement>('script[data-google-maps]')
    if (existing) {
      existing.addEventListener('load', initialize, { once: true })
      return () => existing.removeEventListener('load', initialize)
    }

    const script = document.createElement('script')
    script.dataset.googleMaps = 'true'
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}`
    script.async = true
    script.defer = true
    script.addEventListener('load', initialize, { once: true })
    document.head.appendChild(script)
    return () => script.removeEventListener('load', initialize)
  }, [apiKey, valid])

  useEffect(() => {
    const map = mapInstance.current
    if (!map || valid.length === 0 || !window.google?.maps) return
    map.setMapTypeId(mapMode)
    markers.current.forEach((marker) => marker.setMap(null))
    markers.current = valid.map((point) =>
      new window.google!.maps.Marker({
        map,
        position: { lat: point.coordinates[1], lng: point.coordinates[0] },
        title: point.label,
      }),
    )
    const activePoint = active ?? valid[0]
    map.setCenter({ lat: activePoint.coordinates[1], lng: activePoint.coordinates[0] })
    map.setZoom(valid.length === 1 ? 13 : 4)
    return () => markers.current.forEach((marker) => marker.setMap(null))
  }, [active, mapMode, valid])

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
          {active && apiKey ? (
            <>
              <div ref={mapElement} className="absolute inset-0" aria-label="Mapa real das capturas" />
              {!mapReady && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/60">
                  <p className="rounded-md border border-border bg-background/90 px-3 py-1.5 font-mono text-[11px] text-muted-foreground">
                    a carregar Google Maps…
                  </p>
                </div>
              )}
            </>
          ) : active ? (
            <iframe
              key={active.id}
              title={`Mapa de ${active.label}`}
              src={embedSource(active.coordinates)}
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
