import { db } from '@/lib/db'
import { captures } from '@/lib/db/schema'
import { clientIp, lookupIp } from '@/lib/spectre/geo'
import type { ClientFingerprint } from '@/lib/spectre/types'
import { parseUserAgent } from '@/lib/spectre/ua'
import { eq } from 'drizzle-orm'

function str(value: unknown, max = 512): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  if (!trimmed) return null
  return trimmed.slice(0, max)
}

function num(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

function unquote(value: string | null): string | null {
  if (!value) return null
  const cleaned = value.replace(/^"|"$/g, '').trim()
  return cleaned && cleaned !== '?' ? cleaned : null
}

type CaptureInput = {
  linkId: string
  headers: Headers
  fingerprint?: ClientFingerprint | null
  sessionId?: string | null
  referrerId?: string | null
}

/**
 * Grava a telemetria disponível nos cabeçalhos HTTP. É síncrono e local, para
 * que o redirecionamento não espere por serviços externos.
 */
export async function recordCapture({
  linkId,
  headers,
  fingerprint,
  sessionId,
  referrerId,
}: CaptureInput): Promise<number | null> {
  const userAgent = headers.get('user-agent') ?? ''
  const parsed = parseUserAgent(userAgent)
  const ip = clientIp(headers)
  const referrer = headers.get('referer')

  const hintPlatform = unquote(headers.get('sec-ch-ua-platform'))
  const hintModel = unquote(headers.get('sec-ch-ua-model'))
  const hintMobile = headers.get('sec-ch-ua-mobile')
  const acceptLanguage = headers.get('accept-language')

  const [row] = await db
    .insert(captures)
    .values({
      linkId,
      sessionId: str(sessionId, 64),
      ip,
      userAgent: userAgent.slice(0, 1024) || null,
      referrer: referrer ? referrer.slice(0, 1024) : null,
      referrerId: str(referrerId, 256),
      platform: hintPlatform ?? parsed.platform,
      os: parsed.os,
      osVersion: parsed.osVersion || null,
      browser: parsed.browser,
      browserVersion: parsed.browserVersion || null,
      engine: parsed.engine,
      deviceType: hintMobile === '?1' ? 'mobile' : parsed.deviceType,
      deviceModel: hintModel ?? parsed.deviceModel ?? null,
      vendor: parsed.vendor || null,
      screen: str(fingerprint?.screen, 32),
      viewport: str(fingerprint?.viewport, 32),
      pixelRatio: num(fingerprint?.pixelRatio),
      colorDepth: num(fingerprint?.colorDepth),
      hardwareConcurrency: num(fingerprint?.hardwareConcurrency),
      deviceMemory: num(fingerprint?.deviceMemory),
      timezone: str(fingerprint?.timezone, 64),
      languages: str(fingerprint?.languages ?? acceptLanguage, 128),
      touchPoints: num(fingerprint?.touchPoints),
      gpu: str(fingerprint?.gpu, 256),
      connection: str(fingerprint?.connection, 64),
      isBot: parsed.isBot,
    })
    .returning({ id: captures.id })

  return row?.id ?? null
}

/**
 * Completa a geolocalização depois de a resposta já ter sido enviada, para não
 * atrasar o salto para o destino.
 */
export async function enrichCaptureGeo(captureId: number, ip: string | null) {
  const geo = await lookupIp(ip)

  await db
    .update(captures)
    .set({
      asn: geo.asn,
      asOrg: geo.asOrg,
      operator: geo.operator,
      country: geo.country,
      countryCode: geo.countryCode,
      region: geo.region,
      city: geo.city,
      latitude: geo.latitude,
      longitude: geo.longitude,
    })
    .where(eq(captures.id, captureId))
}
