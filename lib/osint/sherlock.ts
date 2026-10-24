export type PlatformProbe = {
  name: string
  category: string
  url: (username: string) => string
  /** How existence is decided from the HTTP response. */
  rule: 'status' | 'absent-text'
  /** Text that appears in the body when the profile does NOT exist. */
  absentText?: string
}

/**
 * Public profile endpoints that answer with a reliable 200/404 pair.
 * Platforms that render a login wall or a soft-200 for missing accounts are
 * deliberately excluded — a false "found" is worse than a missing platform.
 */
export const PLATFORMS: PlatformProbe[] = [
  { name: 'GitHub', category: 'dev', url: (u) => `https://github.com/${u}`, rule: 'status' },
  { name: 'GitLab', category: 'dev', url: (u) => `https://gitlab.com/${u}`, rule: 'status' },
  { name: 'Codeberg', category: 'dev', url: (u) => `https://codeberg.org/${u}`, rule: 'status' },
  { name: 'Bitbucket', category: 'dev', url: (u) => `https://bitbucket.org/${u}/`, rule: 'status' },
  { name: 'SourceForge', category: 'dev', url: (u) => `https://sourceforge.net/u/${u}/profile`, rule: 'status' },
  { name: 'Codewars', category: 'dev', url: (u) => `https://www.codewars.com/users/${u}`, rule: 'status' },
  { name: 'Exercism', category: 'dev', url: (u) => `https://exercism.org/profiles/${u}`, rule: 'status' },
  { name: 'freeCodeCamp', category: 'dev', url: (u) => `https://www.freecodecamp.org/${u}`, rule: 'status' },
  { name: 'Replit', category: 'dev', url: (u) => `https://replit.com/@${u}`, rule: 'status' },
  { name: 'Hugging Face', category: 'dev', url: (u) => `https://huggingface.co/${u}`, rule: 'status' },
  { name: 'npm', category: 'dev', url: (u) => `https://www.npmjs.com/~${u}`, rule: 'status' },
  { name: 'PyPI', category: 'dev', url: (u) => `https://pypi.org/user/${u}/`, rule: 'status' },
  { name: 'Docker Hub', category: 'dev', url: (u) => `https://hub.docker.com/u/${u}`, rule: 'status' },
  { name: 'Dev.to', category: 'writing', url: (u) => `https://dev.to/${u}`, rule: 'status' },
  { name: 'Medium', category: 'writing', url: (u) => `https://medium.com/@${u}`, rule: 'absent-text', absentText: 'Out of nothing' },
  { name: 'Hashnode', category: 'writing', url: (u) => `https://hashnode.com/@${u}`, rule: 'absent-text', absentText: 'User not found' },
  { name: 'Substack', category: 'writing', url: (u) => `https://${u}.substack.com`, rule: 'status' },
  { name: 'Goodreads', category: 'writing', url: (u) => `https://www.goodreads.com/${u}`, rule: 'status' },
  { name: 'Wattpad', category: 'writing', url: (u) => `https://www.wattpad.com/user/${u}`, rule: 'status' },
  { name: 'Speaker Deck', category: 'writing', url: (u) => `https://speakerdeck.com/${u}`, rule: 'status' },
  { name: 'Letterboxd', category: 'media', url: (u) => `https://letterboxd.com/${u}/`, rule: 'status' },
  { name: 'Last.fm', category: 'media', url: (u) => `https://www.last.fm/user/${u}`, rule: 'status' },
  { name: 'SoundCloud', category: 'media', url: (u) => `https://soundcloud.com/${u}`, rule: 'status' },
  { name: 'Bandcamp', category: 'media', url: (u) => `https://bandcamp.com/${u}`, rule: 'status' },
  { name: 'Vimeo', category: 'media', url: (u) => `https://vimeo.com/${u}`, rule: 'status' },
  { name: 'Flickr', category: 'media', url: (u) => `https://www.flickr.com/people/${u}`, rule: 'status' },
  { name: 'Behance', category: 'media', url: (u) => `https://www.behance.net/${u}`, rule: 'status' },
  { name: 'Dribbble', category: 'media', url: (u) => `https://dribbble.com/${u}`, rule: 'status' },
  { name: 'MyAnimeList', category: 'media', url: (u) => `https://myanimelist.net/profile/${u}`, rule: 'status' },
  { name: 'Steam', category: 'social', url: (u) => `https://steamcommunity.com/id/${u}`, rule: 'absent-text', absentText: 'could not be found' },
  { name: 'Pinterest', category: 'social', url: (u) => `https://www.pinterest.com/${u}/`, rule: 'absent-text', absentText: 'User not found' },
  { name: 'Telegram', category: 'social', url: (u) => `https://t.me/${u}`, rule: 'absent-text', absentText: 'tgme_page_extra' },
  { name: 'Hacker News', category: 'social', url: (u) => `https://news.ycombinator.com/user?id=${u}`, rule: 'absent-text', absentText: 'No such user' },
  { name: 'Mastodon', category: 'social', url: (u) => `https://mastodon.social/@${u}`, rule: 'status' },
  { name: 'itch.io', category: 'social', url: (u) => `https://${u}.itch.io`, rule: 'status' },
  { name: 'Keybase', category: 'identity', url: (u) => `https://keybase.io/${u}`, rule: 'status' },
  { name: 'Gravatar', category: 'identity', url: (u) => `https://gravatar.com/${u}`, rule: 'status' },
  { name: 'About.me', category: 'identity', url: (u) => `https://about.me/${u}`, rule: 'status' },
  { name: 'Patreon', category: 'funding', url: (u) => `https://www.patreon.com/${u}`, rule: 'status' },
  { name: 'Buy Me a Coffee', category: 'funding', url: (u) => `https://buymeacoffee.com/${u}`, rule: 'status' },
  { name: 'Chess.com', category: 'hobby', url: (u) => `https://www.chess.com/member/${u}`, rule: 'status' },
  { name: 'Roblox', category: 'hobby', url: (u) => `https://www.roblox.com/user.aspx?username=${u}`, rule: 'status' },
]

export type ProbeStatus = 'found' | 'not_found' | 'unknown'

export type ProbeResult = {
  platform: string
  category: string
  url: string
  status: ProbeStatus
  httpStatus: number | null
  latencyMs: number
  note?: string
}

const UA =
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36'

async function probe(platform: PlatformProbe, username: string): Promise<ProbeResult> {
  const url = platform.url(username)
  const started = Date.now()

  try {
    const res = await fetch(url, {
      method: 'GET',
      redirect: 'follow',
      cache: 'no-store',
      signal: AbortSignal.timeout(7000),
      headers: {
        'user-agent': UA,
        accept: 'text/html,application/xhtml+xml',
        'accept-language': 'en-US,en;q=0.9',
      },
    })

    const latencyMs = Date.now() - started

    if (platform.rule === 'status') {
      if (res.status === 200) {
        return { platform: platform.name, category: platform.category, url, status: 'found', httpStatus: 200, latencyMs }
      }
      if (res.status === 404 || res.status === 410) {
        return { platform: platform.name, category: platform.category, url, status: 'not_found', httpStatus: res.status, latencyMs }
      }
      return {
        platform: platform.name,
        category: platform.category,
        url,
        status: 'unknown',
        httpStatus: res.status,
        latencyMs,
        note: res.status === 403 || res.status === 429 ? 'bloqueado' : `http ${res.status}`,
      }
    }

    const body = await res.text()
    const latency = Date.now() - started
    if (res.status === 404) {
      return { platform: platform.name, category: platform.category, url, status: 'not_found', httpStatus: 404, latencyMs: latency }
    }
    if (res.status !== 200) {
      return {
        platform: platform.name,
        category: platform.category,
        url,
        status: 'unknown',
        httpStatus: res.status,
        latencyMs: latency,
        note: `http ${res.status}`,
      }
    }
    const absent = platform.absentText ? body.includes(platform.absentText) : false
    return {
      platform: platform.name,
      category: platform.category,
      url,
      status: absent ? 'not_found' : 'found',
      httpStatus: 200,
      latencyMs: latency,
    }
  } catch (error) {
    return {
      platform: platform.name,
      category: platform.category,
      url,
      status: 'unknown',
      httpStatus: null,
      latencyMs: Date.now() - started,
      note: error instanceof Error && error.name === 'TimeoutError' ? 'timeout' : 'sem resposta',
    }
  }
}

export async function* enumerateUsername(
  username: string,
  concurrency = 8,
): AsyncGenerator<ProbeResult> {
  const queue = [...PLATFORMS]
  const inFlight = new Set<Promise<ProbeResult>>()

  const start = () => {
    const next = queue.shift()
    if (!next) return
    const task = probe(next, username).then((result) => {
      inFlight.delete(task)
      return result
    })
    inFlight.add(task)
  }

  for (let i = 0; i < concurrency; i += 1) start()

  while (inFlight.size > 0) {
    const settled = await Promise.race(inFlight)
    yield settled
    start()
  }
}
