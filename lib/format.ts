export function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const seconds = Math.round(diff / 1000)

  if (seconds < 10) return 'agora'
  if (seconds < 60) return `${seconds}s atrás`
  const minutes = Math.round(seconds / 60)
  if (minutes < 60) return `${minutes}min atrás`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours}h atrás`
  const days = Math.round(hours / 24)
  return `${days}d atrás`
}

export function clockTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

export function shortDate(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
  })
}

export function flagEmoji(countryCode: string | null): string {
  if (!countryCode || countryCode.length !== 2) return ''
  const base = 0x1f1e6
  const chars = countryCode
    .toUpperCase()
    .split('')
    .map((c) => String.fromCodePoint(base + c.charCodeAt(0) - 65))
  return chars.join('')
}
