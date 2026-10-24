import { db } from '@/lib/db'
import { sandboxSessions, type SandboxSessionRow } from '@/lib/db/schema'
import { desc } from 'drizzle-orm'
import { isLocationSource, type SandboxSession } from './types'

function toSession(row: SandboxSessionRow): SandboxSession {
  return {
    id: row.id,
    label: row.label,
    createdAt: row.createdAt.toISOString(),
    locationSource: isLocationSource(row.locationSource) ? row.locationSource : 'unavailable',
    latitude: row.latitude,
    longitude: row.longitude,
    accuracy: row.accuracy,
    city: row.city,
    region: row.region,
    country: row.country,
    countryCode: row.countryCode,
    ip: row.ip,
    asn: row.asn,
    asOrg: row.asOrg,
    timezone: row.timezone,
    platform: row.platform,
    browser: row.browser,
    os: row.os,
    deviceType: row.deviceType,
    screen: row.screen,
    languages: row.languages,
  }
}

export async function listSessions(limit = 60): Promise<SandboxSession[]> {
  const rows = await db
    .select()
    .from(sandboxSessions)
    .orderBy(desc(sandboxSessions.createdAt))
    .limit(limit)
  return rows.map(toSession)
}

export async function createSession(
  values: typeof sandboxSessions.$inferInsert,
): Promise<SandboxSession> {
  const [row] = await db.insert(sandboxSessions).values(values).returning()
  return toSession(row)
}
