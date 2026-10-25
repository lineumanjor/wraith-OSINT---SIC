import { db } from '@/lib/db'
import { links } from '@/lib/db/schema'
import { enrichCaptureGeo, recordCapture } from '@/lib/spectre/capture-server'
import { clientIp } from '@/lib/spectre/geo'
import type { ClientFingerprint } from '@/lib/spectre/types'
import { eq } from 'drizzle-orm'
import { after } from 'next/server'
import type { NextRequest } from 'next/server'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  let body: (ClientFingerprint & { linkId?: string; sessionId?: string; referrerId?: string }) | null =
    null
  try {
    body = await request.json()
  } catch {
    return Response.json({ ok: false, error: 'invalid_body' }, { status: 400 })
  }

  const linkId = typeof body?.linkId === 'string' ? body.linkId.trim().slice(0, 64) : ''
  if (!linkId) return Response.json({ ok: false, error: 'missing_link' }, { status: 400 })

  const [link] = await db.select().from(links).where(eq(links.id, linkId)).limit(1)
  if (!link) return Response.json({ ok: false, error: 'unknown_link' }, { status: 404 })

  const ip = clientIp(request.headers)

  try {
    const captureId = await recordCapture({
      linkId,
      headers: request.headers,
      fingerprint: body,
      sessionId: body?.sessionId,
      referrerId: body?.referrerId ?? request.headers.get('x-referrer-id'),
    })

    if (captureId) {
      after(async () => {
        try {
          await enrichCaptureGeo(captureId, ip)
        } catch (error) {
          console.log('[v0] geo enrichment failed:', error)
        }
      })
    }
  } catch (error) {
    console.log('[v0] spectre collect failed:', error)
    return Response.json({ ok: false, error: 'persist_failed' }, { status: 500 })
  }

  return Response.json({ ok: true, destination: link.destination })
}
