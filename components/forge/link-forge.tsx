'use client'

import { DomainPicker } from '@/components/forge/domain-picker'
import type { LinkSummary } from '@/lib/spectre/types'
import { cn } from '@/lib/utils'
import {
  Activity,
  ArrowUpRight,
  Check,
  Copy,
  Link2,
  Loader2,
  Plus,
  Power,
  Zap,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import useSWR from 'swr'

interface LinkForgeProps {
  investigationId?: string
}

const fetcher = <T,>(url: string) =>
  fetch(url).then(async (res) => {
    if (!res.ok) throw new Error('Falha ao carregar os links.')
    return res.json() as Promise<T>
  })

export function LinkForge({ investigationId: initialInvestigationId }: LinkForgeProps) {
  const [investigationId, setInvestigationId] = useState(initialInvestigationId)
  const endpoint = investigationId
    ? `/api/links?investigationId=${encodeURIComponent(investigationId)}`
    : '/api/links'

  const { data, mutate } = useSWR<{ links: LinkSummary[] }>(
    endpoint,
    fetcher,
  )

  const [alias, setAlias] = useState('')
  const [host, setHost] = useState<string | null>(null)
  const [label, setLabel] = useState('')
  const [destination, setDestination] = useState('')
  const [previewTitle, setPreviewTitle] = useState('')
  const [previewDescription, setPreviewDescription] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [created, setCreated] = useState<LinkSummary | null>(null)
  const [copied, setCopied] = useState<string | null>(null)
  const [origin, setOrigin] = useState('')

  useEffect(() => {
    setOrigin(window.location.origin)
    const idFromUrl = new URLSearchParams(window.location.search).get('investigationId')
    if (idFromUrl) setInvestigationId(idFromUrl)
  }, [])

  async function copy(value: string) {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(value)
      setTimeout(() => setCopied(null), 1800)
    } catch {
      setError('Não foi possível copiar automaticamente.')
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    setSaving(true)
    setError(null)
    setCreated(null)

    try {
      const response = await fetch('/api/links', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          label,
          destination,
          slug: alias.trim().toLowerCase(),
          host,
          investigationId,
          redirectMode: 'direct',
          previewTitle,
          previewDescription,
          previewSource: (() => {
            try {
              return new URL(destination).hostname
            } catch {
              return ''
            }
          })(),
        }),
      })

      const payload = (await response.json()) as {
        ok: boolean
        error?: string
        link?: LinkSummary
      }

      if (!response.ok || !payload.ok || !payload.link) {
        const messages: Record<string, string> = {
          invalid_destination:
            'Destino inválido. Usa uma URL completa com https:// ou http://.',
          slug_taken:
            'Este alias já está em utilização. Escolhe outro.',
          reserved_slug:
            'Este alias está reservado pelo sistema.',
          invalid_slug:
            'Alias inválido. Usa letras minúsculas, números e hífen.',
          unknown_host:
            'O domínio escolhido já não está registado.',
        }

        setError(
          messages[payload.error ?? ''] ??
            'Não foi possível criar o link. Verifica os campos.',
        )
        return
      }

      setCreated({
        ...payload.link,
        hits: 0,
      })

      setLabel('')
      setDestination('')
      setPreviewTitle('')
      setPreviewDescription('')
      setAlias('')

      await mutate()
    } catch {
      setError('Falha de rede ao criar o link.')
    } finally {
      setSaving(false)
    }
  }

  async function toggleActive(link: LinkSummary) {
    try {
      const response = await fetch('/api/links', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: link.id,
          active: !link.active,
        }),
      })

      if (!response.ok) {
        setError('Não foi possível atualizar o estado do link.')
        return
      }

      await mutate()
    } catch {
      setError('Falha de rede ao atualizar o link.')
    }
  }

  const fallbackHost = origin.replace(/^https?:\/\//, '')
  const baseUrl = host ? `https://${host}` : origin

  const shareUrl = `${baseUrl}/l/${
    alias.trim().toLowerCase() || '…'
  }`

  const createdUrl = created
    ? `${created.host ? `https://${created.host}` : origin}/l/${
        created.slug ?? created.id
      }`
    : ''

  const links = data?.links ?? []

  return (
    <div className="grid gap-4 lg:grid-cols-5">

      {/* CRIAÇÃO DE LINKS */}

      <form
        onSubmit={handleSubmit}
        className="lg:col-span-3"
      >
        <div className="rounded-xl border border-border bg-card">

          <div className="border-b border-border px-4 py-3">
            <h2 className="text-sm font-medium text-foreground">
              Link Forge
            </h2>

            <p className="mt-0.5 text-xs text-muted-foreground">
              Configura, personaliza e gera links para as tuas operações.
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
                  Título da pré-visualização
                </span>
                <input
                  value={previewTitle}
                  onChange={(e) => setPreviewTitle(e.target.value)}
                  maxLength={160}
                  placeholder={label || 'Título que acompanha o link'}
                  className="mt-1.5 w-full rounded-lg border border-input bg-background/60 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-primary/60 focus:ring-2 focus:ring-primary/20 focus:outline-none"
                />
              </label>

              <label className="block">
                <span className="font-mono text-[10px] tracking-[0.14em] text-muted-foreground uppercase">
                  Descrição da pré-visualização
                </span>
                <input
                  value={previewDescription}
                  onChange={(e) => setPreviewDescription(e.target.value)}
                  maxLength={320}
                  placeholder="Descrição curta e transparente do destino"
                  className="mt-1.5 w-full rounded-lg border border-input bg-background/60 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-primary/60 focus:ring-2 focus:ring-primary/20 focus:outline-none"
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
                    placeholder="operacao-xyz"
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

                  <Zap
                    className="mt-0.5 size-3.5 shrink-0 text-primary"
                    aria-hidden
                  />

                  <span className="min-w-0">
                    <span className="block text-xs font-medium text-foreground">
                      Direto
                    </span>

                    <span className="mt-0.5 block text-[10px] leading-snug text-muted-foreground/70">
                      O visitante é encaminhado para o destino configurado.
                    </span>
                  </span>

                </div>
              </div>

            </div>

            <DomainPicker
              value={host}
              onChange={setHost}
              fallbackHost={fallbackHost}
            />

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

              {saving ? 'A gerar...' : 'Gerar link'}
            </button>

          </div>
        </div>
      </form>

      {/* PRÉ-VISUALIZAÇÃO */}

      <div className="space-y-4 lg:col-span-2">

        <div className="rounded-xl border border-border bg-card">

          <div className="border-b border-border px-4 py-3">
            <h2 className="text-sm font-medium text-foreground">
              Pré-visualização
            </h2>

            <p className="mt-0.5 text-xs text-muted-foreground">
              Metadados editáveis e endereço que será partilhado.
            </p>
          </div>

          <div className="space-y-4 p-4">
            <article className="rounded-xl border border-border bg-background/60 p-3">
              <p className="text-sm font-semibold text-foreground">{previewTitle || label || 'Título do link'}</p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{previewDescription || 'Descrição do destino'}</p>
              <p className="mt-2 truncate font-mono text-[10px] text-primary">{(() => { try { return new URL(destination).hostname } catch { return 'dominio.example' } })()}</p>
              <p className="mt-2 break-all font-mono text-[10px] text-muted-foreground">{destination || 'https://exemplo.org/caminho'}</p>
            </article>

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

              Copiar link
            </button>

          </div>
        </div>

        {/* LINK CRIADO */}

        {created && (
          <div className="animate-wraith-fade-up rounded-xl border border-accent/30 bg-accent/[0.06] p-4">

            <p className="flex items-center gap-1.5 font-mono text-[10px] tracking-[0.16em] text-accent uppercase">
              <Check className="size-3" aria-hidden />
              Link gerado com sucesso
            </p>

            <p className="mt-2 font-mono text-[11px] break-all text-foreground/90">
              {createdUrl}
            </p>

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

                Copiar
              </button>

              <a
                href={`/l/${created.slug ?? created.id}`}
                target="_blank"
                rel="noreferrer"
                className="flex flex-1 items-center justify-center gap-1.5 rounded-md border border-border bg-background/60 px-2.5 py-1.5 text-[11px] text-foreground transition-colors hover:border-primary/40"
              >
                <Link2 className="size-3" aria-hidden />
                Abrir
              </a>

            </div>
          </div>
        )}

      </div>

      {/* LINKS CRIADOS */}

      <div className="lg:col-span-5">

        <div className="mb-2 flex items-center justify-between">

          <h2 className="font-mono text-[10px] tracking-[0.18em] text-muted-foreground uppercase">
            Links em circulação
          </h2>

          <span className="font-mono text-[10px] text-muted-foreground">
            {links.length} total
          </span>

        </div>

        {links.length === 0 ? (

          <div className="rounded-xl border border-dashed border-border bg-card/40 px-6 py-10 text-center">
            <Link2 className="mx-auto mb-3 size-6 text-muted-foreground/50" />

            <p className="text-sm text-muted-foreground">
              Ainda não existem links criados.
            </p>

            <p className="mt-1 text-xs text-muted-foreground/60">
              Gera o teu primeiro link utilizando o formulário acima.
            </p>
          </div>

        ) : (

          <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">

            {links.map((link) => {
              const linkUrl = `${link.host ? `https://${link.host}` : origin}/l/${link.slug ?? link.id}`

              return (
                <li
                  key={link.id}
                  className="flex flex-wrap items-center gap-3 px-4 py-3 transition-colors hover:bg-white/[0.02]"
                >

                  <span
                    className={cn(
                      'size-1.5 shrink-0 rounded-full',
                      link.active
                        ? 'bg-accent'
                        : 'bg-muted-foreground/40',
                    )}
                    aria-hidden
                  />

                  <div className="min-w-0 flex-1">

                    <p className="truncate text-[13px] text-foreground">
                      {link.label}
                    </p>

                    <p className="truncate font-mono text-[10px] text-muted-foreground">
                      /l/{link.slug ?? link.id} → {link.destination}
                    </p>

                  </div>

                  <span className="rounded-full border border-border px-2 py-0.5 font-mono text-[10px] text-muted-foreground">
                    {link.hits} hits
                  </span>

                  <button
                    type="button"
                    onClick={() => copy(linkUrl)}
                    className="rounded-md border border-border p-1.5 text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
                    aria-label={`Copiar link ${link.label}`}
                  >
                    {copied === linkUrl ? (
                      <Check className="size-3.5" aria-hidden />
                    ) : (
                      <Copy className="size-3.5" aria-hidden />
                    )}
                  </button>

                  <a
                    href={`/links/${encodeURIComponent(link.id)}`}
                    className="rounded-md border border-border p-1.5 text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
                    aria-label={`Analisar ${link.label}`}
                    title="Analisar link"
                  >
                    <Activity className="size-3.5" aria-hidden />
                  </a>

                  <button
                    type="button"
                    onClick={() => toggleActive(link)}
                    className={cn(
                      'rounded-md border p-1.5 transition-colors',
                      link.active
                        ? 'border-border text-muted-foreground hover:border-destructive/40 hover:text-destructive'
                        : 'border-accent/40 text-accent',
                    )}
                    aria-label={
                      link.active
                        ? `Desativar ${link.label}`
                        : `Ativar ${link.label}`
                    }
                    title={link.active ? 'Desativar' : 'Ativar'}
                  >
                    <Power className="size-3.5" aria-hidden />
                  </button>

                  <a
                    href={linkUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-md border border-border p-1.5 text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
                    aria-label={`Abrir ${link.label}`}
                    title="Abrir link"
                  >
                    <ArrowUpRight className="size-3.5" aria-hidden />
                  </a>

                </li>
              )
            })}

          </ul>

        )}

      </div>
    </div>
  )
}
