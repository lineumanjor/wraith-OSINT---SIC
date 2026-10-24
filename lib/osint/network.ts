export type DnsAnswer = {
  type: string
  ttl: number
  data: string
}

export type DnsResult = {
  name: string
  type: string
  answers: DnsAnswer[]
  status: number
}

const DNS_TYPES = ['A', 'AAAA', 'MX', 'TXT', 'NS', 'CNAME', 'SOA'] as const
export type DnsType = (typeof DNS_TYPES)[number]

export function isDnsType(value: string): value is DnsType {
  return (DNS_TYPES as readonly string[]).includes(value.toUpperCase())
}

export async function resolveDns(name: string, type: DnsType = 'A'): Promise<DnsResult> {
  const url = `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(name)}&type=${type}`
  const res = await fetch(url, {
    headers: { accept: 'application/dns-json' },
    cache: 'no-store',
    signal: AbortSignal.timeout(6000),
  })

  if (!res.ok) throw new Error(`resolvedor respondeu ${res.status}`)

  const data = (await res.json()) as {
    Status?: number
    Answer?: { name: string; type: number; TTL: number; data: string }[]
  }

  const typeNames: Record<number, string> = {
    1: 'A',
    2: 'NS',
    5: 'CNAME',
    6: 'SOA',
    15: 'MX',
    16: 'TXT',
    28: 'AAAA',
  }

  return {
    name,
    type,
    status: data.Status ?? 0,
    answers: (data.Answer ?? []).map((a) => ({
      type: typeNames[a.type] ?? String(a.type),
      ttl: a.TTL,
      data: a.data,
    })),
  }
}

export type IpResult = {
  ip: string
  asn: string | null
  org: string | null
  country: string | null
  countryCode: string | null
  region: string | null
  city: string | null
  latitude: number | null
  longitude: number | null
  timezone: string | null
}

export async function lookupAddress(ip: string): Promise<IpResult> {
  const res = await fetch(`https://ipwho.is/${encodeURIComponent(ip)}`, {
    cache: 'no-store',
    signal: AbortSignal.timeout(6000),
  })
  if (!res.ok) throw new Error(`serviço de geolocalização respondeu ${res.status}`)

  const data = (await res.json()) as {
    success?: boolean
    message?: string
    country?: string
    country_code?: string
    region?: string
    city?: string
    latitude?: number
    longitude?: number
    timezone?: { id?: string }
    connection?: { asn?: number; org?: string; isp?: string }
  }

  if (!data.success) throw new Error(data.message ?? 'endereço não resolvido')

  return {
    ip,
    asn: data.connection?.asn ? `AS${data.connection.asn}` : null,
    org: data.connection?.org ?? data.connection?.isp ?? null,
    country: data.country ?? null,
    countryCode: data.country_code ?? null,
    region: data.region ?? null,
    city: data.city ?? null,
    latitude: typeof data.latitude === 'number' ? data.latitude : null,
    longitude: typeof data.longitude === 'number' ? data.longitude : null,
    timezone: data.timezone?.id ?? null,
  }
}

export function isIpAddress(value: string): boolean {
  return /^(\d{1,3}\.){3}\d{1,3}$/.test(value) || /^[0-9a-f:]+$/i.test(value) && value.includes(':')
}
