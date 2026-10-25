import { getLink } from '@/lib/queries'
import { enrichCaptureGeo, recordCapture } from '@/lib/spectre/capture-server'
import { clientIp } from '@/lib/spectre/geo'
import { after } from 'next/server'
import type { NextRequest } from 'next/server'

export const dynamic = 'force-dynamic'

const HTML = { 'content-type': 'text/html; charset=utf-8' }

function page(title: string, message: string) {
  return `<!doctype html><html lang="pt"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>${title}</title><style>html,body{height:100%;margin:0}body{display:grid;place-items:center;background:#0b0f0d;color:#e6ece8;font:14px/1.6 ui-sans-serif,system-ui,sans-serif;padding:24px}.card{max-width:22rem;border:1px solid #24302a;border-radius:12px;padding:24px;text-align:center}h1{font-size:15px;margin:0 0 6px}p{margin:0;color:#8b9a92;font-size:13px}</style></head><body><div class="card"><h1>${title}</h1><p>${message}</p></div></body></html>`
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const link = await getLink(slug)

  if (!link) {
    return new Response(page('Link não encontrado', 'Este endereço não existe ou já foi removido.'), {
      status: 404,
      headers: HTML,
    })
  }

  if (!link.active) {
    return new Response(
      page('Link desativado', 'Este endereço não está a encaminhar para nenhum destino.'),
      { status: 410, headers: HTML },
    )
  }

  const ip = clientIp(request.headers)
  const referrerId =
    request.nextUrl.searchParams.get('ref') ?? request.nextUrl.searchParams.get('utm_source')

  let captureId: number | null = null
  try {
    captureId = await recordCapture({ linkId: link.id, headers: request.headers, referrerId })
  } catch (error) {
    console.log('[v0] redirect capture failed:', error)
  }

  if (captureId) {
    const id = captureId
    after(async () => {
      try {
        await enrichCaptureGeo(id, ip)
      } catch (error) {
        console.log('[v0] geo enrichment failed:', error)
      }
    })
  }

  return new Response(null, {
    status: 302,
    headers: {
      Location: link.destination,
      'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
      'Referrer-Policy': 'no-referrer',
      'X-Robots-Tag': 'noindex, nofollow',
    },
  })
}
