import { db } from '@/lib/db'
import { domains } from '@/lib/db/schema'
import { getDomains } from '@/lib/queries'
import { eq } from 'drizzle-orm'
import { requireApiAuth } from '@/lib/api-auth'

export const dynamic = 'force-dynamic'

const HOSTNAME = /^(?!-)[a-z0-9-]{1,63}(?<!-)(\.(?!-)[a-z0-9-]{1,63}(?<!-))+$/

function makeId() {
  return `dom_${Math.random().toString(36).slice(2, 10)}`
}

export async function GET() {
  const denied = await requireApiAuth()
  if (denied) return denied
  return Response.json(
    { domains: await getDomains() },
    { headers: { 'Cache-Control': 'no-store' } },
  )
}

export async function POST(request: Request) {
  const denied = await requireApiAuth()
  if (denied) return denied
  let body: { hostname?: unknown }
  try {
    body = (await request.json()) as { hostname?: unknown }
  } catch {
    return Response.json({ ok: false, error: 'invalid_body' }, { status: 400 })
  }

  if (typeof body.hostname !== 'string') {
    return Response.json({ ok: false, error: 'invalid_hostname' }, { status: 400 })
  }

  const hostname = body.hostname
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/\/.*$/, '')

  if (!HOSTNAME.test(hostname) || hostname.length > 253) {
    return Response.json({ ok: false, error: 'invalid_hostname' }, { status: 400 })
  }

  const [taken] = await db
    .select({ id: domains.id })
    .from(domains)
    .where(eq(domains.hostname, hostname))
    .limit(1)

  if (taken) {
    return Response.json({ ok: false, error: 'hostname_taken' }, { status: 409 })
  }

  const [created] = await db
    .insert(domains)
    .values({ id: makeId(), hostname })
    .returning()

  return Response.json({ ok: true, domain: created }, { status: 201 })
}

export async function PATCH(request: Request) {
  const denied = await requireApiAuth()
  if (denied) return denied
  let body: { id?: unknown; verified?: unknown }
  try {
    body = (await request.json()) as { id?: unknown; verified?: unknown }
  } catch {
    return Response.json({ ok: false, error: 'invalid_body' }, { status: 400 })
  }

  if (typeof body.id !== 'string' || typeof body.verified !== 'boolean') {
    return Response.json({ ok: false, error: 'missing_fields' }, { status: 400 })
  }

  await db.update(domains).set({ verified: body.verified }).where(eq(domains.id, body.id))
  return Response.json({ ok: true })
}

export async function DELETE(request: Request) {
  const denied = await requireApiAuth()
  if (denied) return denied
  let body: { id?: unknown }
  try {
    body = (await request.json()) as { id?: unknown }
  } catch {
    return Response.json({ ok: false, error: 'invalid_body' }, { status: 400 })
  }

  if (typeof body.id !== 'string') {
    return Response.json({ ok: false, error: 'missing_id' }, { status: 400 })
  }

  await db.delete(domains).where(eq(domains.id, body.id))
  return Response.json({ ok: true })
}
