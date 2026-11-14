import { getLink } from '@/lib/queries'
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

  const referrerId =
    request.nextUrl.searchParams.get('ref') ?? request.nextUrl.searchParams.get('utm_source')

  const html = `<!doctype html>
  <html lang="pt">
    <head>
      <meta charset="utf-8" />
      <meta name="robots" content="noindex,nofollow" />
      <title>Redirecionando...</title>
      <style>
        html, body {
          margin: 0;
          height: 100%;
          background: #0b0f0d;
          color: #e6ece8;
          font: 14px/1.6 ui-sans-serif, system-ui, sans-serif;
        }
        body {
          display: grid;
          place-items: center;
        }
      </style>
      <script>
        const fingerprint = {
          screen: \`\${window.screen.width}x\${window.screen.height}\`,
          viewport: \`\${window.innerWidth}x\${window.innerHeight}\`,
          pixelRatio: window.devicePixelRatio,
          colorDepth: window.screen.colorDepth,
          hardwareConcurrency: navigator.hardwareConcurrency,
          deviceMemory: navigator.deviceMemory,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          languages: (navigator.languages ?? [navigator.language]).filter(Boolean).join(','),
          touchPoints: navigator.maxTouchPoints,
          gpu: (() => {
            try {
              const canvas = document.createElement('canvas')
              const gl =
                canvas.getContext('webgl') ||
                canvas.getContext('experimental-webgl')

              if (!gl) return undefined

              const ext = gl.getExtension('WEBGL_debug_renderer_info')
              if (!ext) return undefined

              const renderer = gl.getParameter(ext.UNMASKED_RENDERER_WEBGL)
              return typeof renderer === 'string' ? renderer.slice(0, 200) : undefined
            } catch {
              return undefined
            }
          })(),
          connection: (() => {
            const c = navigator.connection
            return c && c.effectiveType
              ? \`\${c.effectiveType}\${c.downlink ? ' · ' + c.downlink + 'Mb/s' : ''}\`
              : undefined
          })(),
          platform: navigator.userAgentData?.platform ?? undefined,
        }

        const payload = {
          linkId: ${JSON.stringify(link.id)},
          sessionId:
            typeof crypto !== 'undefined' && crypto.randomUUID
              ? crypto.randomUUID()
              : Math.random().toString(36).slice(2),
          referrerId: ${JSON.stringify(referrerId)},
          ...fingerprint,
        }

        fetch('/api/spectre/collect', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
          keepalive: true,
        })
          .catch(() => {})
          .finally(() => {
            window.location.replace(${JSON.stringify(link.destination)})
          })
      </script>
    </head>
    <body>
      <div>Redirecionando...</div>
    </body>
  </html>`

  return new Response(html, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
      'Referrer-Policy': 'no-referrer',
      'X-Robots-Tag': 'noindex, nofollow',
    },
  })
}