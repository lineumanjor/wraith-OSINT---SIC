export const LOCATION_SOURCES = ['gps', 'ip', 'unavailable'] as const
export type LocationSource = (typeof LOCATION_SOURCES)[number]

export const LOCATION_LABEL: Record<LocationSource, string> = {
  gps: 'Localização precisa',
  ip: 'Localização aproximada',
  unavailable: 'Localização Indisponível',
}

export const LOCATION_DETAIL: Record<LocationSource, string> = {
  gps: 'Coordenadas fornecidas pelo navegador com consentimento do participante.',
  ip: 'O navegador recusou a geolocalização. A região foi estimada a partir do endereço IP.',
  unavailable: 'Nem o navegador nem o endereço IP permitiram estimar uma região.',
}

export const LOCATION_TONE: Record<LocationSource, 'ok' | 'warn' | 'off'> = {
  gps: 'ok',
  ip: 'warn',
  unavailable: 'off',
}

export type SandboxSession = {
  id: string
  label: string | null
  createdAt: string
  locationSource: LocationSource
  latitude: number | null
  longitude: number | null
  accuracy: number | null
  city: string | null
  region: string | null
  country: string | null
  countryCode: string | null
  ip: string | null
  asn: string | null
  asOrg: string | null
  timezone: string | null
  platform: string | null
  browser: string | null
  os: string | null
  deviceType: string | null
  screen: string | null
  languages: string | null
}

export function isLocationSource(value: unknown): value is LocationSource {
  return typeof value === 'string' && (LOCATION_SOURCES as readonly string[]).includes(value)
}

export function mapsEmbedUrl(latitude: number, longitude: number, zoom = 12): string {
  const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
  if (key) {
    const params = new URLSearchParams({
      key,
      center: `${latitude},${longitude}`,
      zoom: String(zoom),
      maptype: 'roadmap',
      language: 'pt-PT',
    })
    return `https://www.google.com/maps/embed/v1/place?${params.toString()}`
  }
  const params = new URLSearchParams({
    q: `${latitude},${longitude}`,
    z: String(zoom),
    hl: 'pt-PT',
    output: 'embed',
  })
  return `https://maps.google.com/maps?${params.toString()}`
}

export function mapsLink(latitude: number, longitude: number): string {
  return `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`
}
