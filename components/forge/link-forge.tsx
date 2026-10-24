'use client'

import { GhostPreview, PREVIEW_STYLES } from '@/components/ghost-preview'
import type { LinkSummary, PreviewStyle } from '@/lib/spectre/types'
import { cn } from '@/lib/utils'
import { Check, Copy, Link2, Loader2, Plus, Power } from 'lucide-react'
import { useState } from 'react'
import useSWR from 'swr'

const fetcher = (url: string) => fetch(url).then((res) => res.json() as Promise<{ links: LinkSummary[] }>)

const DEFAULTS: Record<PreviewStyle, { title: string; description: string; source: string }> = {
  messaging: {
    title: 'Ficha cadastral — lote 04',
    description: 'Documento compartilhado para conferência. Toque para abrir.',
    source: 'arquivos.interno-lab.net',
  },
  cloud: {
    title: 'contrato-fornecimento-2026.pdf',
    description: 'PDF · 1,8 MB · compartilhado com você',
    source: 'drive.interno-lab.net',
  },
  marketplace: {
    title: 'Componente usinado em alumínio 6061 — sob medida',
    description: 'Pedido mínimo 500 unidades',
    source: 'supply.interno-lab.net',
  },
}

export function LinkForge() {
  const { data, mutate } = useSWR<{ links: LinkSummary[] }>('/api/links', fetcher)
  const [label, setLabel] = useState('')
  const [destination, setDestination] = useState('')
  const [style, setStyle] = useState<PreviewStyle>('messaging')
  const [title, setTitle] = useState(DEFAULTS.messaging.title)
  const [description, setDescription] = useState(DEFAULTS.messaging.description)
  const [source, setSource] = useState(DEFAULTS.messaging.source)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [created, setCreated] = useState<LinkSummary | null>(null)
  const [copied, setCopied] = useState<string | null>(null)

  function changeStyle(next: PreviewStyle) {
    setStyle(next)
    setTitle(DEFAULTS[next].title)
    setDescription(DEFAULTS[next].description)
    setSource(DEFAULTS[next].source)
  }

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
          previewStyle: style,
          previewTitle: title,
          previewDescription: description,
          previewSource: source,
        }),
      })

      const payload = (await response.json()) as { ok: boolean; error?: string; link?: LinkSummary }
      if (!response.ok || !payload.ok) {
        setError(
          payload.error === 'invalid_destination'
            ? 'Destino inválido. Use uma URL completa com http:// ou https://.'
            : 'Não foi possível criar o link. Verifique os campos.',
        )
        return
      }

      setCreated({ ...payload.link!, hits: 0 })
      setLabel('')
      setDestination('')
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

  const origin = typeof window === 'undefined' ? '' : window.location.origin
  const links = data?.links ?? []

  return (
    <div className="grid gap-4 lg:grid-cols-5">
      <form onSubmit={handleSubmit} className="lg:col-span-3">
        <div className="rounded-xl border border-border bg-card">
          <div className="border-b border-border px-4 py-3">
            <h2 className="text-sm font-medium text-foreground">Parâmetros do link</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              O destino só é revelado após a captura do perfil técnico.
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

            <fieldset>
              <legend className="font-mono text-[10px] tracking-[0.14em] text-muted-foreground uppercase">
                Estilo do Ghost Preview
              </legend>
              <div className="mt-1.5 grid gap-2 sm:grid-cols-3">
                {PREVIEW_STYLES.map((option) => {
                  const active = style === option.value
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => changeStyle(option.value)}
                      aria-pressed={active}
                      className={cn(
                        'rounded-lg border p-2.5 text-left transition-colors',
                        active
                          ? 'border-primary/60 bg-primary/10'
                          : 'border-border bg-background/40 hover:border-primary/30',
                      )}
                    >
                      <span
                        className={cn(
                          'block text-xs font-medium',
                          active ? 'text-foreground' : 'text-muted-foreground',
                        )}
                      >
                        {option.label}
                      </span>
                      <span className="mt-0.5 block text-[10px] leading-snug text-muted-foreground/70">
                        {option.hint}
                      </span>
                    </button>
                  )
                })}
              </div>
            </fieldset>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block sm:col-span-2">
                <span className="font-mono text-[10px] tracking-[0.14em] text-muted-foreground uppercase">
                  Título do preview
                </span>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  maxLength={160}
                  className="mt-1.5 w-full rounded-lg border border-input bg-background/60 px-3 py-2 text-sm text-foreground focus:border-primary/60 focus:ring-2 focus:ring-primary/20 focus:outline-none"
                />
              </label>

              <label className="block">
                <span className="font-mono text-[10px] tracking-[0.14em] text-muted-foreground uppercase">
                  Descrição
                </span>
                <input
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  maxLength={320}
                  className="mt-1.5 w-full rounded-lg border border-input bg-background/60 px-3 py-2 text-sm text-foreground focus:border-primary/60 focus:ring-2 focus:ring-primary/20 focus:outline-none"
                />
              </label>

              <label className="block">
                <span className="font-mono text-[10px] tracking-[0.14em] text-muted-foreground uppercase">
                  Domínio exibido
                </span>
                <input
                  value={source}
                  onChange={(e) => setSource(e.target.value)}
                  maxLength={120}
                  className="mt-1.5 w-full rounded-lg border border-input bg-background/60 px-3 py-2 font-mono text-xs text-foreground focus:border-primary/60 focus:ring-2 focus:ring-primary/20 focus:outline-none"
                />
              </label>
            </div>

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
            <h2 className="text-sm font-medium text-foreground">Pré-visualização</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Como o cartão aparece antes do clique.
            </p>
          </div>
          <div className="grid-field flex min-h-56 items-center justify-center p-5">
            <GhostPreview
              style={style}
              title={title || 'Título do preview'}
              description={description}
              source={source}
            />
          </div>
        </div>

        {created && (
          <div className="animate-wraith-fade-up rounded-xl border border-accent/30 bg-accent/[0.06] p-4">
            <p className="flex items-center gap-1.5 font-mono text-[10px] tracking-[0.16em] text-accent uppercase">
              <Check className="size-3" aria-hidden />
              Link gerado
            </p>
            <p className="mt-2 font-mono text-[11px] break-all text-foreground/90">
              {origin}/l/{created.id}
            </p>
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={() => copy(`${origin}/l/${created.id}`)}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-md border border-border bg-background/60 px-2.5 py-1.5 text-[11px] text-foreground transition-colors hover:border-primary/40"
              >
                {copied === `${origin}/l/${created.id}` ? (
                  <Check className="size-3" aria-hidden />
                ) : (
                  <Copy className="size-3" aria-hidden />
                )}
                copiar
              </button>
              <a
                href={`/l/${created.id}`}
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
                    /l/{link.id} → {link.destination}
                  </p>
                </div>
                <span className="rounded-full border border-border px-2 py-0.5 font-mono text-[10px] text-muted-foreground">
                  {link.hits} hits
                </span>
                <button
                  type="button"
                  onClick={() => copy(`${origin}/l/${link.id}`)}
                  className="rounded-md border border-border p-1.5 text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
                  aria-label={`Copiar link ${link.label}`}
                >
                  {copied === `${origin}/l/${link.id}` ? (
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
