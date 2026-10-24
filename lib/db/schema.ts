import {
  bigserial,
  boolean,
  doublePrecision,
  integer,
  pgTable,
  text,
  timestamp,
} from 'drizzle-orm/pg-core'

export const links = pgTable('links', {
  id: text('id').primaryKey(),
  label: text('label').notNull(),
  destination: text('destination').notNull(),
  previewStyle: text('preview_style').notNull().default('messaging'),
  previewTitle: text('preview_title'),
  previewDescription: text('preview_description'),
  previewSource: text('preview_source'),
  investigationId: text('investigation_id'),
  active: boolean('active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const captures = pgTable('captures', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  linkId: text('link_id').notNull(),
  sessionId: text('session_id'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  ip: text('ip'),
  asn: text('asn'),
  asOrg: text('as_org'),
  country: text('country'),
  countryCode: text('country_code'),
  region: text('region'),
  city: text('city'),
  latitude: doublePrecision('latitude'),
  longitude: doublePrecision('longitude'),
  userAgent: text('user_agent'),
  referrer: text('referrer'),
  referrerId: text('referrer_id'),
  platform: text('platform'),
  os: text('os'),
  osVersion: text('os_version'),
  browser: text('browser'),
  browserVersion: text('browser_version'),
  engine: text('engine'),
  deviceType: text('device_type'),
  deviceModel: text('device_model'),
  vendor: text('vendor'),
  screen: text('screen'),
  viewport: text('viewport'),
  pixelRatio: doublePrecision('pixel_ratio'),
  colorDepth: integer('color_depth'),
  hardwareConcurrency: integer('hardware_concurrency'),
  deviceMemory: doublePrecision('device_memory'),
  timezone: text('timezone'),
  languages: text('languages'),
  touchPoints: integer('touch_points'),
  gpu: text('gpu'),
  connection: text('connection'),
  isBot: boolean('is_bot').default(false),
})

export const investigations = pgTable('investigations', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  status: text('status').notNull().default('open'),
  priority: text('priority').notNull().default('normal'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export const entities = pgTable('entities', {
  id: text('id').primaryKey(),
  investigationId: text('investigation_id').notNull(),
  kind: text('kind').notNull(),
  label: text('label').notNull(),
  value: text('value'),
  notes: text('notes'),
  latitude: doublePrecision('latitude'),
  longitude: doublePrecision('longitude'),
  confidence: integer('confidence').notNull().default(50),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const facts = pgTable('facts', {
  id: text('id').primaryKey(),
  investigationId: text('investigation_id').notNull(),
  title: text('title').notNull(),
  detail: text('detail'),
  source: text('source'),
  occurredAt: timestamp('occurred_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const entityLinks = pgTable('entity_links', {
  id: text('id').primaryKey(),
  investigationId: text('investigation_id').notNull(),
  fromEntity: text('from_entity').notNull(),
  toEntity: text('to_entity').notNull(),
  relation: text('relation').notNull(),
  note: text('note'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export type LinkRow = typeof links.$inferSelect
export type CaptureRow = typeof captures.$inferSelect
export type InvestigationRow = typeof investigations.$inferSelect
export type EntityRow = typeof entities.$inferSelect
export type FactRow = typeof facts.$inferSelect
export type EntityLinkRow = typeof entityLinks.$inferSelect
