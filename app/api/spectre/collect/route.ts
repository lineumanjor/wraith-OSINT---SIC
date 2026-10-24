import { db } from '@/lib/db'
import { captures, links } from '@/lib/db/schema'
import { clientIp, lookupIp } from '@/lib/spectre/geo'
import type { ClientFingerprint } from '@/lib/spectre/types'
import { parseUserAgent } from '@/lib/spectre/ua'
import { eq } from 'drizzle-orm'
import type { NextRequest } from 'next/server'

export const dynamic = 'force-dynamic'

function str(value: unknown, max = 512): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  if (!trimmed) return null
  return trimmed.slice(0, max)
}

function num(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

export async function POST(request: NextRequest) {
  let body: (ClientFingerprint & { linkId?: string; sessionId?: string }) | null = null
  try {
    body = await request.json()
  } catch {
    return Response.json({ ok: false, error: 'invalid_body' }, { status: 400 })
  }

  const linkId = str(body?.linkId, 64)
  if (!linkId) return Response.json({ ok: false, error: 'missing_link' }, { status: 400 })

  const [link] = await db.select().from(links).where(eq(links.id, linkId)).limit(1)
  if (!link) return Response.json({ ok: false, error: 'unknown_link' }, { status: 404 })

  const userAgent = request.headers.get('user-agent') ?? ''
  const parsed = parseUserAgent(userAgent)
  const ip = clientIp(request.headers)
  const geo = await lookupIp(ip)

  const referrer = request.headers.get('referer')
  const referrerId = str(body?.referrerId, 256) ?? str(request.headers.get('x-referrer-id'), 256)

  try {
    await db.insert(captures).values({
      linkId,
      sessionId: str(body?.sessionId, 64),
      ip: geo.ip,
      asn: geo.asn,
      asOrg: geo.asOrg,
      country: geo.country,
      countryCode: geo.countryCode,
      region: geo.region,
      city: geo.city,
      latitude: geo.latitude,
      longitude: geo.longitude,
      userAgent: userAgent.slice(0, 1024) || null,
      referrer: referrer ? referrer.slice(0, 1024) : null,
      referrerId,
      platform: parsed.platform,
      os: parsed.os,
      osVersion: parsed.osVersion || null,
      browser: parsed.browser,
      browserVersion: parsed.browserVersion || null,
      engine: parsed.engine,
      deviceType: parsed.deviceType,
      deviceModel: parsed.deviceModel || null,
      vendor: parsed.vendor || null,
      screen: str(body?.screen, 32),
      viewport: str(body?.viewport, 32),
      pixelRatio: num(body?.pixelRatio),
      colorDepth: num(body?.colorDepth),
      hardwareConcurrency: num(body?.hardwareConcurrency),
      deviceMemory: num(body?.deviceMemory),
      timezone: str(body?.timezone, 64),
      languages: str(body?.languages, 128),
      touchPoints: num(body?.touchPoints),
      gpu: str(body?.gpu, 256),
      connection: str(body?.connection, 64),
      isBot: parsed.isBot,
    })
  } catch (error) {
    console.log('[v0] spectre collect failed:', error)
    return Response.json({ ok: false, error: 'persist_failed' }, { status: 500 })
  }

  return Response.json({ ok: true, destination: link.destination })
}
