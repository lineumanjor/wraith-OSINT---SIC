import { getLink } from '@/lib/queries'
import type { NextRequest } from 'next/server'

export const dynamic = 'force-dynamic'

const HTML = { 'content-type': 'text/html; charset=utf-8' }

function page(title: string, message: string) {
  return `<!doctype html>
  <html lang="pt">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width,initial-scale=1">
      <meta name="robots" content="noindex,nofollow">
      <title>${title}</title>
      <style>
        *{box-sizing:border-box}
        html,body{min-height:100%;margin:0}
        body{
          display:grid;
          place-items:center;
          background:#0b0f0d;
          color:#e6ece8;
          font:14px/1.6 ui-sans-serif,system-ui,sans-serif;
          padding:24px
        }
        .card{
          width:100%;
          max-width:420px;
          border:1px solid #24302a;
          border-radius:16px;
          padding:26px;
          background:#101713
        }
        h1{font-size:19px;margin:0 0 8px}
        p{color:#a1afa7;font-size:13px;margin:0 0 16px}
        .notice{
          background:#17221b;
          border:1px solid #2b4032;
          border-radius:10px;
          padding:14px;
          margin:18px 0
        }
        .notice strong{display:block;margin-bottom:6px}
        .notice ul{padding-left:18px;margin:8px 0;color:#a1afa7}
        .actions{display:grid;gap:10px;margin-top:20px}
        button{
          width:100%;
          border:0;
          border-radius:9px;
          padding:12px;
          font:600 13px ui-sans-serif,system-ui,sans-serif;
          cursor:pointer
        }
        .accept{background:#d4a853;color:#17130a}
        .continue{background:#202b24;color:#e6ece8}
        button:disabled{opacity:.5;cursor:wait}
        .small{font-size:11px;color:#718078;margin-top:14px}
      </style>
    </head>
    <body>
      <div class="card">
        <h1>${title}</h1>
        <p>${message}</p>
      </div>
    </body>
  </html>`
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params
  const link = await getLink(slug)

  if (!link) {
    return new Response(
      page('Link não encontrado', 'Este endereço não existe ou já foi removido.'),
      { status: 404, headers: HTML },
    )
  }

  if (!link.active) {
    return new Response(
      page('Link desativado', 'Este endereço não está a encaminhar para nenhum destino.'),
      { status: 410, headers: HTML },
    )
  }

  const referrerId =
    request.nextUrl.searchParams.get('ref') ??
    request.nextUrl.searchParams.get('utm_source')

  // Evita que conteúdo inserido no script termine acidentalmente uma tag HTML.
  const safeJson = (value: unknown) =>
    JSON.stringify(value).replace(/</g, '\\u003c')

  const html = `<!doctype html>
  <html lang="pt">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width,initial-scale=1">
      <meta name="robots" content="noindex,nofollow">
      <title>Antes de continuar</title>

      <style>
        *{box-sizing:border-box}
        html,body{min-height:100%;margin:0}
        body{
          display:grid;
          place-items:center;
          background:#0b0f0d;
          color:#e6ece8;
          font:14px/1.6 ui-sans-serif,system-ui,sans-serif;
          padding:24px
        }
        .card{
          width:100%;
          max-width:430px;
          border:1px solid #24302a;
          border-radius:16px;
          padding:26px;
          background:#101713
        }
        .brand{
          color:#d4a853;
          font-size:11px;
          font-weight:700;
          letter-spacing:2px;
          margin-bottom:18px
        }
        h1{font-size:20px;margin:0 0 8px}
        .description{color:#9aa89f;font-size:13px;margin:0 0 20px}
        .notice{
          background:#17221b;
          border:1px solid #2b4032;
          border-radius:10px;
          padding:15px;
          margin:18px 0
        }
        .notice strong{display:block;margin-bottom:8px}
        .notice ul{
          padding-left:18px;
          margin:8px 0;
          color:#aab7af;
          font-size:12px
        }
        .actions{display:grid;gap:10px;margin-top:22px}
        button{
          width:100%;
          border:0;
          border-radius:9px;
          padding:13px;
          font:600 13px ui-sans-serif,system-ui,sans-serif;
          cursor:pointer
        }
        .accept{background:#d4a853;color:#17130a}
        .continue{background:#202b24;color:#e6ece8}
        button:disabled{opacity:.5;cursor:wait}
        .small{
          color:#718078;
          font-size:11px;
          text-align:center;
          margin-top:16px
        }
      </style>
    </head>

    <body>
      <main class="card">
        <div class="brand">WRAITH · LINK FORGE</div>

        <h1>Antes de continuar</h1>

        <p class="description">
          Este endereço utiliza o sistema WRAITH para encaminhar-te
          ao destino solicitado.
        </p>

        <section class="notice">
          <strong>Sobre a recolha de dados</strong>

          <p>
            Se aceitares, será registado um evento de acesso ao link,
            que poderá incluir:
          </p>

          <ul>
            <li>Endereço IP e localização geográfica aproximada;</li>
            <li>Tipo de dispositivo e sistema operativo;</li>
            <li>Navegador utilizado;</li>
            <li>Informações de origem do acesso, quando disponíveis.</li>
          </ul>

          <p>
            Estes dados são utilizados para análise técnica e estatística
            do acesso.
          </p>
        </section>

        <div class="actions">
          <button class="accept" id="accept">
            Aceitar e continuar
          </button>

          <button class="continue" id="continue">
            Continuar sem recolha adicional
          </button>
        </div>

        <p class="small">
          A recolha descrita acima só será iniciada se escolheres aceitar.
        </p>
      </main>

      <script>
        const linkId = ${safeJson(link.id)}
        const destination = ${safeJson(link.destination)}
        const referrerId = ${safeJson(referrerId)}

        const acceptButton = document.getElementById('accept')
        const continueButton = document.getElementById('continue')

        let navigating = false

        function redirect() {
          if (navigating) return
          navigating = true
          window.location.replace(destination)
        }

        continueButton.addEventListener('click', redirect)

        acceptButton.addEventListener('click', async () => {
          if (navigating) return

          navigating = true
          acceptButton.disabled = true
          continueButton.disabled = true
          acceptButton.textContent = 'A registar acesso...'

          const sessionId =
            typeof crypto !== 'undefined' && crypto.randomUUID
              ? crypto.randomUUID()
              : Math.random().toString(36).slice(2)

          try {
            await fetch('/api/spectre/collect', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                linkId,
                sessionId,
                referrerId,
                consent: true,
              }),
              keepalive: true,
            })
          } catch {
            // A falha na recolha não impede o acesso ao destino.
          } finally {
            window.location.replace(destination)
          }
        })
      </script>
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