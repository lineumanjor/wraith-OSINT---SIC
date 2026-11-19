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

/**
 * Indicadores comuns de crawlers, ferramentas automatizadas
 * e navegadores headless.
 *
 * Esta classificação é heurística: o User-Agent pode ser falsificado.
 */
const BOT_PATTERN =
  /(?:googlebot|bingbot|duckduckbot|yandexbot|baiduspider|applebot|slurp|crawler|spider|headlesschrome|phantomjs|google-inspectiontool|facebookexternalhit|facebot|twitterbot|linkedinbot|slackbot|discordbot|telegrambot|pinterestbot|embedly|curl\/|wget\/|python-requests|python-urllib|go-http-client|axios\/|node-fetch|libwww-perl|apache-httpclient)/i

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

function detectOs(ua: string): {
  os: string
  osVersion: string
} {
  const win = ua.match(/Windows NT ([\d.]+)/)

  if (win) {
    return {
      os: 'Windows',
      osVersion: WINDOWS_VERSIONS[win[1]] ?? `NT ${win[1]}`,
    }
  }

  const android = ua.match(/Android ([\d.]+)/)

  if (android) {
    return {
      os: 'Android',
      osVersion: android[1],
    }
  }

  const ios = ua.match(/(?:iPhone|iPad|iPod).*?OS ([\d_]+)/)

  if (ios) {
    return {
      os: 'iOS',
      osVersion: ios[1].replace(/_/g, '.'),
    }
  }

  const cros = ua.match(/CrOS \w+ ([\d.]+)/)

  if (cros) {
    return {
      os: 'ChromeOS',
      osVersion: cros[1],
    }
  }

  const mac = ua.match(/Mac OS X ([\d_.]+)/)

  if (mac) {
    return {
      os: 'macOS',
      osVersion: mac[1].replace(/_/g, '.'),
    }
  }

  if (/Linux/i.test(ua)) {
    return {
      os: 'Linux',
      osVersion: '',
    }
  }

  if (/Windows/i.test(ua)) {
    return {
      os: 'Windows',
      osVersion: '',
    }
  }

  return {
    os: 'Desconhecido',
    osVersion: '',
  }
}

function detectBrowser(ua: string): {
  browser: string
  browserVersion: string
} {
  for (const [pattern, name] of BROWSER_MATCHERS) {
    const match = ua.match(pattern)

    if (match) {
      return {
        browser: name,
        browserVersion: match[1],
      }
    }
  }

  return {
    browser: 'Desconhecido',
    browserVersion: '',
  }
}

function detectEngine(browser: string): string {
  if (browser === 'Firefox') return 'Gecko'

  if (browser === 'Safari') return 'WebKit'

  if (browser === 'Desconhecido') return 'Desconhecido'

  return 'Blink'
}

function detectDeviceType(
  ua: string,
  isBot: boolean,
): UaInfo['deviceType'] {
  if (!ua) return 'unknown'

  if (isBot) return 'bot'

  if (/iPad|Tablet|PlayBook|Silk/i.test(ua)) {
    return 'tablet'
  }

  if (/Android/i.test(ua) && !/Mobile/i.test(ua)) {
    return 'tablet'
  }

  if (/Mobi|iPhone|iPod|Android.*Mobile|Windows Phone/i.test(ua)) {
    return 'mobile'
  }

  return 'desktop'
}

/**
 * Analisa o User-Agent e devolve uma classificação técnica básica.
 *
 * Não tenta identificar o modelo exato nem o fabricante do equipamento.
 * Os campos são mantidos para compatibilidade com o restante do projeto.
 */
export function parseUserAgent(ua: string): UaInfo {
  const normalizedUa = typeof ua === 'string' ? ua.slice(0, 2048) : ''

  const isBot = BOT_PATTERN.test(normalizedUa)

  const { os, osVersion } = detectOs(normalizedUa)

  const { browser, browserVersion } = detectBrowser(normalizedUa)

  const engine = detectEngine(browser)

  const deviceType = detectDeviceType(normalizedUa, isBot)

  return {
    platform: os,
    os,
    osVersion,
    browser,
    browserVersion,
    engine,
    deviceType,

    // Mantidos para compatibilidade, sem identificar modelo ou fabricante.
    deviceModel: '',
    vendor: '',

    isBot,
  }
}