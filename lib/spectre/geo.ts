import { isIP } from 'node:net'

export type GeoInfo = {
  ip: string | null
  asn: string | null
  asOrg: string | null
  operator: string | null
  country: string | null
  countryCode: string | null
  region: string | null
  city: string | null
  latitude: number | null
  longitude: number | null
}

const EMPTY: Omit<GeoInfo, 'ip'> = {
  asn: null,
  asOrg: null,
  operator: null,
  country: null,
  countryCode: null,
  region: null,
  city: null,
  latitude: null,
  longitude: null,
}

function isPrivateIPv4(ip: string): boolean {
  const parts = ip.split('.').map(Number)

  if (
    parts.length !== 4 ||
    parts.some((part) => !Number.isInteger(part) || part < 0 || part > 255)
  ) {
    return true
  }

  const [a, b] = parts

  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 198 && (b === 18 || b === 19)) ||
    a >= 224
  )
}

function isPrivateIPv6(ip: string): boolean {
  const normalized = ip.toLowerCase().split('%')[0]

  if (
    normalized === '::' ||
    normalized === '::1' ||
    normalized.startsWith('fc') ||
    normalized.startsWith('fd') ||
    /^fe[89ab]/.test(normalized) ||
    normalized.startsWith('ff')
  ) {
    return true
  }

  // IPv4 mapeado em IPv6, por exemplo ::ffff:192.168.1.1
  if (normalized.startsWith('::ffff:')) {
    const mapped = normalized.slice(7)

    if (isIP(mapped) === 4) {
      return isPrivateIPv4(mapped)
    }

    // Também contempla a representação hexadecimal.
    const hex = mapped.split(':')

    if (hex.length === 2) {
      const first = Number.parseInt(hex[0], 16)
      const second = Number.parseInt(hex[1], 16)

      if (Number.isFinite(first) && Number.isFinite(second)) {
        const ipv4 = [
          first >> 8,
          first & 255,
          second >> 8,
          second & 255,
        ].join('.')

        return isPrivateIPv4(ipv4)
      }
    }

    return true
  }

  return false
}

export function isPrivateIp(ip: string): boolean {
  const value = ip.trim()

  if (!value || value === 'localhost') return true

  const version = isIP(value)

  if (version === 4) return isPrivateIPv4(value)
  if (version === 6) return isPrivateIPv6(value)

  // Endereço inválido ou não reconhecido.
  return true
}

function validIp(value: string | null): string | null {
  if (!value) return null

  const ip = value.trim()

  if (isIP(ip) === 0) return null

  return ip
}

export function clientIp(headers: Headers): string | null {
  /*
   * Preferimos cabeçalhos normalmente definidos pela infraestrutura
   * de hospedagem, antes de recorrer ao X-Forwarded-For.
   *
   * A confiança nestes cabeçalhos depende da configuração do proxy.
   */

  const candidates = [
    headers.get('x-vercel-forwarded-for'),
    headers.get('cf-connecting-ip'),
    headers.get('x-real-ip'),
    headers.get('x-forwarded-for')?.split(',')[0]?.trim(),
  ]

  for (const candidate of candidates) {
    const ip = validIp(candidate)

    if (ip) return ip
  }

  return null
}

function safeText(value: unknown, max = 150): string | null {
  if (typeof value !== 'string') return null

  const result = value.trim().slice(0, max)

  return result || null
}

export async function lookupIp(ip: string | null): Promise<GeoInfo> {
  const valid = validIp(ip)

  if (!valid) {
    return { ip: null, ...EMPTY }
  }

  if (isPrivateIp(valid)) {
    return { ip: valid, ...EMPTY }
  }

  try {
    const response = await fetch(
      `https://ipwho.is/${encodeURIComponent(valid)}`,
      {
        cache: 'no-store',
        signal: AbortSignal.timeout(4500),
      },
    )

    if (!response.ok) {
      return { ip: valid, ...EMPTY }
    }

    const data = (await response.json()) as {
      success?: boolean
      country?: string
      country_code?: string
      region?: string
      city?: string
      latitude?: number
      longitude?: number
      connection?: {
        asn?: number
        org?: string
        isp?: string
      }
    }

    if (data.success !== true) {
      return { ip: valid, ...EMPTY }
    }

    const latitude =
      typeof data.latitude === 'number' &&
      data.latitude >= -90 &&
      data.latitude <= 90
        ? data.latitude
        : null

    const longitude =
      typeof data.longitude === 'number' &&
      data.longitude >= -180 &&
      data.longitude <= 180
        ? data.longitude
        : null

    return {
      ip: valid,

      asn:
        typeof data.connection?.asn === 'number'
          ? `AS${data.connection.asn}`
          : null,

      asOrg: safeText(data.connection?.org),
      operator: safeText(data.connection?.isp ?? data.connection?.org),

      country: safeText(data.country),
      countryCode: safeText(data.country_code, 5),
      region: safeText(data.region),
      city: safeText(data.city),

      latitude,
      longitude,
    }
  } catch {
    return { ip: valid, ...EMPTY }
  }
}