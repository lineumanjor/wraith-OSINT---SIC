export type PreviewStyle = 'messaging' | 'cloud' | 'marketplace'

export type Capture = {
  id: number
  linkId: string
  linkLabel: string | null
  sessionId: string | null
  createdAt: string
  ip: string | null
  asn: string | null
  asOrg: string | null
  country: string | null
  countryCode: string | null
  region: string | null
  city: string | null
  latitude: number | null
  longitude: number | null
  userAgent: string | null
  referrer: string | null
  referrerId: string | null
  platform: string | null
  os: string | null
  osVersion: string | null
  browser: string | null
  browserVersion: string | null
  engine: string | null
  deviceType: string | null
  deviceModel: string | null
  vendor: string | null
  screen: string | null
  viewport: string | null
  pixelRatio: number | null
  colorDepth: number | null
  hardwareConcurrency: number | null
  deviceMemory: number | null
  timezone: string | null
  languages: string | null
  touchPoints: number | null
  gpu: string | null
  connection: string | null
  isBot: boolean | null
}

export type LinkSummary = {
  id: string
  label: string
  destination: string
  previewStyle: PreviewStyle
  previewTitle: string | null
  previewDescription: string | null
  previewSource: string | null
  active: boolean
  createdAt: string
  hits: number
}

export type DashboardStats = {
  total: number
  last24h: number
  countries: number
  mobileShare: number
  bots: number
  activeLinks: number
}

export type DashboardData = {
  captures: Capture[]
  links: LinkSummary[]
  stats: DashboardStats
}

export type ClientFingerprint = {
  screen?: string
  viewport?: string
  pixelRatio?: number
  colorDepth?: number
  hardwareConcurrency?: number
  deviceMemory?: number
  timezone?: string
  languages?: string
  touchPoints?: number
  gpu?: string
  connection?: string
  platform?: string
  referrerId?: string
}
