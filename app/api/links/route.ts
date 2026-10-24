import { db } from '@/lib/db'
import { links } from '@/lib/db/schema'
import { getLinks } from '@/lib/queries'
import type { PreviewStyle } from '@/lib/spectre/types'
import { eq } from 'drizzle-orm'

export const dynamic = 'force-dynamic'

const STYLES: PreviewStyle[] = ['messaging', 'cloud', 'marketplace']
const ALPHABET = 'abcdefghijkmnpqrstuvwxyz23456789'

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
  return Response.json({ links: await getLinks() }, { headers: { 'Cache-Control': 'no-store' } })
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

  if (!label || !destination) {
    return Response.json({ ok: false, error: 'missing_fields' }, { status: 400 })
  }

  let normalized: URL
  try {
    normalized = new URL(destination)
  } catch {
    return Response.json({ ok: false, error: 'invalid_destination' }, { status: 400 })
  }

  if (!['http:', 'https:'].includes(normalized.protocol)) {
    return Response.json({ ok: false, error: 'invalid_protocol' }, { status: 400 })
  }

  const id = makeSlug()

  const [created] = await db
    .insert(links)
    .values({
      id,
      label,
      destination: normalized.toString(),
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

  await db.update(links).set({ active: body.active }).where(eq(links.id, body.id))
  return Response.json({ ok: true })
}
