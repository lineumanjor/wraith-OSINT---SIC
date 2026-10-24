import type { ClientFingerprint } from './types'

type NavigatorWithHints = Navigator & {
  deviceMemory?: number
  connection?: { effectiveType?: string; downlink?: number; rtt?: number }
  userAgentData?: { platform?: string; mobile?: boolean }
}

function readGpu(): string | undefined {
  try {
    const canvas = document.createElement('canvas')
    const gl =
      (canvas.getContext('webgl') as WebGLRenderingContext | null) ??
      (canvas.getContext('experimental-webgl') as WebGLRenderingContext | null)
    if (!gl) return undefined

    const ext = gl.getExtension('WEBGL_debug_renderer_info')
    if (!ext) return undefined

    const renderer = gl.getParameter(ext.UNMASKED_RENDERER_WEBGL)
    return typeof renderer === 'string' ? renderer.slice(0, 200) : undefined
  } catch {
    return undefined
  }
}

export function collectFingerprint(): ClientFingerprint {
  const nav = navigator as NavigatorWithHints
  const conn = nav.connection

  return {
    screen: `${window.screen.width}x${window.screen.height}`,
    viewport: `${window.innerWidth}x${window.innerHeight}`,
    pixelRatio: window.devicePixelRatio,
    colorDepth: window.screen.colorDepth,
    hardwareConcurrency: nav.hardwareConcurrency,
    deviceMemory: nav.deviceMemory,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    languages: (nav.languages ?? [nav.language]).filter(Boolean).join(','),
    touchPoints: nav.maxTouchPoints,
    gpu: readGpu(),
    connection: conn?.effectiveType
      ? `${conn.effectiveType}${conn.downlink ? ` · ${conn.downlink}Mb/s` : ''}`
      : undefined,
    platform: nav.userAgentData?.platform ?? undefined,
  }
}

export function makeSessionId(): string {
  const bytes = new Uint8Array(8)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
}

export async function sendCapture(linkId: string, fingerprint: ClientFingerprint) {
  const params = new URLSearchParams(window.location.search)
  const referrerId = params.get('ref') ?? params.get('utm_source') ?? undefined

  const response = await fetch('/api/spectre/collect', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      linkId,
      sessionId: makeSessionId(),
      referrerId,
      ...fingerprint,
    }),
    keepalive: true,
  })

  if (!response.ok) throw new Error(`collect_failed_${response.status}`)
  return (await response.json()) as { ok: boolean; destination?: string }
}
