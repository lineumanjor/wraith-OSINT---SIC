'use client'

import type { DomainSummary } from '@/lib/spectre/types'
import { cn } from '@/lib/utils'
import { Check, Copy, Globe, Loader2, Plus, ShieldCheck, Trash2 } from 'lucide-react'
import { useState } from 'react'
import useSWR from 'swr'

const fetcher = (url: string) =>
  fetch(url).then((res) => res.json() as Promise<{ domains: DomainSummary[] }>)

const CNAME_TARGET = 'cname.vercel-dns.com'

export function DomainManager() {
  const { data, mutate } = useSWR<{ domains: DomainSummary[] }>('/api/domains', fetcher)
  const [hostname, setHostname] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState<string | null>(null)

  const domains = data?.domains ?? []

  async function copy(value: string) {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(value)
      setTimeout(() => setCopied(null), 1800)
    } catch {
      setError('Não foi possível copiar automaticamente.')
    }
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
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
            : 'Domínio inválido. Use apenas o host, por exemplo links.a-minha-marca.pt.',
        )
        return
      }

      setHostname('')
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
    await fetch('/api/domains', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: domain.id }),
    })
    await mutate()
  }

  return (
    <div className="grid gap-4 lg:grid-cols-5">
      <div className="space-y-4 lg:col-span-3">
        <form onSubmit={handleSubmit}>
          <div className="rounded-xl border border-border bg-card">
            <div className="border-b border-border px-4 py-3">
              <h2 className="text-sm font-medium text-foreground">Registar domínio</h2>
              <p className="mt-0.5 text-xs text-muted-foreground">
                O host fica associado aos links gerados no Link Forge.
              </p>
            </div>

            <div className="space-y-4 p-4">
              <label className="block">
                <span className="font-mono text-[10px] tracking-[0.14em] text-muted-foreground uppercase">
                  Hostname
                </span>
                <input
                  value={hostname}
                  onChange={(event) => setHostname(event.target.value)}
                  required
                  maxLength={253}
                  placeholder="links.a-minha-marca.pt"
                  className="mt-1.5 w-full rounded-lg border border-input bg-background/60 px-3 py-2 font-mono text-xs text-foreground placeholder:text-muted-foreground/50 focus:border-primary/60 focus:ring-2 focus:ring-primary/20 focus:outline-none"
                />
              </label>

              {error && (
                <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={saving}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {saving ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                ) : (
                  <Plus className="size-4" aria-hidden />
                )}
                Registar domínio
              </button>
            </div>
          </div>
        </form>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <h2 className="font-mono text-[10px] tracking-[0.18em] text-muted-foreground uppercase">
              Domínios registados
            </h2>
            <span className="font-mono text-[10px] text-muted-foreground">{domains.length} total</span>
          </div>

          {domains.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border bg-card/40 px-6 py-10 text-center">
              <p className="text-sm text-muted-foreground">
                Nenhum domínio registado. Os links usam o domínio de desenvolvimento.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
              {domains.map((domain) => (
                <li key={domain.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                  <Globe
                    className={cn(
                      'size-3.5 shrink-0',
                      domain.verified ? 'text-accent' : 'text-muted-foreground/50',
                    )}
                    aria-hidden
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-mono text-xs text-foreground">{domain.hostname}</p>
                    <p className="mt-0.5 font-mono text-[10px] text-muted-foreground">
                      {domain.verified ? 'verificado · em uso' : 'pendente de DNS'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => toggleVerified(domain)}
                    className={cn(
                      'rounded-md border px-2 py-1 font-mono text-[10px] transition-colors',
                      domain.verified
                        ? 'border-accent/40 text-accent'
                        : 'border-border text-muted-foreground hover:border-primary/40 hover:text-foreground',
                    )}
                  >
                    {domain.verified ? 'verificado' : 'marcar verificado'}
                  </button>
                  <button
                    type="button"
                    onClick={() => copy(`https://${domain.hostname}`)}
                    className="rounded-md border border-border p-1.5 text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
                    aria-label={`Copiar ${domain.hostname}`}
                  >
                    {copied === `https://${domain.hostname}` ? (
                      <Check className="size-3.5" aria-hidden />
                    ) : (
                      <Copy className="size-3.5" aria-hidden />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(domain)}
                    className="rounded-md border border-border p-1.5 text-muted-foreground transition-colors hover:border-destructive/40 hover:text-destructive"
                    aria-label={`Remover ${domain.hostname}`}
                  >
                    <Trash2 className="size-3.5" aria-hidden />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <aside className="lg:col-span-2">
        <div className="rounded-xl border border-border bg-card">
          <div className="border-b border-border px-4 py-3">
            <h2 className="flex items-center gap-1.5 text-sm font-medium text-foreground">
              <ShieldCheck className="size-3.5 text-accent" aria-hidden />
              Configuração DNS
            </h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Dois passos, fora desta aplicação.
            </p>
          </div>

          <ol className="space-y-4 p-4">
            <li>
              <p className="font-mono text-[10px] tracking-[0.14em] text-muted-foreground uppercase">
                01 · Vercel
              </p>
              <p className="mt-1 text-xs leading-relaxed text-foreground/90">
                No projeto, em Settings → Domains, adiciona o mesmo hostname. A Vercel devolve o
                registo que espera receber.
              </p>
            </li>

            <li>
              <p className="font-mono text-[10px] tracking-[0.14em] text-muted-foreground uppercase">
                02 · Registo DNS
              </p>
              <p className="mt-1 text-xs leading-relaxed text-foreground/90">
                No painel do teu domínio, cria um registo CNAME:
              </p>
              <div className="mt-2 overflow-hidden rounded-lg border border-border bg-background/60">
                <div className="flex items-center justify-between gap-2 border-b border-border px-3 py-2">
                  <span className="font-mono text-[10px] text-muted-foreground">tipo</span>
                  <span className="font-mono text-[11px] text-foreground">CNAME</span>
                </div>
                <div className="flex items-center justify-between gap-2 border-b border-border px-3 py-2">
                  <span className="font-mono text-[10px] text-muted-foreground">nome</span>
                  <span className="font-mono text-[11px] text-foreground">links</span>
                </div>
                <div className="flex items-center justify-between gap-2 px-3 py-2">
                  <span className="font-mono text-[10px] text-muted-foreground">valor</span>
                  <button
                    type="button"
                    onClick={() => copy(CNAME_TARGET)}
                    className="flex items-center gap-1.5 font-mono text-[11px] text-foreground transition-colors hover:text-accent"
                  >
                    {CNAME_TARGET}
                    {copied === CNAME_TARGET ? (
                      <Check className="size-3" aria-hidden />
                    ) : (
                      <Copy className="size-3" aria-hidden />
                    )}
                  </button>
                </div>
              </div>
            </li>

            <li>
              <p className="font-mono text-[10px] tracking-[0.14em] text-muted-foreground uppercase">
                03 · Verificação
              </p>
              <p className="mt-1 text-xs leading-relaxed text-foreground/90">
                Quando a Vercel mostrar o domínio como válido, marca-o aqui como verificado. A
                partir daí o Link Forge passa a gerar links com esse host.
              </p>
            </li>
          </ol>

          <p className="border-t border-border px-4 py-3 text-[11px] leading-relaxed text-muted-foreground">
            A propagação de DNS pode levar alguns minutos. Enquanto o domínio não estiver
            verificado, os links continuam a usar o domínio de desenvolvimento.
          </p>
        </div>
      </aside>
    </div>
  )
}
