import { db } from '@/lib/db'
import { entities, entityLinks, facts, investigations } from '@/lib/db/schema'
import type {
  CaseDetail,
  CasePriority,
  CaseStatus,
  Entity,
  EntityKind,
  EntityLink,
  Fact,
  Investigation,
  InvestigationSummary,
} from '@/lib/cases/types'
import { desc, eq, sql } from 'drizzle-orm'

export function makeId(prefix: string): string {
  const raw = crypto.randomUUID().replace(/-/g, '')
  return `${prefix}_${raw.slice(0, 12)}`
}

function serializeInvestigation(row: typeof investigations.$inferSelect): Investigation {
  return {
    id: row.id,
    name: row.name,
    objective: row.objective,
    description: row.description,
    status: row.status as CaseStatus,
    priority: row.priority as CasePriority,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }
}

export async function listInvestigations(): Promise<InvestigationSummary[]> {
  const rows = await db
    .select({
      investigation: investigations,
      entityCount: sql<number>`(select count(*) from ${entities} where ${entities.investigationId} = ${investigations.id})::int`,
      factCount: sql<number>`(select count(*) from ${facts} where ${facts.investigationId} = ${investigations.id})::int`,
      linkCount: sql<number>`(select count(*) from ${entityLinks} where ${entityLinks.investigationId} = ${investigations.id})::int`,
    })
    .from(investigations)
    .orderBy(desc(investigations.updatedAt))

  return rows.map((row) => ({
    ...serializeInvestigation(row.investigation),
    entityCount: row.entityCount ?? 0,
    factCount: row.factCount ?? 0,
    linkCount: row.linkCount ?? 0,
  }))
}

export async function getCaseDetail(id: string): Promise<CaseDetail | null> {
  const [investigation] = await db
    .select()
    .from(investigations)
    .where(eq(investigations.id, id))
    .limit(1)

  if (!investigation) return null

  const [entityRows, factRows, linkRows] = await Promise.all([
    db.select().from(entities).where(eq(entities.investigationId, id)).orderBy(desc(entities.createdAt)),
    db.select().from(facts).where(eq(facts.investigationId, id)).orderBy(desc(facts.createdAt)),
    db.select().from(entityLinks).where(eq(entityLinks.investigationId, id)).orderBy(desc(entityLinks.createdAt)),
  ])

  return {
    investigation: serializeInvestigation(investigation),
    entities: entityRows.map(
      (row): Entity => ({
        id: row.id,
        investigationId: row.investigationId,
        kind: row.kind as EntityKind,
        label: row.label,
        value: row.value,
        notes: row.notes,
        latitude: row.latitude,
        longitude: row.longitude,
        confidence: row.confidence,
        createdAt: row.createdAt.toISOString(),
      }),
    ),
    facts: factRows.map(
      (row): Fact => ({
        id: row.id,
        investigationId: row.investigationId,
        title: row.title,
        detail: row.detail,
        source: row.source,
        occurredAt: row.occurredAt ? row.occurredAt.toISOString() : null,
        createdAt: row.createdAt.toISOString(),
      }),
    ),
    links: linkRows.map(
      (row): EntityLink => ({
        id: row.id,
        investigationId: row.investigationId,
        fromEntity: row.fromEntity,
        toEntity: row.toEntity,
        relation: row.relation,
        note: row.note,
        createdAt: row.createdAt.toISOString(),
      }),
    ),
  }
}

export async function touchInvestigation(id: string) {
  await db.update(investigations).set({ updatedAt: new Date() }).where(eq(investigations.id, id))
}
