'use client'

import { DomainPicker } from '@/components/forge/domain-picker'
import type { LinkSummary } from '@/lib/spectre/types'
import { cn } from '@/lib/utils'
import { Check, Copy, Link2, Loader2, Plus, Power, Zap } from 'lucide-react'
import { useEffect, useState } from 'react'
import useSWR from 'swr'

const fetcher = <T,>(url: string) =>
  fetch(url).then((res) => {
    if (!res.ok) throw new Error('Falha ao carregar os links.')
    return res.json() as Promise<T>
  })

type LinkForgeProps = {
  investigationId?: string
}

export function LinkForge({ investigationId }: LinkForgeProps) {
  const apiUrl = investigationId
    ? `/api/links?investigationId=${encodeURIComponent(investigationId)}`
    : '/api/links'

  const { data, mutate } = useSWR<{ links: LinkSummary[] }>(
    apiUrl,
    fetcher,
  )

  const [alias, setAlias] = useState('')
  const [host, setHost] = useState<string | null>(null)
  const [label, setLabel] = useState('')
  const [destination, setDestination] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [created, setCreated] = useState<LinkSummary | null>(null)
  const [copied, setCopied] = useState<string | null>(null)
  const [origin, setOrigin] = useState('')

  useEffect(() => {
    setOrigin(window.location.origin)
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
          investigationId: investigationId ?? null,
        }),
      })

      const payload = (await response.json()) as {
        ok: boolean
        error?: string
        link?: LinkSummary
      }

      if (!response.ok || !payload.ok || !payload.link) {
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
                    : payload.error === 'investigation_not_found'
                      ? 'A investigação selecionada não foi encontrada.'
                      : 'Não foi possível criar o link. Verifique os campos.',
        )
        return
      }

      setCreated({ ...payload.link, hits: 0 })
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
    try {
      const response = await fetch('/api/links', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: link.id,
          active: !link.active,
        }),
      })

      if (!response.ok) {
        setError('Não foi possível alterar o estado deste link.')
        return
      }

      setError(null)
      await mutate()
    } catch {
      setError('Falha de rede ao alterar o estado do link.')
    }
  }

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
            <h2 className="text-sm font-medium text-foreground">
              Parâmetros do link
            </h2>

            <p className="mt-0.5 text-xs text-muted-foreground">
              {investigationId
                ? 'Este link ficará associado à investigação actual.'
                : 'Criação e gestão de links do WRAITH.'}
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
                    value