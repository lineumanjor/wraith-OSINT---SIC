'use client'

import { cn } from '@/lib/utils'
import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'

type LineKind = 'cmd' | 'out' | 'ok' | 'warn' | 'err' | 'dim' | 'head'

type Line = { id: number; kind: LineKind; text: string }

const KIND_CLASS: Record<LineKind, string> = {
  cmd: 'text-foreground',
  out: 'text-[oklch(0.82_0.02_285)]',
  ok: 'text-[oklch(0.8_0.14_155)]',
  warn: 'text-[oklch(0.82_0.14_75)]',
  err: 'text-[oklch(0.72_0.18_25)]',
  dim: 'text-[oklch(0.6_0.02_285)]',
  head: 'text-[oklch(0.78_0.13_195)]',
}

const HELP = [
  'COMANDOS DISPONÍVEIS',
  '',
  '  sherlock <utilizador>     enumera perfis públicos em 42 plataformas',
  '  dns <domínio> [tipo]      consulta registos A, AAAA, MX, TXT, NS, CNAME, SOA',
  '  ip <endereço>             ASN, operadora, país, cidade e coordenadas',
  '  cases                     lista os dossiês abertos',
  '  open <id-do-dossiê>       abre um dossiê na interface',
  '  whoami                    identidade da sessão de laboratório',
  '  date                      hora local do sistema',
  '  clear                     limpa o ecrã',
  '  help                      esta lista',
  '',
  'Todas as consultas correm no servidor e atingem apenas fontes públicas.',
]

function pad(value: string, width: number) {
  return value.length >= width ? value.slice(0, width) : value + ' '.repeat(width - value.length)
}

export function Terminal() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const caseParam = searchParams.get('case')

  const [lines, setLines] = useState<Line[]>([])
  const [input, setInput] = useState('')
  const [history, setHistory] = useState<string[]>([])
  const [historyIndex, setHistoryIndex] = useState<number | null>(null)
  const [busy, setBusy] = useState(false)

  const counter = useRef(0)
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const push = useCallback((kind: LineKind, text: string) => {
    counter.current += 1
    const id = counter.current
    setLines((prev) => [...prev, { id, kind, text }])
  }, [])

  const pushMany = useCallback((kind: LineKind, texts: string[]) => {
    setLines((prev) => {
      const next = [...prev]
      for (const text of texts) {
        counter.current += 1
        next.push({ id: counter.current, kind, text })
      }
      return next
    })
  }, [])

  useEffect(() => {
    pushMany('dim', [
      'wraith-osint 0.9.4 · spectre shell · linux/x86_64',
      'sessão de laboratório — apenas fontes públicas e dados consentidos',
      caseParam ? `dossiê em contexto: ${caseParam}` : 'nenhum dossiê em contexto',
      '',
      "escreva 'help' para ver os comandos disponíveis",
      '',
    ])
  }, [pushMany, caseParam])

  useEffect(() => {
    const node = scrollRef.current
    if (node) node.scrollTop = node.scrollHeight
  }, [lines])

  const runSherlock = useCallback(
    async (username: string) => {
      const res = await fetch('/api/osint', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ action: 'sherlock', target: username }),
      })

      if (!res.ok || !res.body) {
        const payload = await res.json().catch(() => ({}))
        push('err', payload.error ?? `falha na varredura (http ${res.status})`)
        return
      }

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      let found = 0
      let checked = 0

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const parts = buffer.split('\n')
        buffer = parts.pop() ?? ''

        for (const part of parts) {
          if (!part.trim()) continue
          let event: Record<string, unknown>
          try {
            event = JSON.parse(part)
          } catch {
            continue
          }

          if (event.type === 'meta') {
            push('dim', `a enumerar ${username} em ${event.total} plataformas públicas…`)
            push('dim', '')
          } else if (event.type === 'result') {
            const result = event.result as {
              platform: string
              category: string
              url: string
              status: 'found' | 'not_found' | 'unknown'
              latencyMs: number
              note?: string
            }
            checked = Number(event.checked ?? checked)
            found = Number(event.found ?? found)

            if (result.status === 'found') {
              push('ok', `[+] ${pad(result.platform, 18)} ${pad(result.category, 10)} ${result.url}`)
            } else if (result.status === 'unknown') {
              push('warn', `[?] ${pad(result.platform, 18)} ${pad(result.category, 10)} ${result.note ?? 'indeterminado'}`)
            } else {
              push('dim', `[-] ${pad(result.platform, 18)} ${pad(result.category, 10)} ausente`)
            }
          } else if (event.type === 'done') {
            push('dim', '')
            push(
              found > 0 ? 'ok' : 'warn',
              `${found} ${found === 1 ? 'perfil encontrado' : 'perfis encontrados'} em ${checked} plataformas consultadas`,
            )
          } else if (event.type === 'error') {
            push('err', String(event.message ?? 'falha na varredura'))
          }
        }
      }
    },
    [push],
  )

  const runDns = useCallback(
    async (domain: string, type: string) => {
      const res = await fetch('/api/osint', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ action: 'dns', target: domain, type }),
      })
      const payload = await res.json()
      if (!res.ok) {
        push('err', payload.error ?? 'falha na consulta DNS')
        return
      }
      const result = payload.result as {
        name: string
        type: string
        status: number
        answers: { type: string; ttl: number; data: string }[]
      }
      push('head', `; ${result.name}  ${result.type}  status=${result.status}`)
      if (result.answers.length === 0) {
        push('warn', '; sem registos devolvidos')
        return
      }
      for (const answer of result.answers) {
        push('out', `${pad(answer.type, 6)} ${pad(String(answer.ttl), 7)} ${answer.data}`)
      }
    },
    [push],
  )

  const runIp = useCallback(
    async (address: string) => {
      const res = await fetch('/api/osint', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ action: 'ip', target: address }),
      })
      const payload = await res.json()
      if (!res.ok) {
        push('err', payload.error ?? 'falha na consulta')
        return
      }
      const result = payload.result as Record<string, unknown>
      const rows: [string, unknown][] = [
        ['endereço', result.ip],
        ['ASN', result.asn],
        ['operadora', result.org],
        ['país', result.country],
        ['região', result.region],
        ['cidade', result.city],
        ['fuso', result.timezone],
        ['coordenadas', result.latitude != null ? `${result.latitude}, ${result.longitude}` : null],
      ]
      for (const [key, value] of rows) {
        if (value == null || value === '') continue
        push('out', `${pad(key, 13)} ${String(value)}`)
      }
    },
    [push],
  )

  const runCases = useCallback(async () => {
    const res = await fetch('/api/cases')
    const payload = await res.json()
    const cases = (payload.cases ?? []) as { id: string; name: string; status: string; entityCount: number }[]
    if (cases.length === 0) {
      push('warn', 'nenhum dossiê aberto — crie um em /cases')
      return
    }
    push('head', `${pad('ID', 20)} ${pad('ESTADO', 10)} ${pad('ENT', 5)} NOME`)
    for (const item of cases) {
      push('out', `${pad(item.id, 20)} ${pad(item.status, 10)} ${pad(String(item.entityCount), 5)} ${item.name}`)
    }
  }, [push])

  const execute = useCallback(
    async (raw: string) => {
      const command = raw.trim()
      if (!command) return

      push('cmd', `wraith@lab:~$ ${command}`)
      setHistory((prev) => [...prev, command])
      setHistoryIndex(null)
      setBusy(true)

      const [name, ...args] = command.split(/\s+/)
      const verb = name.toLowerCase()

      try {
        if (verb === 'help' || verb === '?') {
          pushMany('out', HELP)
        } else if (verb === 'clear') {
          setLines([])
        } else if (verb === 'sherlock' || verb === 'scan') {
          if (!args[0]) {
            push('err', 'uso: sherlock <utilizador>')
          } else {
            await runSherlock(args[0])
          }
        } else if (verb === 'dns') {
          if (!args[0]) {
            push('err', 'uso: dns <domínio> [A|AAAA|MX|TXT|NS|CNAME|SOA]')
          } else {
            await runDns(args[0], (args[1] ?? 'A').toUpperCase())
          }
        } else if (verb === 'ip') {
          if (!args[0]) {
            push('err', 'uso: ip <endereço>')
          } else {
            await runIp(args[0])
          }
        } else if (verb === 'cases') {
          await runCases()
        } else if (verb === 'open') {
          if (!args[0]) {
            push('err', 'uso: open <id-do-dossiê>')
          } else {
            push('dim', `a abrir ${args[0]}…`)
            router.push(`/cases/${args[0]}`)
          }
        } else if (verb === 'whoami') {
          push('out', 'analista@wraith-lab')
          push('dim', 'sessão local · sem credenciais de terceiros')
        } else if (verb === 'date') {
          push('out', new Date().toString())
        } else if (verb === 'ls') {
          pushMany('out', ['cases/  terminal/  forge/  preview/  engine/'])
        } else {
          push('err', `comando não encontrado: ${name}`)
          push('dim', "escreva 'help' para ver os comandos disponíveis")
        }
      } catch (error) {
        push('err', error instanceof Error ? error.message : 'erro inesperado')
      } finally {
        push('dim', '')
        setBusy(false)
      }
    },
    [push, pushMany, router, runCases, runDns, runIp, runSherlock],
  )

  function onKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter') {
      if (event.nativeEvent.isComposing || event.keyCode === 229) return
      const value = input
      setInput('')
      void execute(value)
      return
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault()
      if (history.length === 0) return
      const next = historyIndex === null ? history.length - 1 : Math.max(0, historyIndex - 1)
      setHistoryIndex(next)
      setInput(history[next] ?? '')
      return
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault()
      if (historyIndex === null) return
      const next = historyIndex + 1
      if (next >= history.length) {
        setHistoryIndex(null)
        setInput('')
      } else {
        setHistoryIndex(next)
        setInput(history[next] ?? '')
      }
    }
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:py-8">
      <header className="mb-4">
        <p className="font-mono text-[10px] tracking-[0.28em] text-muted-foreground uppercase">
          Módulo 06 · Shell
        </p>
        <h1 className="mt-1.5 text-2xl font-semibold tracking-tight text-foreground">
          Spectre Terminal
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          Enumeração de perfis públicos, DNS e geolocalização de endereços. Cada comando corre no
          servidor e devolve resultados reais.
        </p>
      </header>

      <div className="overflow-hidden rounded-xl border border-border bg-[oklch(0.13_0.012_285)] shadow-2xl">
        <div className="flex items-center gap-2 border-b border-white/[0.06] bg-white/[0.02] px-3 py-2">
          <span className="size-2.5 rounded-full bg-[oklch(0.65_0.18_25)]" aria-hidden />
          <span className="size-2.5 rounded-full bg-[oklch(0.78_0.14_75)]" aria-hidden />
          <span className="size-2.5 rounded-full bg-[oklch(0.72_0.14_155)]" aria-hidden />
          <p className="ml-2 font-mono text-[11px] text-[oklch(0.62_0.02_285)]">
            wraith@lab: ~/spectre
          </p>
          <span className="ml-auto font-mono text-[10px] tracking-wide text-[oklch(0.55_0.02_285)] uppercase">
            {busy ? 'a executar' : 'pronto'}
          </span>
        </div>

        <div
          ref={scrollRef}
          onClick={() => inputRef.current?.focus()}
          className="relative h-[min(62vh,560px)] overflow-y-auto px-4 py-3 font-mono text-[12.5px] leading-[1.65]"
        >
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.035]"
            style={{
              backgroundImage:
                'repeating-linear-gradient(0deg, oklch(1 0 0) 0px, oklch(1 0 0) 1px, transparent 1px, transparent 3px)',
            }}
            aria-hidden
          />

          <div role="log" aria-live="polite" aria-label="Saída do terminal" className="relative">
            {lines.map((line) => (
              <p
                key={line.id}
                className={cn('whitespace-pre-wrap break-words', KIND_CLASS[line.kind])}
              >
                {line.text || '\u00A0'}
              </p>
            ))}
          </div>

          <div className="relative mt-1 flex items-center gap-2">
            <span className="shrink-0 text-[oklch(0.72_0.15_292)]">wraith@lab:~$</span>
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              disabled={busy}
              autoComplete="off"
              autoCapitalize="off"
              spellCheck={false}
              aria-label="Comando do terminal"
              className="min-w-0 flex-1 bg-transparent text-foreground caret-[oklch(0.72_0.15_292)] outline-none disabled:opacity-60"
            />
            {busy && (
              <span className="shrink-0 animate-pulse text-[oklch(0.78_0.13_195)]" aria-hidden>
                ▍
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {[
          { label: 'help', command: 'help' },
          { label: 'sherlock torvalds', command: 'sherlock torvalds' },
          { label: 'dns example.com MX', command: 'dns example.com MX' },
          { label: 'ip 1.1.1.1', command: 'ip 1.1.1.1' },
          { label: 'cases', command: 'cases' },
        ].map((item) => (
          <button
            key={item.command}
            type="button"
            disabled={busy}
            onClick={() => void execute(item.command)}
            className="rounded-md border border-border bg-card/40 px-2.5 py-1 font-mono text-[11px] text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground disabled:opacity-50"
          >
            {item.label}
          </button>
        ))}
      </div>
    </div>
  )
}
