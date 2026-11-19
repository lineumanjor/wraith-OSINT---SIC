import { db } from '@/lib/db'
import { domains, investigations, links } from '@/lib/db/schema'
import { getLinks } from '@/lib/queries'
import type { PreviewStyle, RedirectMode } from '@/lib/spectre/types'
import { eq } from 'drizzle-orm'

export const dynamic = 'force-dynamic'

const STYLES: PreviewStyle[] = ['messaging', 'cloud', 'marketplace']
const MODES: RedirectMode[] = ['preview', 'direct']
const ALPHABET = 'abcdefghijkmnpqrstuvwxyz23456789'

const RESERVED_SLUGS = new Set([
  'api',
  'l',
  'cases',
  'forge',
  'preview',
  'engine',
  'terminal',
  'sandbox',
  'domains',
  'settings',
  'admin',
  'login',
  '_next',
  'favicon.ico',
  'robots.txt',
  'sitemap.xml',
])

function parseSlug(value: unknown): { slug: string | null; error?: string } {
  if (value === undefined || value === null || value === '') return { slug: null }
  if (typeof value !== 'string') return { slug: null, error: 'invalid_slug' }

  const slug = value.trim().toLowerCase()
  if (!/^[a-z0-9][a-z0-9-]{1,62}$/.test(slug)) return { slug: null, error: 'invalid_slug' }
  if (RESERVED_SLUGS.has(slug)) return { slug: null, error: 'reserved_slug' }

  return { slug }
}

function makeSlug(length = 8) {
  let out = ''
  for (let i = 0; i < length; i += 1) {
    out += ALPHABET[Math.floor(Math.random() * ALPHABET.length)]
  }
  return out
}

function clean(value: unknown, max: number): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed ? trimmed.slice(0, max) : null
}

export async function GET() {
  return Response.json(
    { links: await getLinks() },
    { headers: { 'Cache-Control': 'no-store' } },
  )
}

export async function POST(request: Request) {
  let body: Record<string, unknown>

  try {
    body = (await request.json()) as Record<string, unknown>
  } catch {
    return Response.json({ ok: false, error: 'invalid_body' }, { status: 400 })
  }

  const label = clean(body.label, 120)
  const destination = clean(body.destination, 2048)
  const style = STYLES.includes(body.previewStyle as PreviewStyle)
    ? (body.previewStyle as PreviewStyle)
    : 'messaging'
  const mode = MODES.includes(body.redirectMode as RedirectMode)
    ? (body.redirectMode as RedirectMode)
    : 'direct'

  const { slug, error: slugError } = parseSlug(body.slug)
  const requestedHost = clean(body.host, 253)?.toLowerCase() ?? null
  const investigationId = clean(body.investigationId, 100)

  if (slugError) {
    return Response.json({ ok: false, error: slugError }, { status: 400 })
  }

  // Validar investigação associada
  if (investigationId) {
    const [investigation] = await db
      .select({ id: investigations.id })
      .from(investigations)
      .where(eq(investigations.id, investigationId))
      .limit(1)

    if (!investigation) {
      return Response.json(
        { ok: false, error: 'investigation_not_found' },
        { status: 404 },
      )
    }
  }

  // Validar domínio
  if (requestedHost) {
    const [known] = await db
      .select({ id: domains.id })
      .from(domains)
      .where(eq(domains.hostname, requestedHost))
      .limit(1)

    if (!known) {
      return Response.json({ ok: false, error: 'unknown_host' }, { status: 400 })
    }
  }

  if (!label || !destination) {
    return Response.json({ ok: false, error: 'missing_fields' }, { status: 400 })
  }

  // Validar destino
  let normalized: URL

  try {
    normalized = new URL(destination)
  } catch {
    return Response.json({ ok: false, error: 'invalid_destination' }, { status: 400 })
  }

  if (!['http:', 'https:'].includes(normalized.protocol)) {
    return Response.json({ ok: false, error: 'invalid_protocol' }, { status: 400 })
  }

  // Verificar alias
  if (slug) {
    const [taken] = await db
      .select({ id: links.id })
      .from(links)
      .where(eq(links.slug, slug))
      .limit(1)

    if (taken) {
      return Response.json({ ok: false, error: 'slug_taken' }, { status: 409 })
    }
  }

  const id = makeSlug()

  const [created] = await db
    .insert(links)
    .values({
      id,
      label,
      destination: normalized.toString(),
      slug,
      host: requestedHost,
      investigationId,
      redirectMode: mode,
      previewStyle: style,
      previewTitle: clean(body.previewTitle, 160),
      previewDescription: clean(body.previewDescription, 320),
      previewSource: clean(body.previewSource, 120),
    })
    .returning()

  return Response.json({ ok: true, link: created }, { status: 201 })
}

export async function PATCH(request: Request) {
  let body: { id?: string; active?: boolean }

  try {
    body = (await request.json()) as { id?: string; active?: boolean }
  } catch {
    return Response.json({ ok: false, error: 'invalid_body' }, { status: 400 })
  }

  if (!body.id || typeof body.active !== 'boolean') {
    return Response.json({ ok: false, error: 'missing_fields' }, { status: 400 })
  }

  await db
    .update(links)
    .set({ active: body.active })
    .where(eq(links.id, body.id))

  return Response.json({ ok: true })
}