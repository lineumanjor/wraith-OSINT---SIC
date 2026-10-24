import { makeId, touchInvestigation } from '@/lib/cases/queries'
import { ENTITY_KINDS } from '@/lib/cases/types'
import { db } from '@/lib/db'
import { entities, entityLinks, facts } from '@/lib/db/schema'
import { and, eq } from 'drizzle-orm'

export const runtime = 'nodejs'

type Params = { params: Promise<{ id: string }> }

type Body = {
  recordType?: 'entity' | 'fact' | 'link'
  kind?: string
  label?: string
  value?: string
  notes?: string
  latitude?: number | string | null
  longitude?: number | string | null
  confidence?: number | string
  title?: string
  detail?: string
  source?: string
  occurredAt?: string
  fromEntity?: string
  toEntity?: string
  relation?: string
  note?: string
}

function toNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null
  const parsed = typeof value === 'number' ? value : Number(String(value).replace(',', '.'))
  return Number.isFinite(parsed) ? parsed : null
}

export async function POST(request: Request, { params }: Params) {
  const { id } = await params

  let body: Body
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'corpo inválido' }, { status: 400 })
  }

  if (body.recordType === 'entity') {
    const label = (body.label ?? '').trim()
    if (label.length < 2) {
      return Response.json({ error: 'o rótulo da entidade precisa de pelo menos 2 caracteres' }, { status: 400 })
    }
    const kind = ENTITY_KINDS.includes((body.kind ?? '') as never) ? body.kind! : 'person'
    const latitude = toNumber(body.latitude)
    const longitude = toNumber(body.longitude)

    if (latitude !== null && (latitude < -90 || latitude > 90)) {
      return Response.json({ error: 'latitude fora do intervalo -90..90' }, { status: 400 })
    }
    if (longitude !== null && (longitude < -180 || longitude > 180)) {
      return Response.json({ error: 'longitude fora do intervalo -180..180' }, { status: 400 })
    }

    const confidence = Math.min(100, Math.max(0, toNumber(body.confidence) ?? 50))

    const [created] = await db
      .insert(entities)
      .values({
        id: makeId('ent'),
        investigationId: id,
        kind,
        label: label.slice(0, 200),
        value: (body.value ?? '').trim().slice(0, 500) || null,
        notes: (body.notes ?? '').trim().slice(0, 2000) || null,
        latitude,
        longitude,
        confidence,
      })
      .returning()

    await touchInvestigation(id)
    return Response.json({ entity: created }, { status: 201 })
  }

  if (body.recordType === 'fact') {
    const title = (body.title ?? '').trim()
    if (title.length < 3) {
      return Response.json({ error: 'o título do facto precisa de pelo menos 3 caracteres' }, { status: 400 })
    }

    const occurredAt = body.occurredAt ? new Date(body.occurredAt) : null
    if (occurredAt && Number.isNaN(occurredAt.getTime())) {
      return Response.json({ error: 'data do facto inválida' }, { status: 400 })
    }

    const [created] = await db
      .insert(facts)
      .values({
        id: makeId('fact'),
        investigationId: id,
        title: title.slice(0, 200),
        detail: (body.detail ?? '').trim().slice(0, 4000) || null,
        source: (body.source ?? '').trim().slice(0, 500) || null,
        occurredAt,
      })
      .returning()

    await touchInvestigation(id)
    return Response.json({ fact: created }, { status: 201 })
  }

  if (body.recordType === 'link') {
    const fromEntity = (body.fromEntity ?? '').trim()
    const toEntity = (body.toEntity ?? '').trim()
    const relation = (body.relation ?? '').trim()

    if (!fromEntity || !toEntity) {
      return Response.json({ error: 'selecione as duas entidades a ligar' }, { status: 400 })
    }
    if (fromEntity === toEntity) {
      return Response.json({ error: 'uma entidade não pode ser ligada a si própria' }, { status: 400 })
    }
    if (relation.length < 2) {
      return Response.json({ error: 'descreva a relação entre as entidades' }, { status: 400 })
    }

    const [created] = await db
      .insert(entityLinks)
      .values({
        id: makeId('lnk'),
        investigationId: id,
        fromEntity,
        toEntity,
        relation: relation.slice(0, 120),
        note: (body.note ?? '').trim().slice(0, 1000) || null,
      })
      .returning()

    await touchInvestigation(id)
    return Response.json({ link: created }, { status: 201 })
  }

  return Response.json({ error: 'tipo de registo desconhecido' }, { status: 400 })
}

export async function DELETE(request: Request, { params }: Params) {
  const { id } = await params
  const url = new URL(request.url)
  const recordType = url.searchParams.get('recordType')
  const recordId = url.searchParams.get('recordId')

  if (!recordId) return Response.json({ error: 'recordId em falta' }, { status: 400 })

  if (recordType === 'entity') {
    await db.delete(entities).where(and(eq(entities.id, recordId), eq(entities.investigationId, id)))
  } else if (recordType === 'fact') {
    await db.delete(facts).where(and(eq(facts.id, recordId), eq(facts.investigationId, id)))
  } else if (recordType === 'link') {
    await db.delete(entityLinks).where(and(eq(entityLinks.id, recordId), eq(entityLinks.investigationId, id)))
  } else {
    return Response.json({ error: 'tipo de registo desconhecido' }, { status: 400 })
  }

  await touchInvestigation(id)
  return Response.json({ ok: true })
}
