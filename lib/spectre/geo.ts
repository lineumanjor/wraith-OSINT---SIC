export type GeoInfo = {
  ip: string | null
  asn: string | null
  asOrg: string | null
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
  country: null,
  countryCode: null,
  region: null,
  city: null,
  latitude: null,
  longitude: null,
}

export function isPrivateIp(ip: string): boolean {
  if (!ip) return true
  if (ip === '::1' || ip === '127.0.0.1' || ip === 'localhost') return true
  if (ip.startsWith('10.') || ip.startsWith('192.168.') || ip.startsWith('169.254.')) return true
  if (/^172\.(1[6-9]|2\d|3[01])\./.test(ip)) return true
  if (/^f[cd][0-9a-f]{2}:/i.test(ip)) return true
  if (/^fe80:/i.test(ip)) return true
  return false
}

export function clientIp(headers: Headers): string | null {
  const forwarded = headers.get('x-forwarded-for')
  if (forwarded) {
    const first = forwarded.split(',')[0]?.trim()
    if (first) return first
  }
  return (
    headers.get('x-real-ip') ??
    headers.get('cf-connecting-ip') ??
    headers.get('x-vercel-forwarded-for') ??
    null
  )
}

export async function lookupIp(ip: string | null): Promise<GeoInfo> {
  if (!ip) return { ip: null, ...EMPTY }
  if (isPrivateIp(ip)) return { ip, ...EMPTY }

  try {
    const res = await fetch(`https://ipwho.is/${encodeURIComponent(ip)}`, {
      cache: 'no-store',
      signal: AbortSignal.timeout(4500),
    })
    if (!res.ok) return { ip, ...EMPTY }

    const data = (await res.json()) as {
      success?: boolean
      country?: string
      country_code?: string
      region?: string
      city?: string
      latitude?: number
      longitude?: number
      connection?: { asn?: number; org?: string; isp?: string }
    }

    if (!data.success) return { ip, ...EMPTY }

    return {
      ip,
      asn: data.connection?.asn ? `AS${data.connection.asn}` : null,
      asOrg: data.connection?.org ?? data.connection?.isp ?? null,
      country: data.country ?? null,
      countryCode: data.country_code ?? null,
      region: data.region ?? null,
      city: data.city ?? null,
      latitude: typeof data.latitude === 'number' ? data.latitude : null,
      longitude: typeof data.longitude === 'number' ? data.longitude : null,
    }
  } catch {
    return { ip, ...EMPTY }
  }
}
