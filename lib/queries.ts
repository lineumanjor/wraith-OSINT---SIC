import { db } from '@/lib/db'
import { captures, links } from '@/lib/db/schema'
import type { Capture, DashboardData, DashboardStats, LinkSummary, PreviewStyle } from '@/lib/spectre/types'
import { desc, eq, sql } from 'drizzle-orm'

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

export async function getLinks(): Promise<LinkSummary[]> {
  const rows = await db
    .select({
      link: links,
      hits: sql<number>`count(${captures.id})::int`,
    })
    .from(links)
    .leftJoin(captures, eq(captures.linkId, links.id))
    .groupBy(links.id)
    .orderBy(desc(links.createdAt))

  return rows.map(({ link, hits }) => ({
    id: link.id,
    label: link.label,
    destination: link.destination,
    previewStyle: link.previewStyle as PreviewStyle,
    previewTitle: link.previewTitle,
    previewDescription: link.previewDescription,
    previewSource: link.previewSource,
    active: link.active,
    createdAt: link.createdAt.toISOString(),
    hits: hits ?? 0,
  }))
}

export async function getLink(id: string) {
  const [row] = await db.select().from(links).where(eq(links.id, id)).limit(1)
  return row ?? null
}

function buildStats(all: Capture[], linkList: LinkSummary[]): DashboardStats {
  const dayAgo = Date.now() - 24 * 60 * 60 * 1000
  const countries = new Set(all.map((c) => c.countryCode).filter(Boolean))
  const mobile = all.filter((c) => c.deviceType === 'mobile' || c.deviceType === 'tablet').length

  return {
    total: all.length,
    last24h: all.filter((c) => new Date(c.createdAt).getTime() > dayAgo).length,
    countries: countries.size,
    mobileShare: all.length ? Math.round((mobile / all.length) * 100) : 0,
    bots: all.filter((c) => c.isBot).length,
    activeLinks: linkList.filter((l) => l.active).length,
  }
}

export async function getDashboardData(): Promise<DashboardData> {
  const [captureList, linkList] = await Promise.all([getCaptures(), getLinks()])
  return {
    captures: captureList,
    links: linkList,
    stats: buildStats(captureList, linkList),
  }
}
