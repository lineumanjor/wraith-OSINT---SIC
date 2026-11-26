import { createSession, listSessions } from '@/lib/sandbox/queries'
import type { LocationSource } from '@/lib/sandbox/types'
import { clientIp, lookupIp } from '@/lib/spectre/geo'
import { parseUserAgent } from '@/lib/spectre/ua'
import type { NextRequest } from 'next/server'

export const dynamic = 'force-dynamic'

function str(value: unknown, max = 256): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed ? trimmed.slice(0, max) : null
}

function coord(value: unknown, limit: number): number | null {
  if (typeof value !== 'number' || !Number.isFinite(value)) return null
  if (Math.abs(value) > limit) return null
  return value
}

function makeId(): string {
  const bytes = new Uint8Array(9)
  crypto.getRandomValues(bytes)
  return `sbx_${Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')}`
}

export async function GET() {
  const sessions = await listSessions()
  return Response.json({ sessions })
}

export async function POST(request: NextRequest) {
  let body: Record<string, unknown> | null = null
  try {
    body = (await request.json()) as Record<string, unknown>
  } catch {
    return Response.json({ ok: false, error: 'invalid_body' }, { status: 400 })
  }

  if (body?.consent !== true) {
    return Response.json({ ok: false, error: 'consent_required' }, { status: 403 })
  }

  const coords = (body.coords ?? null) as Record<string, unknown> | null
  const latitude = coord(coords?.latitude, 90)
  const longitude = coord(coords?.longitude, 180)
  const accuracy = coord(coords?.accuracy, 1_000_000)

  const userAgent = request.headers.get('user-agent') ?? ''
  const parsed = parseUserAgent(userAgent)
  const ip = clientIp(request.headers)

  let locationSource: LocationSource = 'unavailable'
  let resolved = { latitude: null as number | null, longitude: null as number | null }
  let geo: {
    city: string | null
    region: string | null
    country: string | null
    countryCode: string | null
    asn: string | null
    asOrg: string | null
  } = { city: null, region: null, country: null, countryCode: null, asn: null, asOrg: null }

  if (latitude !== null && longitude !== null) {
    locationSource = 'gps'
    resolved = { latitude, longitude }
  } else {
    const estimate = await lookupIp(ip)
    geo = {
      city: estimate.city,
      region: estimate.region,
      country: estimate.country,
      countryCode: estimate.countryCode,
      asn: estimate.asn,
      asOrg: estimate.asOrg,
    }
    if (estimate.latitude !== null && estimate.longitude !== null) {
      locationSource = 'ip'
      resolved = { latitude: estimate.latitude, longitude: estimate.longitude }
    }
  }

  let session
  try {
    session = await createSession({
    id: makeId(),
    label: str(body.label, 120),
    locationSource,
    latitude: resolved.latitude,
    longitude: resolved.longitude,
    accuracy: locationSource === 'gps' ? accuracy : null,
    city: geo.city,
    region: geo.region,
    country: geo.country,
    countryCode: geo.countryCode,
    ip,
    asn: geo.asn,
    asOrg: geo.asOrg,
    timezone: str(body.timezone, 64),
    platform: parsed.platform,
    browser: parsed.browser,
    os: parsed.os,
    deviceType: parsed.deviceType,
    screen: str(body.screen, 32),
    languages: str(body.languages, 120),
      userAgent: userAgent.slice(0, 1024) || null,
    })
  } catch (error) {
    console.error('sandbox insert failed:', error)
    return Response.json({ ok: false, error: 'insert_failed' }, { status: 500 })
  }

  return Response.json({ ok: true, session })
}
