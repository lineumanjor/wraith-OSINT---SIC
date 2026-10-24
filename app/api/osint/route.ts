import { isDnsType, isIpAddress, lookupAddress, resolveDns } from '@/lib/osint/network'
import { enumerateUsername, PLATFORMS } from '@/lib/osint/sherlock'

export const runtime = 'nodejs'
export const maxDuration = 60

type Body = {
  action?: string
  target?: string
  type?: string
}

const USERNAME_RE = /^[a-zA-Z0-9._-]{2,39}$/

function line(payload: unknown): string {
  return `${JSON.stringify(payload)}\n`
}

export async function POST(request: Request) {
  let body: Body
  try {
    body = (await request.json()) as Body
  } catch {
    return Response.json({ error: 'corpo inválido' }, { status: 400 })
  }

  const action = body.action
  const target = (body.target ?? '').trim()

  if (action === 'sherlock') {
    if (!USERNAME_RE.test(target)) {
      return Response.json(
        { error: 'nome de utilizador inválido — use 2 a 39 caracteres alfanuméricos, ponto, hífen ou underscore' },
        { status: 400 },
      )
    }

    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        const send = (payload: unknown) => controller.enqueue(encoder.encode(line(payload)))
        send({ type: 'meta', total: PLATFORMS.length, username: target })

        let found = 0
        let checked = 0

        try {
          for await (const result of enumerateUsername(target)) {
            checked += 1
            if (result.status === 'found') found += 1
            send({ type: 'result', checked, found, result })
          }
          send({ type: 'done', checked, found })
        } catch (error) {
          send({ type: 'error', message: error instanceof Error ? error.message : 'falha na varredura' })
        } finally {
          controller.close()
        }
      },
    })

    return new Response(stream, {
      headers: {
        'content-type': 'application/x-ndjson; charset=utf-8',
        'cache-control': 'no-store',
        'x-accel-buffering': 'no',
      },
    })
  }

  if (action === 'dns') {
    const type = (body.type ?? 'A').toUpperCase()
    if (!isDnsType(type)) {
      return Response.json({ error: `tipo de registo inválido: ${type}` }, { status: 400 })
    }
    if (!/^[a-z0-9.-]+\.[a-z]{2,}$/i.test(target)) {
      return Response.json({ error: 'domínio inválido' }, { status: 400 })
    }
    try {
      const result = await resolveDns(target, type)
      return Response.json({ ok: true, result })
    } catch (error) {
      return Response.json(
        { error: error instanceof Error ? error.message : 'falha na consulta DNS' },
        { status: 502 },
      )
    }
  }

  if (action === 'ip') {
    if (!isIpAddress(target)) {
      return Response.json({ error: 'endereço IP inválido' }, { status: 400 })
    }
    try {
      const result = await lookupAddress(target)
      return Response.json({ ok: true, result })
    } catch (error) {
      return Response.json(
        { error: error instanceof Error ? error.message : 'falha na consulta' },
        { status: 502 },
      )
    }
  }

  return Response.json({ error: 'ação desconhecida' }, { status: 400 })
}
