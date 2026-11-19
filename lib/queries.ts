import { db } from '@/lib/db'
import { captures, domains, links } from '@/lib/db/schema'
import type {
  Capture,
  DashboardData,
  DashboardStats,
  DomainSummary,
  LinkSummary,
  PreviewStyle,
  RedirectMode,
} from '@/lib/spectre/types'
import { desc, eq, or, sql } from 'drizzle-orm'

function serializeCapture(
  row: typeof captures.$inferSelect,
  linkLabel: string | null,
): Capture {
  return {
    ...row,
    linkLabel,
    createdAt: row.createdAt.toISOString(),
  }
}

export async function getCaptures(limit = 150): Promise<Capture[]> {
  const rows = await db
    .select({ capture: captures, linkLabel: links.label })
    .from(captures)
    .leftJoin(links, eq(captures.linkId, links.id))
    .orderBy(desc(captures.createdAt))
    .limit(limit)

  return rows.map((row) => serializeCapture(row.capture, row.linkLabel))
}

export async function getLinks(
  investigationId?: string,
): Promise<LinkSummary[]> {
  const rows = await db
    .select({
      link: links,
      hits: sql<number>`count(${captures.id})::int`,
    })
    .from(links)
    .leftJoin(captures, eq(captures.linkId, links.id))
    .where(
      investigationId
        ? eq(links.investigationId, investigationId)
        : sql`true`,
    )
    .groupBy(links.id)
    .orderBy(desc(links.createdAt))

  return rows.map(({ link, hits }) => ({
    id: link.id,
    label: link.label,
    destination: link.destination,
    slug: link.slug,
    host: link.host,
    investigationId: link.investigationId,
    redirectMode: link.redirectMode as RedirectMode,
    previewStyle: link.previewStyle as PreviewStyle,
    previewTitle: link.previewTitle,
    previewDescription: link.previewDescription,
    previewSource: link.previewSource,
    active: link.active,
    createdAt: link.createdAt.toISOString(),
    hits: hits ?? 0,
  }))
}

export async function getLink(slugOrId: string) {
  const [row] = await db
    .select()
    .from(links)
    .where(or(eq(links.slug, slugOrId), eq(links.id, slugOrId)))
    .limit(1)

  return row ?? null
}

export async function getDomains(): Promise<DomainSummary[]> {
  const rows = await db.select().from(domains).orderBy(desc(domains.createdAt))

  return rows.map((row) => ({
    id: row.id,
    hostname: row.hostname,
    verified: row.verified,
    createdAt: row.createdAt.toISOString(),
  }))
}

function buildStats(all: Capture[], linkList: LinkSummary[]): DashboardStats {
  const dayAgo = Date.now() - 24 * 60 * 60 * 1000
  const countries = new Set(all.map((c) => c.countryCode).filter(Boolean))
  const mobile = all.filter(
    (c) => c.deviceType === 'mobile' || c.deviceType === 'tablet',
  ).length

  return {
    total: all.length,
    last24h: all.filter(
      (c) => new Date(c.createdAt).getTime() > dayAgo,
    ).length,
    countries: countries.size,
    mobileShare: all.length ? Math.round((mobile / all.length) * 100) : 0,
    bots: all.filter((c) => c.isBot).length,
    activeLinks: linkList.filter((l) => l.active).length,
  }
}

export async function getDashboardData(): Promise<DashboardData> {
  const [captureList, linkList] = await Promise.all([
    getCaptures(),
    getLinks(),
  ])

  return {
    captures: captureList,
    links: linkList,
    stats: buildStats(captureList, linkList),
  }
}