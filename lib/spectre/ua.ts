export type UaInfo = {
  platform: string
  os: string
  osVersion: string
  browser: string
  browserVersion: string
  engine: string
  deviceType: 'mobile' | 'tablet' | 'desktop' | 'bot' | 'unknown'
  deviceModel: string
  vendor: string
  isBot: boolean
}

const BOT_PATTERN =
  /bot[\s/;)]|crawler|spider|crawling|headlesschrome|phantomjs|slurp|bingpreview|facebookexternalhit|whatsapp|telegrambot|slackbot|discordbot|twitterbot|linkedinbot|embedly|pinterest|google-inspectiontool|curl\/|wget\/|python-requests|python-urllib|go-http-client|axios\/|node-fetch|okhttp|libwww-perl|apache-httpclient/i

const WINDOWS_VERSIONS: Record<string, string> = {
  '10.0': '10 / 11',
  '6.3': '8.1',
  '6.2': '8',
  '6.1': '7',
  '6.0': 'Vista',
  '5.1': 'XP',
}

const BROWSER_MATCHERS: Array<[RegExp, string]> = [
  [/Edg(?:e|A|iOS)?\/([\d.]+)/, 'Edge'],
  [/OPR\/([\d.]+)/, 'Opera'],
  [/SamsungBrowser\/([\d.]+)/, 'Samsung Internet'],
  [/YaBrowser\/([\d.]+)/, 'Yandex'],
  [/FxiOS\/([\d.]+)/, 'Firefox'],
  [/Firefox\/([\d.]+)/, 'Firefox'],
  [/CriOS\/([\d.]+)/, 'Chrome'],
  [/Chrome\/([\d.]+)/, 'Chrome'],
  [/Version\/([\d.]+).*Safari/, 'Safari'],
]

const VENDOR_MATCHERS: Array<[RegExp, string]> = [
  [/\bSM-[A-Z0-9]+/, 'Samsung'],
  [/\bSAMSUNG\b/i, 'Samsung'],
  [/\bPixel\b/, 'Google'],
  [/\b(Redmi|POCO|Mi \d|MI \d|Xiaomi)\b/i, 'Xiaomi'],
  [/\b(HUAWEI|HONOR)\b/i, 'Huawei'],
  [/\b(ONEPLUS|OnePlus)\b/i, 'OnePlus'],
  [/\b(Moto|motorola)\b/i, 'Motorola'],
  [/\bLG-|\bLG\b/, 'LG'],
  [/\bNexus\b/, 'Google'],
  [/\biPhone\b/, 'Apple'],
  [/\biPad\b/, 'Apple'],
  [/\bMacintosh\b/, 'Apple'],
]

function detectOs(ua: string): { os: string; osVersion: string } {
  const win = ua.match(/Windows NT ([\d.]+)/)
  if (win) return { os: 'Windows', osVersion: WINDOWS_VERSIONS[win[1]] ?? `NT ${win[1]}` }

  const android = ua.match(/Android ([\d.]+)/)
  if (android) return { os: 'Android', osVersion: android[1] }

  const ios = ua.match(/(?:iPhone|iPad|iPod).*?OS ([\d_]+)/)
  if (ios) return { os: 'iOS', osVersion: ios[1].replace(/_/g, '.') }

  const cros = ua.match(/CrOS \w+ ([\d.]+)/)
  if (cros) return { os: 'ChromeOS', osVersion: cros[1] }

  const mac = ua.match(/Mac OS X ([\d_.]+)/)
  if (mac) return { os: 'macOS', osVersion: mac[1].replace(/_/g, '.') }

  if (/Linux/.test(ua)) return { os: 'Linux', osVersion: '' }
  if (/Windows/.test(ua)) return { os: 'Windows', osVersion: '' }

  return { os: 'Desconhecido', osVersion: '' }
}

function detectBrowser(ua: string): { browser: string; browserVersion: string } {
  for (const [pattern, name] of BROWSER_MATCHERS) {
    const match = ua.match(pattern)
    if (match) return { browser: name, browserVersion: match[1] }
  }
  return { browser: 'Desconhecido', browserVersion: '' }
}

function detectEngine(browser: string): string {
  if (browser === 'Firefox') return 'Gecko'
  if (browser === 'Safari') return 'WebKit'
  if (browser === 'Desconhecido') return 'Desconhecido'
  return 'Blink'
}

function detectDeviceModel(ua: string): string {
  const android = ua.match(/Android [\d.]+;\s*([^;)]+?)(?:\s+Build[/)]|\))/)
  if (android) {
    const raw = android[1].trim()
    if (raw && !/^(wv|K|Mobile|Tablet)$/i.test(raw)) return raw
  }
  if (/\biPhone\b/.test(ua)) return 'iPhone'
  if (/\biPad\b/.test(ua)) return 'iPad'
  if (/\bMacintosh\b/.test(ua)) return 'Mac'
  return ''
}

export function parseUserAgent(ua: string): UaInfo {
  const isBot = BOT_PATTERN.test(ua)
  const { os, osVersion } = detectOs(ua)
  const { browser, browserVersion } = detectBrowser(ua)
  const engine = detectEngine(browser)

  let deviceType: UaInfo['deviceType'] = 'desktop'
  if (isBot) deviceType = 'bot'
  else if (/iPad|Tablet|PlayBook|Silk/.test(ua) || (/Android/.test(ua) && !/Mobile/.test(ua)))
    deviceType = 'tablet'
  else if (/Mobi|iPhone|iPod|Android.*Mobile|Windows Phone/.test(ua)) deviceType = 'mobile'
  else if (!ua) deviceType = 'unknown'

  const vendor = VENDOR_MATCHERS.find(([pattern]) => pattern.test(ua))?.[1] ?? ''

  return {
    platform: os,
    os,
    osVersion,
    browser,
    browserVersion,
    engine,
    deviceType,
    deviceModel: detectDeviceModel(ua),
    vendor,
    isBot,
  }
}
