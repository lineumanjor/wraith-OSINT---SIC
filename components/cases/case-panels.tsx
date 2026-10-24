'use client'

import { Button } from '@/components/ui/button'
import { EmptyState, Field, Panel, inputClass } from '@/components/cases/ui'
import {
  ENTITY_KINDS,
  ENTITY_KIND_LABEL,
  type CaseDetail,
  type EntityKind,
} from '@/lib/cases/types'
import { cn } from '@/lib/utils'
import {
  CalendarClock,
  Crosshair,
  GitBranch,
  Loader2,
  MapPin,
  Plus,
  Trash2,
  Users,
} from 'lucide-react'
import { useMemo, useState } from 'react'

type PanelProps = {
  caseId: string
  detail: CaseDetail
  onChanged: () => Promise<unknown> | void
}

const KIND_TONE: Record<EntityKind, string> = {
  person: 'border-primary/40 text-primary',
  account: 'border-accent/40 text-accent',
  organization: 'border-[oklch(0.8_0.14_75)]/40 text-[oklch(0.8_0.14_75)]',
  location: 'border-[oklch(0.75_0.13_155)]/40 text-[oklch(0.75_0.13_155)]',
  phone: 'border-border text-muted-foreground',
  email: 'border-border text-muted-foreground',
  domain: 'border-border text-muted-foreground',
  document: 'border-border text-muted-foreground',
  vehicle: 'border-border text-muted-foreground',
  event: 'border-border text-muted-foreground',
}

async function postRecord(caseId: string, payload: Record<string, unknown>) {
  const res = await fetch(`/api/cases/${caseId}/records`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error ?? 'falha ao guardar')
  return data
}

async function deleteRecord(caseId: string, recordType: string, recordId: string) {
  const res = await fetch(
    `/api/cases/${caseId}/records?recordType=${recordType}&recordId=${encodeURIComponent(recordId)}`,
    { method: 'DELETE' },
  )
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.error ?? 'falha ao remover')
  }
}

export function EntityPanel({ caseId, detail, onChanged }: PanelProps) {
  const [kind, setKind] = useState<EntityKind>('person')
  const [label, setLabel] = useState('')
  const [value, setValue] = useState('')
  const [notes, setNotes] = useState('')
  const [latitude, setLatitude] = useState('')
  const [longitude, setLongitude] = useState('')
  const [confidence, setConfidence] = useState(60)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    setError(null)
    setBusy(true)
    try {
      await postRecord(caseId, {
        recordType: 'entity',
        kind,
        label,
        value,
        notes,
        latitude: latitude || null,
        longitude: longitude || null,
        confidence,
      })
      setLabel('')
      setValue('')
      setNotes('')
      setLatitude('')
      setLongitude('')
      setConfidence(60)
      await onChanged()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'erro inesperado')
    } finally {
      setBusy(false)
    }
  }

  async function remove(id: string) {
    if (!window.confirm('Remover esta entidade do dossiê?')) return
    await deleteRecord(caseId, 'entity', id)
    await onChanged()
  }

  return (
    <div className="grid gap-4 lg:grid-cols-12">
      <Panel
        title="Registar entidade"
        description="Pessoas, contas, organizações, locais, documentos — o que compõe o dossiê."
        icon={Users}
        className="lg:col-span-5"
      >
        <form onSubmit={submit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Tipo" htmlFor="entity-kind">
              <select
                id="entity-kind"
                value={kind}
                onChange={(e) => setKind(e.target.value as EntityKind)}
                className={inputClass}
              >
                {ENTITY_KINDS.map((item) => (
                  <option key={item} value={item}>
                    {ENTITY_KIND_LABEL[item]}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Confiança" htmlFor="entity-confidence">
              <div className="flex h-[38px] items-center gap-2">
                <input
                  id="entity-confidence"
                  type="range"
                  min={0}
                  max={100}
                  step={5}
                  value={confidence}
                  onChange={(e) => setConfidence(Number(e.target.value))}
                  className="h-1 w-full accent-[oklch(0.72_0.15_292)]"
                />
                <span className="w-8 shrink-0 font-mono text-[11px] text-muted-foreground">
                  {confidence}
                </span>
              </div>
            </Field>
          </div>

          <Field label="Rótulo" htmlFor="entity-label">
            <input
              id="entity-label"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Nome, handle ou designação"
              required
              minLength={2}
              maxLength={200}
              className={inputClass}
            />
          </Field>

          <Field label="Identificador" htmlFor="entity-value" hint="Telefone, e-mail, handle, matrícula, URL…">
            <input
              id="entity-value"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="+351 900 000 000"
              maxLength={500}
              className={inputClass}
            />
          </Field>

          <Field label="Notas" htmlFor="entity-notes">
            <textarea
              id="entity-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              maxLength={2000}
              placeholder="Contexto, proveniência, o que confirma ou contradiz…"
              className={cn(inputClass, 'resize-y')}
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Latitude" htmlFor="entity-lat">
              <input
                id="entity-lat"
                value={latitude}
                onChange={(e) => setLatitude(e.target.value)}
                placeholder="38.7223"
                inputMode="decimal"
                className={inputClass}
              />
            </Field>
            <Field label="Longitude" htmlFor="entity-lng">
              <input
                id="entity-lng"
                value={longitude}
                onChange={(e) => setLongitude(e.target.value)}
                placeholder="-9.1393"
                inputMode="decimal"
                className={inputClass}
              />
            </Field>
          </div>

          {error && (
            <p role="alert" className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
              {error}
            </p>
          )}

          <Button type="submit" disabled={busy} className="w-full">
            {busy ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Plus className="size-4" aria-hidden />}
            Adicionar entidade
          </Button>
        </form>
      </Panel>

      <Panel
        title={`Entidades (${detail.entities.length})`}
        description="Coordenadas alimentam o mapa do dossiê."
        icon={Crosshair}
        className="lg:col-span-7"
      >
        {detail.entities.length === 0 ? (
          <EmptyState>Sem entidades registadas.</EmptyState>
        ) : (
          <ul className="space-y-2">
            {detail.entities.map((entity) => (
              <li
                key={entity.id}
                className="group rounded-lg border border-border bg-background/40 p-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={cn(
                          'rounded-full border px-2 py-0.5 font-mono text-[10px] tracking-wide uppercase',
                          KIND_TONE[entity.kind],
                        )}
                      >
                        {ENTITY_KIND_LABEL[entity.kind]}
                      </span>
                      <span className="truncate text-sm font-medium text-foreground">
                        {entity.label}
                      </span>
                    </div>
                    {entity.value && (
                      <p className="mt-1 font-mono text-[11px] break-all text-accent">{entity.value}</p>
                    )}
                    {entity.notes && (
                      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{entity.notes}</p>
                    )}
                    <div className="mt-1.5 flex flex-wrap items-center gap-3 font-mono text-[10px] text-muted-foreground">
                      <span>confiança {entity.confidence}%</span>
                      {entity.latitude != null && entity.longitude != null && (
                        <span className="flex items-center gap-1">
                          <MapPin className="size-3" aria-hidden />
                          {entity.latitude.toFixed(4)}, {entity.longitude.toFixed(4)}
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => remove(entity.id)}
                    aria-label={`Remover ${entity.label}`}
                    className="shrink-0 rounded-md p-1.5 text-muted-foreground opacity-0 transition-colors group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive focus-visible:opacity-100"
                  >
                    <Trash2 className="size-3.5" aria-hidden />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  )
}

export function FactPanel({ caseId, detail, onChanged }: PanelProps) {
  const [title, setTitle] = useState('')
  const [detailText, setDetailText] = useState('')
  const [source, setSource] = useState('')
  const [occurredAt, setOccurredAt] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    setError(null)
    setBusy(true)
    try {
      await postRecord(caseId, {
        recordType: 'fact',
        title,
        detail: detailText,
        source,
        occurredAt: occurredAt ? new Date(occurredAt).toISOString() : null,
      })
      setTitle('')
      setDetailText('')
      setSource('')
      setOccurredAt('')
      await onChanged()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'erro inesperado')
    } finally {
      setBusy(false)
    }
  }

  async function remove(id: string) {
    if (!window.confirm('Remover este facto do dossiê?')) return
    await deleteRecord(caseId, 'fact', id)
    await onChanged()
  }

  return (
    <div className="grid gap-4 lg:grid-cols-12">
      <Panel
        title="Registar facto"
        description="Observações datadas, com proveniência. A cronologia constrói-se sozinha."
        icon={CalendarClock}
        className="lg:col-span-5"
      >
        <form onSubmit={submit} className="space-y-3">
          <Field label="Título" htmlFor="fact-title">
            <input
              id="fact-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Conta criada com o mesmo handle"
              required
              minLength={3}
              maxLength={200}
              className={inputClass}
            />
          </Field>

          <Field label="Detalhe" htmlFor="fact-detail">
            <textarea
              id="fact-detail"
              value={detailText}
              onChange={(e) => setDetailText(e.target.value)}
              rows={3}
              maxLength={4000}
              placeholder="O que foi observado, como, e o que implica…"
              className={cn(inputClass, 'resize-y')}
            />
          </Field>

          <Field label="Fonte" htmlFor="fact-source" hint="URL, documento, testemunho, registo público.">
            <input
              id="fact-source"
              value={source}
              onChange={(e) => setSource(e.target.value)}
              placeholder="https://…"
              maxLength={500}
              className={inputClass}
            />
          </Field>

          <Field label="Quando ocorreu" htmlFor="fact-when">
            <input
              id="fact-when"
              type="datetime-local"
              value={occurredAt}
              onChange={(e) => setOccurredAt(e.target.value)}
              className={inputClass}
            />
          </Field>

          {error && (
            <p role="alert" className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
              {error}
            </p>
          )}

          <Button type="submit" disabled={busy} className="w-full">
            {busy ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Plus className="size-4" aria-hidden />}
            Adicionar facto
          </Button>
        </form>
      </Panel>

      <Panel
        title={`Cronologia (${detail.facts.length})`}
        description="Ordenada do registo mais recente para o mais antigo."
        icon={CalendarClock}
        className="lg:col-span-7"
      >
        {detail.facts.length === 0 ? (
          <EmptyState>Sem factos registados.</EmptyState>
        ) : (
          <ol className="relative space-y-3 border-l border-border pl-4">
            {detail.facts.map((fact) => (
              <li key={fact.id} className="group relative">
                <span
                  className="absolute top-1.5 -left-[21px] size-2 rounded-full border border-primary/60 bg-background"
                  aria-hidden
                />
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-mono text-[10px] tracking-wide text-muted-foreground uppercase">
                      {fact.occurredAt
                        ? new Date(fact.occurredAt).toLocaleString('pt-PT', {
                            dateStyle: 'medium',
                            timeStyle: 'short',
                          })
                        : `registado ${new Date(fact.createdAt).toLocaleDateString('pt-PT')}`}
                    </p>
                    <p className="mt-0.5 text-sm font-medium text-foreground">{fact.title}</p>
                    {fact.detail && (
                      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{fact.detail}</p>
                    )}
                    {fact.source && (
                      <p className="mt-1 font-mono text-[10px] break-all text-accent">{fact.source}</p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => remove(fact.id)}
                    aria-label={`Remover facto ${fact.title}`}
                    className="shrink-0 rounded-md p-1.5 text-muted-foreground opacity-0 transition-colors group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive focus-visible:opacity-100"
                  >
                    <Trash2 className="size-3.5" aria-hidden />
                  </button>
                </div>
              </li>
            ))}
          </ol>
        )}
      </Panel>
    </div>
  )
}

export function LinkPanel({ caseId, detail, onChanged }: PanelProps) {
  const [fromEntity, setFromEntity] = useState('')
  const [toEntity, setToEntity] = useState('')
  const [relation, setRelation] = useState('')
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const nodes = useMemo(
    () => [
      ...detail.entities.map((entity) => ({
        id: entity.id,
        label: entity.label,
        type: 'entidade' as const,
      })),
      ...detail.facts.map((fact) => ({ id: fact.id, label: fact.title, type: 'facto' as const })),
    ],
    [detail.entities, detail.facts],
  )

  const labelOf = useMemo(() => {
    const map = new Map(nodes.map((node) => [node.id, node]))
    return (id: string) => map.get(id)
  }, [nodes])

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    setError(null)
    setBusy(true)
    try {
      await postRecord(caseId, { recordType: 'link', fromEntity, toEntity, relation, note })
      setFromEntity('')
      setToEntity('')
      setRelation('')
      setNote('')
      await onChanged()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'erro inesperado')
    } finally {
      setBusy(false)
    }
  }

  async function remove(id: string) {
    if (!window.confirm('Remover este vínculo?')) return
    await deleteRecord(caseId, 'link', id)
    await onChanged()
  }

  return (
    <div className="grid gap-4 lg:grid-cols-12">
      <Panel
        title="Criar vínculo"
        description="Ligue entidades e factos entre si. É assim que o dossiê ganha estrutura."
        icon={GitBranch}
        className="lg:col-span-5"
      >
        {nodes.length < 2 ? (
          <EmptyState>
            Registe pelo menos duas entidades ou factos para começar a ligar.
          </EmptyState>
        ) : (
          <form onSubmit={submit} className="space-y-3">
            <Field label="Origem" htmlFor="link-from">
              <select
                id="link-from"
                value={fromEntity}
                onChange={(e) => setFromEntity(e.target.value)}
                required
                className={inputClass}
              >
                <option value="">Selecionar…</option>
                {nodes.map((node) => (
                  <option key={node.id} value={node.id}>
                    [{node.type}] {node.label}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Relação" htmlFor="link-relation" hint="Ex.: usa o telefone de, esteve em, confirma, contradiz.">
              <input
                id="link-relation"
                value={relation}
                onChange={(e) => setRelation(e.target.value)}
                placeholder="usa o telefone de"
                required
                minLength={2}
                maxLength={120}
                className={inputClass}
              />
            </Field>

            <Field label="Destino" htmlFor="link-to">
              <select
                id="link-to"
                value={toEntity}
                onChange={(e) => setToEntity(e.target.value)}
                required
                className={inputClass}
              >
                <option value="">Selecionar…</option>
                {nodes.map((node) => (
                  <option key={node.id} value={node.id}>
                    [{node.type}] {node.label}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Nota" htmlFor="link-note">
              <textarea
                id="link-note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={2}
                maxLength={1000}
                placeholder="Base do vínculo, grau de certeza…"
                className={cn(inputClass, 'resize-y')}
              />
            </Field>

            {error && (
              <p role="alert" className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                {error}
              </p>
            )}

            <Button type="submit" disabled={busy} className="w-full">
              {busy ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <GitBranch className="size-4" aria-hidden />}
              Ligar
            </Button>
          </form>
        )}
      </Panel>

      <Panel
        title={`Vínculos (${detail.links.length})`}
        description="Relações declaradas entre os elementos do dossiê."
        icon={GitBranch}
        className="lg:col-span-7"
      >
        {detail.links.length === 0 ? (
          <EmptyState>Sem vínculos registados.</EmptyState>
        ) : (
          <ul className="space-y-2">
            {detail.links.map((link) => {
              const from = labelOf(link.fromEntity)
              const to = labelOf(link.toEntity)
              return (
                <li
                  key={link.id}
                  className="group rounded-lg border border-border bg-background/40 p-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="flex flex-wrap items-center gap-1.5 text-sm">
                        <span className="font-medium text-foreground">
                          {from?.label ?? 'elemento removido'}
                        </span>
                        <span className="rounded border border-primary/30 bg-primary/10 px-1.5 py-0.5 font-mono text-[10px] text-primary">
                          {link.relation}
                        </span>
                        <span className="font-medium text-foreground">
                          {to?.label ?? 'elemento removido'}
                        </span>
                      </p>
                      {link.note && (
                        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{link.note}</p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => remove(link.id)}
                      aria-label="Remover vínculo"
                      className="shrink-0 rounded-md p-1.5 text-muted-foreground opacity-0 transition-colors group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive focus-visible:opacity-100"
                    >
                      <Trash2 className="size-3.5" aria-hidden />
                    </button>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </Panel>
    </div>
  )
}
