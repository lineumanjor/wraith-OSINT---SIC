'use client'

import { DomainPicker } from '@/components/forge/domain-picker'
import type { LinkSummary } from '@/lib/spectre/types'
import { cn } from '@/lib/utils'
import { Check, Copy, Link2, Loader2, Plus, Power, Zap } from 'lucide-react'
import { useEffect, useState } from 'react'
import useSWR from 'swr'

const fetcher = <T,>(url: string) => fetch(url).then((res) => res.json() as Promise<T>)

export function LinkForge() {
  const { data, mutate } = useSWR<{ links: LinkSummary[] }>('/api/links', fetcher)
  const [alias, setAlias] = useState('')
  const [host, setHost] = useState<string | null>(null)
  const [label, setLabel] = useState('')
  const [destination, setDestination] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [created, setCreated] = useState<LinkSummary | null>(null)
  const [copied, setCopied] = useState<string | null>(null)

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
    setCreated(null)

    try {
      const response = await fetch('/api/links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          label,
          destination,
          slug: alias,
          host,
        }),
      })

      const payload = (await response.json()) as { ok: boolean; error?: string; link?: LinkSummary }
      if (!response.ok || !payload.ok) {
        setError(
          payload.error === 'invalid_destination'
            ? 'Destino inválido. Use uma URL completa com http:// ou https://.'
            : payload.error === 'slug_taken'
              ? 'Este alias já está em uso. Escolhe outro.'
              : payload.error === 'reserved_slug'
                ? 'Este alias é reservado pelo sistema. Escolhe outro.'
                : payload.error === 'invalid_slug'
                  ? 'Alias inválido. Usa letras minúsculas, números e hífen, com 2 a 63 caracteres.'
                  : payload.error === 'unknown_host'
                    ? 'O domínio escolhido já não está registado. Escolhe outro.'
                    : 'Não foi possível criar o link. Verifique os campos.',
        )
        return
      }

      setCreated({ ...payload.link!, hits: 0 })
      setLabel('')
      setDestination('')
      setAlias('')
      await mutate()
    } catch {
      setError('Falha de rede ao criar o link.')
    } finally {
      setSaving(false)
    }
  }

  async function toggleActive(link: LinkSummary) {
    await fetch('/api/links', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: link.id, active: !link.active }),
    })
    await mutate()
  }

  const [origin, setOrigin] = useState('')

  useEffect(() => {
    setOrigin(window.location.origin)
  }, [])

  const fallbackHost = origin.replace(/^https?:\/\//, '')
  const baseUrl = host ? `https://${host}` : origin
  const shareUrl = `${baseUrl}/l/${alias.trim().toLowerCase() || '…'}`
  const createdUrl = created
    ? `${created.host ? `https://${created.host}` : origin}/l/${created.slug ?? created.id}`
    : ''
  const links = data?.links ?? []

  return (
    <div className="grid gap-4 lg:grid-cols-5">
      <form onSubmit={handleSubmit} className="lg:col-span-3">
        <div className="rounded-xl border border-border bg-card">
          <div className="border-b border-border px-4 py-3">
            <h2 className="text-sm font-medium text-foreground">Parâmetros do link</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              O clique salta direto para o destino. A captura corre no servidor.
            </p>
          </div>

          <div className="space-y-4 p-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="font-mono text-[10px] tracking-[0.14em] text-muted-foreground uppercase">
                  Rótulo interno
                </span>
                <input
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  required
                  maxLength={120}
                  placeholder="Operação Vértice — onda 1"
                  className="mt-1.5 w-full rounded-lg border border-input bg-background/60 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-primary/60 focus:ring-2 focus:ring-primary/20 focus:outline-none"
                />
              </label>

              <label className="block">
                <span className="font-mono text-[10px] tracking-[0.14em] text-muted-foreground uppercase">
                  Destino final
                </span>
                <input
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  required
                  type="url"
                  placeholder="https://exemplo.org/documento"
                  className="mt-1.5 w-full rounded-lg border border-input bg-background/60 px-3 py-2 font-mono text-xs text-foreground placeholder:text-muted-foreground/50 focus:border-primary/60 focus:ring-2 focus:ring-primary/20 focus:outline-none"
                />
              </label>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="font-mono text-[10px] tracking-[0.14em] text-muted-foreground uppercase">
                  Alias personalizado
                </span>
                <div className="mt-1.5 flex items-stretch overflow-hidden rounded-lg border border-input bg-background/60 focus-within:border-primary/60 focus-within:ring-2 focus-within:ring-primary/20">
                  <span className="flex items-center border-r border-border px-2.5 font-mono text-[11px] text-muted-foreground">
                    /l/
                  </span>
                  <input
                    value={alias}
                    onChange={(e) => setAlias(e.target.value)}
                    maxLength={63}
                    placeholder="promocao-xyz"
                    aria-label="Alias personalizado"
                    className="min-w-0 flex-1 bg-transparent px-2.5 py-2 font-mono text-xs text-foreground placeholder:text-muted-foreground/50 focus:outline-none"
                  />
                </div>
                <span className="mt-1 block truncate font-mono text-[10px] text-muted-foreground/70">
                  {baseUrl || 'wraith.link'}/l/{alias.trim().toLowerCase() || '…'}
                </span>
              </label>

              <div>
                <span className="font-mono text-[10px] tracking-[0.14em] text-muted-foreground uppercase">
                  Redirecionamento
                </span>
                <div className="mt-1.5 flex items-start gap-2 rounded-lg border border-primary/30 bg-primary/[0.06] p-2.5">
                  <Zap className="mt-0.5 size-3.5 shrink-0 text-primary" aria-hidden />
                  <span className="min-w-0">
                    <span className="block text-xs font-medium text-foreground">Imediato</span>
                    <span className="mt-0.5 block text-[10px] leading-snug text-muted-foreground/70">
                      O clique salta direto para o destino. A telemetria é registada no servidor
                      antes do salto, sem página intermédia.
                    </span>
                  </span>
                </div>
              </div>
            </div>

            <DomainPicker value={host} onChange={setHost} fallbackHost={fallbackHost} />


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
              Gerar link rastreável
            </button>
          </div>
        </div>
      </form>

      <div className="space-y-4 lg:col-span-2">
        <div className="rounded-xl border border-border bg-card">
          <div className="border-b border-border px-4 py-3">
            <h2 className="text-sm font-medium text-foreground">Link que vais partilhar</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              É este o endereço que recebe quem clicar.
            </p>
          </div>
          <div className="p-4">
            <p className="font-mono text-[13px] leading-relaxed break-all text-foreground">
              {shareUrl}
            </p>
            <button
              type="button"
              onClick={() => copy(shareUrl)}
              className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-md border border-border bg-background/60 px-2.5 py-1.5 text-[11px] text-foreground transition-colors hover:border-primary/40"
            >
              {copied === shareUrl ? (
                <Check className="size-3" aria-hidden />
              ) : (
                <Copy className="size-3" aria-hidden />
              )}
              copiar link
            </button>
          </div>
        </div>

        {created && (
          <div className="animate-wraith-fade-up rounded-xl border border-accent/30 bg-accent/[0.06] p-4">
            <p className="flex items-center gap-1.5 font-mono text-[10px] tracking-[0.16em] text-accent uppercase">
              <Check className="size-3" aria-hidden />
              Link gerado
            </p>
            <p className="mt-2 font-mono text-[11px] break-all text-foreground/90">{createdUrl}</p>
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={() => copy(createdUrl)}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-md border border-border bg-background/60 px-2.5 py-1.5 text-[11px] text-foreground transition-colors hover:border-primary/40"
              >
                {copied === createdUrl ? (
                  <Check className="size-3" aria-hidden />
                ) : (
                  <Copy className="size-3" aria-hidden />
                )}
                copiar
              </button>
              <a
                href={`/l/${created.slug ?? created.id}`}
                target="_blank"
                rel="noreferrer"
                className="flex flex-1 items-center justify-center gap-1.5 rounded-md border border-border bg-background/60 px-2.5 py-1.5 text-[11px] text-foreground transition-colors hover:border-primary/40"
              >
                <Link2 className="size-3" aria-hidden />
                abrir
              </a>
            </div>
          </div>
        )}
      </div>

      <div className="lg:col-span-5">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="font-mono text-[10px] tracking-[0.18em] text-muted-foreground uppercase">
            Links em circulação
          </h2>
          <span className="font-mono text-[10px] text-muted-foreground">{links.length} total</span>
        </div>

        {links.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-card/40 px-6 py-10 text-center">
            <p className="text-sm text-muted-foreground">
              Nenhum link criado ainda. Gere o primeiro acima.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
            {links.map((link) => (
              <li
                key={link.id}
                className="flex flex-wrap items-center gap-3 px-4 py-3 transition-colors hover:bg-white/[0.02]"
              >
                <span
                  className={cn(
                    'size-1.5 shrink-0 rounded-full',
                    link.active ? 'bg-accent' : 'bg-muted-foreground/40',
                  )}
                  aria-hidden
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] text-foreground">{link.label}</p>
                  <p className="truncate font-mono text-[10px] text-muted-foreground">
                    /l/{link.slug ?? link.id} → {link.destination}
                  </p>
                </div>
                <span className="rounded-full border border-border px-2 py-0.5 font-mono text-[10px] text-muted-foreground">
                  {link.hits} hits
                </span>
                <button
                  type="button"
                  onClick={() => copy(`${baseUrl}/l/${link.slug ?? link.id}`)}
                  className="rounded-md border border-border p-1.5 text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
                  aria-label={`Copiar link ${link.label}`}
                >
                  {copied === `${baseUrl}/l/${link.slug ?? link.id}` ? (
                    <Check className="size-3.5" aria-hidden />
                  ) : (
                    <Copy className="size-3.5" aria-hidden />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => toggleActive(link)}
                  className={cn(
                    'rounded-md border p-1.5 transition-colors',
                    link.active
                      ? 'border-border text-muted-foreground hover:border-destructive/40 hover:text-destructive'
                      : 'border-accent/40 text-accent',
                  )}
                  aria-label={link.active ? `Desativar ${link.label}` : `Ativar ${link.label}`}
                >
                  <Power className="size-3.5" aria-hidden />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
