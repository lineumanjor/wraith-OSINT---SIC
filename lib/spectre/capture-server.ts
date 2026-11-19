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

type CaptureInput = {
  linkId: string
  headers: Headers

  // Mantido para compatibilidade com chamadas existentes.
  // Os dados de fingerprint não são guardados.
  fingerprint?: ClientFingerprint | null

  sessionId?: string | null
  referrerId?: string | null
}

/**
 * Regista apenas os dados necessários para análise básica do acesso.
 *
 * Não armazena resolução do ecrã, GPU, memória, hardware,
 * pixel ratio, touch points ou outras características de fingerprinting.
 */
export async function recordCapture({
  linkId,
  headers,
  sessionId,
  referrerId,
}: CaptureInput): Promise<number | null> {
  const userAgent = headers.get('user-agent') ?? ''
  const parsed = parseUserAgent(userAgent)

  // IP utilizado para geolocalização aproximada.
  const ip = clientIp(headers)

  // Origem do acesso, quando disponibilizada pelo navegador.
  const referrer = headers.get('referer')

  const [row] = await db
    .insert(captures)
    .values({
      linkId,

      sessionId: str(sessionId, 64),

      // Dados de rede
      ip,

      // Não guardar o User-Agent completo.
      userAgent: null,

      referrer: referrer ? referrer.slice(0, 1024) : null,
      referrerId: str(referrerId, 200),

      // Informações básicas do navegador e dispositivo.
      platform: str(parsed.platform, 100),
      os: str(parsed.os, 100),
      osVersion: str(parsed.osVersion, 50),
      browser: str(parsed.browser, 100),
      browserVersion: str(parsed.browserVersion, 50),
      engine: str(parsed.engine, 100),
      deviceType: str(parsed.deviceType, 50),

      // Características adicionais não recolhidas.
      deviceModel: null,
      vendor: null,
      screen: null,
      viewport: null,
      pixelRatio: null,
      colorDepth: null,
      hardwareConcurrency: null,
      deviceMemory: null,
      timezone: null,
      languages: null,
      touchPoints: null,
      gpu: null,
      connection: null,

      // Classificação técnica baseada no User-Agent.
      isBot: parsed.isBot,
    })
    .returning({ id: captures.id })

  return row?.id ?? null
}

/**
 * Enriquece o registo com localização geográfica aproximada
 * a partir do IP, depois da recolha autorizada.
 */
export async function enrichCaptureGeo(
  captureId: number,
  ip: string | null,
) {
  if (!ip) return

  const geo = await lookupIp(ip)

  if (!geo) return

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