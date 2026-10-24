export const ENTITY_KINDS = [
  'person',
  'account',
  'organization',
  'location',
  'phone',
  'email',
  'domain',
  'document',
  'vehicle',
  'event',
] as const

export type EntityKind = (typeof ENTITY_KINDS)[number]

export const ENTITY_KIND_LABEL: Record<EntityKind, string> = {
  person: 'Pessoa',
  account: 'Conta',
  organization: 'Organização',
  location: 'Local',
  phone: 'Telefone',
  email: 'E-mail',
  domain: 'Domínio',
  document: 'Documento',
  vehicle: 'Veículo',
  event: 'Evento',
}

export const CASE_STATUS = ['open', 'active', 'review', 'closed'] as const
export type CaseStatus = (typeof CASE_STATUS)[number]

export const CASE_STATUS_LABEL: Record<CaseStatus, string> = {
  open: 'Aberta',
  active: 'Em curso',
  review: 'Em revisão',
  closed: 'Encerrada',
}

export const CASE_PRIORITY = ['low', 'normal', 'high', 'critical'] as const
export type CasePriority = (typeof CASE_PRIORITY)[number]

export const CASE_PRIORITY_LABEL: Record<CasePriority, string> = {
  low: 'Baixa',
  normal: 'Normal',
  high: 'Alta',
  critical: 'Crítica',
}

export type Entity = {
  id: string
  investigationId: string
  kind: EntityKind
  label: string
  value: string | null
  notes: string | null
  latitude: number | null
  longitude: number | null
  confidence: number
  createdAt: string
}

export type Fact = {
  id: string
  investigationId: string
  title: string
  detail: string | null
  source: string | null
  occurredAt: string | null
  createdAt: string
}

export type EntityLink = {
  id: string
  investigationId: string
  fromEntity: string
  toEntity: string
  relation: string
  note: string | null
  createdAt: string
}

export type Investigation = {
  id: string
  name: string
  description: string | null
  status: CaseStatus
  priority: CasePriority
  createdAt: string
  updatedAt: string
}

export type InvestigationSummary = Investigation & {
  entityCount: number
  factCount: number
  linkCount: number
}

export type CaseDetail = {
  investigation: Investigation
  entities: Entity[]
  facts: Fact[]
  links: EntityLink[]
}
