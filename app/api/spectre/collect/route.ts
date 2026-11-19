import { db } from '@/lib/db'
import { links } from '@/lib/db/schema'
import { enrichCaptureGeo, recordCapture } from '@/lib/spectre/capture-server'
import { clientIp } from '@/lib/spectre/geo'
import type { ClientFingerprint } from '@/lib/spectre/types'
import { eq } from 'drizzle-orm'
import { after } from 'next/server'
import type { NextRequest } from 'next/server'

export const dynamic = 'force-dynamic'

type CollectPayload = ClientFingerprint & {
  linkId?: string
  sessionId?: string
  referrerId?: string
  consent?: boolean
}

export async function POST(request: NextRequest) {
  let body: CollectPayload | null = null

  // 1. Validar o corpo da requisição
  try {
    const parsed = await request.json()

    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return Response.json(
        { ok: false, error: 'invalid_body' },
        { status: 400 },
      )
    }

    body = parsed as CollectPayload
  } catch {
    return Response.json(
      { ok: false, error: 'invalid_body' },
      { status: 400 },
    )
  }

  // 2. Exigir consentimento explícito
  if (body.consent !== true) {
    return Response.json(
      {
        ok: false,
        error: 'consent_required',
        message: 'É necessário aceitar a recolha antes de registar o acesso.',
      },
      { status: 403 },
    )
  }

  // 3. Validar o identificador do link
  const linkId =
    typeof body.linkId === 'string'
      ? body.linkId.trim().slice(0, 64)
      : ''

  if (!linkId) {
    return Response.json(
      { ok: false, error: 'missing_link' },
      { status: 400 },
    )
  }

  // 4. Confirmar que o link existe
  const [link] = await db
    .select()
    .from(links)
    .where(eq(links.id, linkId))
    .limit(1)

  if (!link) {
    return Response.json(
      { ok: false, error: 'unknown_link' },
      { status: 404 },
    )
  }

  // 5. Não recolher dados de links desativados
  if (!link.active) {
    return Response.json(
      { ok: false, error: 'link_inactive' },
      { status: 410 },
    )
  }

  // 6. Preparar os identificadores
  const sessionId =
    typeof body.sessionId === 'string'
      ? body.sessionId.slice(0, 128)
      : undefined

  const referrerId =
    typeof body.referrerId === 'string'
      ? body.referrerId.slice(0, 200)
      : request.headers.get('x-referrer-id')?.slice(0, 200)

  const ip = clientIp(request.headers)

  // 7. Registar o acesso autorizado
  try {
    const captureId = await recordCapture({
      linkId,
      headers: request.headers,
      fingerprint: body,
      sessionId,
      referrerId,
    })

    // 8. Enriquecimento geográfico após o registo
    if (captureId) {
      after(async () => {
        try {
          await enrichCaptureGeo(captureId, ip)
        } catch (error) {
          console.error('[WRAITH] Geo enrichment failed:', error)
        }
      })
    }
  } catch (error) {
    console.error('[WRAITH] Spectre collection failed:', error)

    return Response.json(
      { ok: false, error: 'persist_failed' },
      { status: 500 },
    )
  }

  return Response.json({
    ok: true,
    message: 'Acesso registado com consentimento.',
    destination: link.destination,
  })
}