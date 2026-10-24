'use client'

import type { DomainSummary } from '@/lib/spectre/types'
import { cn } from '@/lib/utils'
import { Check, Copy, Globe, Loader2, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import useSWR from 'swr'

const fetcher = <T,>(url: string) => fetch(url).then((res) => res.json() as Promise<T>)
const CNAME_TARGET = 'cname.vercel-dns.com'

type Props = {
  value: string | null
  onChange: (host: string | null) => void
  fallbackHost: string
}

export function DomainPicker({ value, onChange, fallbackHost }: Props) {
  const { data, mutate } = useSWR<{ domains: DomainSummary[] }>('/api/domains', fetcher)
  const [hostname, setHostname] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)

  const domains = data?.domains ?? []

  async function copy(text: string) {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(text)
      setTimeout(() => setCopied(null), 1800)
    } catch {
      setError('Não foi possível copiar automaticamente.')
    }
  }

  async function addDomain() {
    if (!hostname.trim() || saving) return
    setSaving(true)
    setError(null)

    try {
      const response = await fetch('/api/domains', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hostname }),
      })
      const payload = (await response.json()) as { ok: boolean; error?: string }

      if (!response.ok || !payload.ok) {
        setError(
          payload.error === 'hostname_taken'
            ? 'Este domínio já está registado.'
            : 'Domínio inválido. Usa apenas o host, por exemplo links.a-minha-marca.pt.',
        )
        return
      }

      setHostname('')
      setAdding(false)
      await mutate()
    } catch {
      setError('Falha de rede ao registar o domínio.')
    } finally {
      setSaving(false)
    }
  }

  async function toggleVerified(domain: DomainSummary) {
    await fetch('/api/domains', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: domain.id, verified: !domain.verified }),
    })
    await mutate()
  }

  async function remove(domain: DomainSummary) {
    if (value === domain.hostname) onChange(null)
    await fetch('/api/domains', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: domain.id }),
    })
    await mutate()
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-[10px] tracking-[0.14em] text-muted-foreground uppercase">
          Domínio do link
        </span>
        <button
          type="button"
          onClick={() => setAdding((current) => !current)}
          aria-expanded={adding}
          aria-label="Adicionar domínio próprio"
          className="flex items-center gap-1 font-mono text-[10px] text-muted-foreground transition-colors hover:text-primary"
        >
          <Plus className="size-3" aria-hidden />
          domínio próprio
        </button>
      </div>

      <div className="mt-1.5 flex flex-wrap gap-1.5">
        <button
          type="button"
          onClick={() => onChange(null)}
          aria-pressed={value === null}
          className={cn(
            'flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 font-mono text-[11px] transition-colors',
            value === null
              ? 'border-primary/60 bg-primary/10 text-foreground'
              : 'border-border bg-background/40 text-muted-foreground hover:border-primary/30',
          )}
        >
          <Globe className="size-3" aria-hidden />
          {fallbackHost || 'domínio de desenvolvimento'}
        </button>

        {domains.map((domain) => {
          const active = value === domain.hostname
          return (
            <span
              key={domain.id}
              className={cn(
                'flex items-center overflow-hidden rounded-md border transition-colors',
                active
                  ? 'border-primary/60 bg-primary/10'
                  : 'border-border bg-background/40 hover:border-primary/30',
              )}
            >
              <button
                type="button"
                onClick={() => onChange(domain.hostname)}
                aria-pressed={active}
                aria-label={`Usar ${domain.hostname}`}
                className={cn(
                  'flex items-center gap-1.5 py-1.5 pr-1.5 pl-2.5 font-mono text-[11px]',
                  active ? 'text-foreground' : 'text-muted-foreground',
                )}
              >
                <span
                  className={cn(
                    'size-1.5 rounded-full',
                    domain.verified ? 'bg-accent' : 'bg-muted-foreground/40',
                  )}
                  aria-hidden
                />
                {domain.hostname}
              </button>
              <button
                type="button"
                onClick={() => toggleVerified(domain)}
                className="px-1 py-1.5 text-muted-foreground/60 transition-colors hover:text-accent"
                aria-label={
                  domain.verified
                    ? `Marcar ${domain.hostname} como pendente`
                    : `Marcar ${domain.hostname} como verificado`
                }
              >
                <Check className="size-3" aria-hidden />
              </button>
              <button
                type="button"
                onClick={() => remove(domain)}
                className="px-1.5 py-1.5 text-muted-foreground/60 transition-colors hover:text-destructive"
                aria-label={`Remover ${domain.hostname}`}
              >
                <Trash2 className="size-3" aria-hidden />
              </button>
            </span>
          )
        })}
      </div>

      {adding && (
        <div className="mt-2.5 rounded-lg border border-border bg-background/40 p-3">
          <div className="flex gap-2">
            <input
              value={hostname}
              onChange={(event) => setHostname(event.target.value)}
              onKeyDown={(event) => {
                if (event.key !== 'Enter' || event.nativeEvent.isComposing || event.keyCode === 229) {
                  return
                }
                event.preventDefault()
                void addDomain()
              }}
              maxLength={253}
              placeholder="links.a-minha-marca.pt"
              aria-label="Novo domínio"
              className="min-w-0 flex-1 rounded-md border border-input bg-background/60 px-2.5 py-1.5 font-mono text-[11px] text-foreground placeholder:text-muted-foreground/50 focus:border-primary/60 focus:ring-2 focus:ring-primary/20 focus:outline-none"
            />
            <button
              type="button"
              onClick={() => void addDomain()}
              disabled={saving}
              aria-label="Registar domínio"
              className="flex items-center gap-1.5 rounded-md bg-primary px-2.5 py-1.5 text-[11px] font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {saving ? (
                <Loader2 className="size-3 animate-spin" aria-hidden />
              ) : (
                <Plus className="size-3" aria-hidden />
              )}
              adicionar
            </button>
          </div>

          <p className="mt-2 text-[10px] leading-relaxed text-muted-foreground">
            Na Vercel, em Settings → Domains, adiciona o mesmo host. No painel do teu domínio cria
            um registo CNAME{' '}
            <button
              type="button"
              onClick={() => copy(CNAME_TARGET)}
              className="inline-flex items-center gap-1 font-mono text-foreground transition-colors hover:text-accent"
            >
              {CNAME_TARGET}
              {copied === CNAME_TARGET ? (
                <Check className="size-2.5" aria-hidden />
              ) : (
                <Copy className="size-2.5" aria-hidden />
              )}
            </button>
            . Quando a Vercel validar, marca o domínio com o visto.
          </p>
        </div>
      )}

      {error && (
        <p className="mt-2 rounded-md border border-destructive/30 bg-destructive/10 px-2.5 py-1.5 text-[11px] text-destructive">
          {error}
        </p>
      )}
    </div>
  )
}
