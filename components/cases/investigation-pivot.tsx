'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ENTITY_KINDS, ENTITY_KIND_LABEL, type CaseDetail, type Entity, type EntityKind, type EntityLink, type InvestigationSummary } from '@/lib/cases/types'
import { cn } from '@/lib/utils'
import { ArrowUpRight, GitFork, Link2, Loader2, Plus, Search, ShieldCheck, X } from 'lucide-react'
import Link from 'next/link'
import { useMemo, useRef, useState } from 'react'
import useSWR from 'swr'

type CaseListResponse = { cases: InvestigationSummary[] }
type NodePosition = { x: number; y: number }

const fetcher = async <T,>(url: string): Promise<T> => {
  const response = await fetch(url)
  if (!response.ok) throw new Error('Não foi possível carregar os dados do dossiê.')
  return response.json() as Promise<T>
}

function truncateLabel(label: string, max = 17) {
  return label.length > max ? `${label.slice(0, max - 1)}…` : label
}

export function InvestigationPivot() {
  const { data: caseData, isLoading: casesLoading } = useSWR<CaseListResponse>('/api/cases', fetcher)
  const cases = caseData?.cases ?? []
  const [caseId, setCaseId] = useState('')
  const [query, setQuery] = useState('')
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null)
  const [positionOverrides, setPositionOverrides] = useState<Record<string, NodePosition>>({})
  const [draggingEntityId, setDraggingEntityId] = useState<string | null>(null)
  const graphRef = useRef<SVGSVGElement | null>(null)
  const activeCaseId = cases.some((item) => item.id === caseId) ? caseId : cases[0]?.id ?? ''
  const { data: detail, error, isLoading, mutate: mutateDetail } = useSWR<CaseDetail>(
    activeCaseId ? `/api/cases/${activeCaseId}` : null,
    fetcher,
  )
  const [showEntityForm, setShowEntityForm] = useState(false)
  const [newEntityKind, setNewEntityKind] = useState<EntityKind>('domain')
  const [newEntityLabel, setNewEntityLabel] = useState('')
  const [newEntityValue, setNewEntityValue] = useState('')
  const [newEntityNotes, setNewEntityNotes] = useState('')
  const [connectionSourceId, setConnectionSourceId] = useState<string | null>(null)
  const [connectionTargetId, setConnectionTargetId] = useState<string | null>(null)
  const [relationLabel, setRelationLabel] = useState('')
  const [relationNote, setRelationNote] = useState('')
  const [editorBusy, setEditorBusy] = useState(false)
  const [editorError, setEditorError] = useState<string | null>(null)
  const entities = detail?.entities ?? []
  const links = detail?.links ?? []
  const normalizedQuery = query.trim().toLowerCase()
  const visibleEntities = useMemo(
    () => entities.filter((entity) => `${entity.label} ${entity.kind} ${entity.value ?? ''}`.toLowerCase().includes(normalizedQuery)),
    [entities, normalizedQuery],
  )
  const positions = useMemo(() => {
    const result = new Map<string, NodePosition>()
    const radiusX = visibleEntities.length > 10 ? 335 : 300
    const radiusY = visibleEntities.length > 10 ? 190 : 172
    visibleEntities.forEach((entity, index) => {
      const angle = -Math.PI / 2 + (2 * Math.PI * index) / Math.max(visibleEntities.length, 1)
      result.set(entity.id, positionOverrides[entity.id] ?? {
        x: 430 + radiusX * Math.cos(angle),
        y: 250 + radiusY * Math.sin(angle),
      })
    })
    return result
  }, [visibleEntities, positionOverrides])
  const selectedEntity = entities.find((entity) => entity.id === selectedEntityId) ?? null
  const relatedLinks = selectedEntity
    ? links.filter((link) => link.fromEntity === selectedEntity.id || link.toEntity === selectedEntity.id)
    : []

  function selectEntity(entity: Entity) {
    setSelectedEntityId(entity.id)
    if (connectionSourceId && entity.id !== connectionSourceId) {
      setConnectionTargetId(entity.id)
      setEditorError(null)
    }
  }

  function startConnection() {
    if (!selectedEntity) return
    setConnectionSourceId(selectedEntity.id)
    setConnectionTargetId(null)
    setRelationLabel('')
    setRelationNote('')
    setEditorError(null)
  }

  function cancelConnection() {
    setConnectionSourceId(null)
    setConnectionTargetId(null)
    setRelationLabel('')
    setRelationNote('')
    setEditorError(null)
  }

  async function submitEntity(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!activeCaseId) return
    setEditorBusy(true)
    setEditorError(null)
    try {
      const response = await fetch(`/api/cases/${activeCaseId}/records`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ recordType: 'entity', kind: newEntityKind, label: newEntityLabel, value: newEntityValue, notes: newEntityNotes, confidence: 50 }),
      })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload.error ?? 'Não foi possível adicionar a entidade.')
      setNewEntityLabel('')
      setNewEntityValue('')
      setNewEntityNotes('')
      setShowEntityForm(false)
      await mutateDetail()
      if (payload.entity?.id) setSelectedEntityId(payload.entity.id)
    } catch (error) {
      setEditorError(error instanceof Error ? error.message : 'Ocorreu um erro inesperado.')
    } finally {
      setEditorBusy(false)
    }
  }

  async function submitConnection(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!activeCaseId || !connectionSourceId || !connectionTargetId) return
    setEditorBusy(true)
    setEditorError(null)
    try {
      const response = await fetch(`/api/cases/${activeCaseId}/records`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ recordType: 'link', fromEntity: connectionSourceId, toEntity: connectionTargetId, relation: relationLabel, note: relationNote }),
      })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload.error ?? 'Não foi possível registar a relação.')
      cancelConnection()
      await mutateDetail()
    } catch (error) {
      setEditorError(error instanceof Error ? error.message : 'Ocorreu um erro inesperado.')
    } finally {
      setEditorBusy(false)
    }
  }

  function moveNodeWithKeyboard(event: React.KeyboardEvent<SVGGElement>, entity: Entity) {
    const movement: Record<string, NodePosition> = {
      ArrowUp: { x: 0, y: -12 },
      ArrowDown: { x: 0, y: 12 },
      ArrowLeft: { x: -12, y: 0 },
      ArrowRight: { x: 12, y: 0 },
    }
    const delta = movement[event.key]
    const position = positions.get(entity.id)
    if (!delta || !position) return false
    event.preventDefault()
    setPositionOverrides((current) => ({
      ...current,
      [entity.id]: {
        x: Math.max(32, Math.min(828, position.x + delta.x)),
        y: Math.max(32, Math.min(468, position.y + delta.y)),
      },
    }))
    return true
  }

  function handleNodePointerDown(event: React.PointerEvent<SVGGElement>, entity: Entity) {
    if (event.button !== 0) return
    event.currentTarget.setPointerCapture(event.pointerId)
    setDraggingEntityId(entity.id)
  }

  function handleGraphPointerMove(event: React.PointerEvent<SVGSVGElement>) {
    if (!draggingEntityId || !graphRef.current) return
    const point = graphRef.current.createSVGPoint()
    point.x = event.clientX
    point.y = event.clientY
    const matrix = graphRef.current.getScreenCTM()
    if (!matrix) return
    const graphPoint = point.matrixTransform(matrix.inverse())
    setPositionOverrides((current) => ({
      ...current,
      [draggingEntityId]: {
        x: Math.max(32, Math.min(828, graphPoint.x)),
        y: Math.max(32, Math.min(468, graphPoint.y)),
      },
    }))
  }

  function handleNodeKeyDown(event: React.KeyboardEvent<SVGGElement>, entity: Entity) {
    if (moveNodeWithKeyboard(event, entity)) return
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      selectEntity(entity)
    }
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:py-8">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-2xl">
          <p className="font-mono text-[10px] tracking-[0.28em] text-muted-foreground uppercase">
            Investigações · relações registadas
          </p>
          <h1 className="mt-1.5 text-2xl font-semibold tracking-tight text-foreground">
            Pivotagem gráfica
          </h1>
          <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
            Registe entidades, crie vínculos e explore dados autorizados num grafo visual.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-border bg-card/40 px-3 py-2">
          <GitFork className="size-4 text-primary" aria-hidden />
          <span className="font-mono text-[11px] text-muted-foreground">Vista de relações</span>
        </div>
      </header>

      <aside className="mb-5 flex items-start gap-3 rounded-xl border border-accent/20 bg-accent/[0.05] p-3.5" aria-label="Limites da pivotagem">
        <ShieldCheck className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden />
        <p className="text-xs leading-relaxed text-muted-foreground">
          Sem recolha automática: organize os dados já autorizados, registe entidades manualmente e documente cada ligação com a respetiva proveniência.
        </p>
      </aside>

      {casesLoading ? (
        <div className="flex items-center gap-2 rounded-xl border border-border bg-card/30 px-4 py-8 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" aria-hidden /> A carregar dossiês…
        </div>
      ) : cases.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card/20 px-5 py-12 text-center">
          <GitFork className="mx-auto size-7 text-muted-foreground" aria-hidden />
          <h2 className="mt-3 text-sm font-semibold text-foreground">Ainda não há dossiês para explorar</h2>
          <p className="mt-1 text-xs text-muted-foreground">Crie um dossiê e registe as entidades e relações autorizadas.</p>
          <Button render={<Link href="/cases" />} className="mt-4">
            Ir para dossiês <ArrowUpRight data-icon="inline-end" />
          </Button>
        </div>
      ) : (
        <>
          <section className="mb-4 flex flex-col gap-3 rounded-xl border border-border bg-card/40 p-3 sm:flex-row sm:items-center sm:justify-between" aria-label="Controlos da pivotagem">
            <label className="flex min-w-0 flex-1 items-center gap-2 text-xs text-muted-foreground sm:max-w-xl">
              <span className="shrink-0 font-mono text-[10px] tracking-wider uppercase">Dossiê</span>
              <select
                aria-label="Selecionar dossiê"
                value={activeCaseId}
                onChange={(event) => {
                  setCaseId(event.target.value)
                  setSelectedEntityId(null)
                  setPositionOverrides({})
                  setShowEntityForm(false)
                  cancelConnection()
                }}
                className="min-w-0 flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/20"
              >
                {cases.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
              </select>
            </label>
            <label className="relative block sm:w-64">
              <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" aria-hidden />
              <span className="sr-only">Filtrar entidades no grafo</span>
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Filtrar entidades…"
                className="w-full rounded-lg border border-border bg-background/60 py-2 pr-3 pl-8 text-xs text-foreground outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/20"
              />
            </label>
          </section>

          {isLoading ? (
            <div className="flex items-center gap-2 rounded-xl border border-border bg-card/30 px-4 py-8 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" aria-hidden /> A carregar relações…
            </div>
          ) : error ? (
            <div role="alert" className="rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
              Não foi possível abrir este dossiê. Tente selecionar novamente.
            </div>
          ) : detail ? (
            <>
              <div className="mb-4 grid gap-3 sm:grid-cols-3">
                <SummaryCard label="Entidades registadas" value={entities.length} />
                <SummaryCard label="Relações registadas" value={links.length} />
                <SummaryCard label="Factos documentados" value={detail.facts.length} />
              </div>

              <div className="grid gap-4 xl:grid-cols-[minmax(0,1.7fr)_minmax(280px,0.8fr)]">
                <section className="min-w-0 rounded-xl border border-border bg-card/40" aria-labelledby="graph-title">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-3">
                    <div>
                      <h2 id="graph-title" className="text-sm font-semibold text-foreground">Mapa de relações</h2>
                      <p className="mt-0.5 text-[11px] text-muted-foreground">Arraste, selecione e ligue nós para compor o mapa.</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{visibleEntities.length} visíveis</Badge>
                      <Button type="button" size="sm" variant="outline" onClick={() => { setShowEntityForm((current) => !current); cancelConnection(); setEditorError(null) }}>
                        <Plus data-icon="inline-start" /> Adicionar nó
                      </Button>
                    </div>
                  </div>
                  {connectionSourceId && (
                    <div role="status" className="flex flex-wrap items-center justify-between gap-2 border-b border-primary/20 bg-primary/[0.06] px-4 py-2.5">
                      <p className="text-xs text-foreground">
                        {connectionTargetId
                          ? `A ligar ${entities.find((item) => item.id === connectionSourceId)?.label} a ${entities.find((item) => item.id === connectionTargetId)?.label}`
                          : `Modo de ligação: selecione outro nó para ligar a ${entities.find((item) => item.id === connectionSourceId)?.label}.`}
                      </p>
                      <Button type="button" size="sm" variant="ghost" onClick={cancelConnection}>Cancelar</Button>
                    </div>
                  )}
                  {visibleEntities.length === 0 ? (
                    <div className="flex flex-col items-center gap-3 px-4 py-12 text-center">
                      <p className="text-sm text-muted-foreground">
                        {entities.length === 0 ? 'O espaço está pronto. Adicione o primeiro nó para começar a mapear a investigação.' : 'Nenhuma entidade corresponde ao filtro.'}
                      </p>
                      {entities.length === 0 && (
                        <Button type="button" size="sm" onClick={() => setShowEntityForm(true)}>
                          <Plus data-icon="inline-start" /> Adicionar primeiro nó
                        </Button>
                      )}
                    </div>
                  ) : (
                    <div className="grid-field overflow-x-auto p-2 sm:p-4">
                      <svg
                        ref={graphRef}
                        viewBox="0 0 860 500"
                        role="group"
                        aria-label={`Grafo interativo com ${visibleEntities.length} entidades e relações registadas`}
                        onPointerMove={handleGraphPointerMove}
                        onPointerUp={() => setDraggingEntityId(null)}
                        onPointerCancel={() => setDraggingEntityId(null)}
                        className="mx-auto min-w-[680px] max-w-full"
                      >
                        <defs>
                          <radialGradient id="case-node-gradient">
                            <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.25" />
                            <stop offset="100%" stopColor="var(--primary)" stopOpacity="0.06" />
                          </radialGradient>
                        </defs>
                        {visibleEntities.map((entity, index) => {
                          const position = positions.get(entity.id)
                          if (!position) return null
                          return (
                            <line
                              key={`hub-${entity.id}`}
                              x1="430"
                              y1="250"
                              x2={position.x}
                              y2={position.y}
                              stroke="var(--border)"
                              strokeDasharray="3 5"
                              strokeWidth="1"
                            />
                          )
                        })}
                        {links.map((link) => {
                          const from = positions.get(link.fromEntity)
                          const to = positions.get(link.toEntity)
                          if (!from || !to) return null
                          const midX = (from.x + to.x) / 2
                          const midY = (from.y + to.y) / 2
                          const isRelated = selectedEntity && (link.fromEntity === selectedEntity.id || link.toEntity === selectedEntity.id)
                          return (
                            <g key={link.id}>
                              <line x1={from.x} y1={from.y} x2={to.x} y2={to.y} stroke={isRelated ? 'var(--primary)' : 'var(--chart-2)'} strokeOpacity={isRelated ? 1 : 0.45} strokeWidth={isRelated ? 2.5 : 1.25} />
                              <text x={midX} y={midY - 5} textAnchor="middle" className={isRelated ? 'fill-primary' : 'fill-muted-foreground'} fontSize="9">
                                {truncateLabel(link.relation, 20)}
                              </text>
                            </g>
                          )
                        })}
                        <g>
                          <circle cx="430" cy="250" r="37" fill="url(#case-node-gradient)" stroke="var(--primary)" strokeWidth="1.5" />
                          <text x="430" y="247" textAnchor="middle" className="fill-foreground" fontSize="10" fontWeight="600">
                            DOSSIÊ
                          </text>
                          <text x="430" y="262" textAnchor="middle" className="fill-muted-foreground" fontSize="9">
                            {truncateLabel(detail.investigation.name, 15)}
                          </text>
                        </g>
                        {visibleEntities.map((entity) => {
                          const position = positions.get(entity.id)
                          if (!position) return null
                          const selected = selectedEntity?.id === entity.id
                          return (
                            <g
                              key={entity.id}
                              role="button"
                              tabIndex={0}
                              aria-label={`${ENTITY_KIND_LABEL[entity.kind]}: ${entity.label}`}
                              aria-pressed={selected}
                              onClick={() => selectEntity(entity)}
                              onKeyDown={(event) => handleNodeKeyDown(event, entity)}
                              onPointerDown={(event) => handleNodePointerDown(event, entity)}
                              style={{ touchAction: 'none' }}
                              className={cn('cursor-grab outline-none active:cursor-grabbing', connectionSourceId && entity.id !== connectionSourceId && 'cursor-crosshair')}
                            >
                              <title>{entity.label} · {ENTITY_KIND_LABEL[entity.kind]}</title>
                              <circle
                                cx={position.x}
                                cy={position.y}
                                r={selected ? 25 : 21}
                                fill={selected ? 'var(--primary)' : 'var(--card)'}
                                fillOpacity={selected ? 0.24 : 1}
                                stroke={selected ? 'var(--primary)' : 'var(--chart-2)'}
                                strokeOpacity={selected ? 1 : 0.75}
                                strokeWidth={selected ? 2 : 1.25}
                              />
                              <text x={position.x} y={position.y - 2} textAnchor="middle" className="fill-foreground" fontSize="8" fontWeight="600">
                                {truncateLabel(ENTITY_KIND_LABEL[entity.kind], 12)}
                              </text>
                              <text x={position.x} y={position.y + 9} textAnchor="middle" className="fill-muted-foreground" fontSize="7">
                                {truncateLabel(entity.label, 16)}
                              </text>
                            </g>
                          )
                        })}
                      </svg>
                    </div>
                  )}
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-border px-4 py-3 text-[10px] text-muted-foreground">
                    <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-primary" />Dossiê</span>
                    <span className="flex items-center gap-1.5"><span className="size-2 rounded-full border border-accent" />Entidade</span>
                    <span className="flex items-center gap-1.5"><span className="h-px w-3 bg-accent" />Relação registada</span>
                  </div>
                </section>

                <aside className="flex min-w-0 flex-col rounded-xl border border-border bg-card/40" aria-labelledby="entity-panel-title">
                  <div className="border-b border-border px-4 py-3">
                    <h2 id="entity-panel-title" className="text-sm font-semibold text-foreground">Entidades do dossiê</h2>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">Selecione uma entidade para pivotar pelos vínculos documentados.</p>
                  </div>
                  <ul className="max-h-64 divide-y divide-border overflow-y-auto">
                    {visibleEntities.map((entity) => {
                      const selected = selectedEntity?.id === entity.id
                      return (
                        <li key={entity.id}>
                          <button
                            type="button"
                            onClick={() => selectEntity(entity)}
                            aria-pressed={selected}
                            className={cn('w-full px-4 py-2.5 text-left transition-colors', selected ? 'bg-primary/10' : 'hover:bg-white/[0.03]')}
                          >
                            <span className="flex items-center justify-between gap-2">
                              <span className="truncate text-xs font-medium text-foreground">{entity.label}</span>
                              <span className="shrink-0 font-mono text-[9px] text-muted-foreground">{ENTITY_KIND_LABEL[entity.kind]}</span>
                            </span>
                          </button>
                        </li>
                      )
                    })}
                  </ul>
                  <div className="min-h-36 flex-1 border-t border-border p-4">
                    {showEntityForm ? (
                      <form onSubmit={submitEntity} className="flex flex-col gap-3">
                        <div className="flex items-center justify-between gap-2">
                          <h3 className="text-sm font-semibold text-foreground">Adicionar nó ao grafo</h3>
                          <Button type="button" size="icon-sm" variant="ghost" aria-label="Fechar formulário de nó" onClick={() => setShowEntityForm(false)}><X data-icon="inline-start" /></Button>
                        </div>
                        <label className="flex flex-col gap-1.5 text-[11px] text-muted-foreground">
                          Tipo de dado
                          <select value={newEntityKind} onChange={(event) => setNewEntityKind(event.target.value as EntityKind)} className="rounded-md border border-border bg-background px-3 py-2 text-xs text-foreground">
                            {ENTITY_KINDS.map((kind) => <option key={kind} value={kind}>{ENTITY_KIND_LABEL[kind]}</option>)}
                          </select>
                        </label>
                        <label className="flex flex-col gap-1.5 text-[11px] text-muted-foreground">
                          Designação
                          <input value={newEntityLabel} onChange={(event) => setNewEntityLabel(event.target.value)} required minLength={2} maxLength={200} placeholder="Nome, conta, domínio ou local" className="rounded-md border border-border bg-background px-3 py-2 text-xs text-foreground" />
                        </label>
                        <label className="flex flex-col gap-1.5 text-[11px] text-muted-foreground">
                          Identificador (opcional)
                          <input value={newEntityValue} onChange={(event) => setNewEntityValue(event.target.value)} maxLength={500} placeholder="URL, handle, telefone…" className="rounded-md border border-border bg-background px-3 py-2 text-xs text-foreground" />
                        </label>
                        <label className="flex flex-col gap-1.5 text-[11px] text-muted-foreground">
                          Nota ou fonte autorizada (opcional)
                          <textarea value={newEntityNotes} onChange={(event) => setNewEntityNotes(event.target.value)} rows={2} maxLength={2000} placeholder="Registe a proveniência do dado" className="resize-y rounded-md border border-border bg-background px-3 py-2 text-xs text-foreground" />
                        </label>
                        {editorError && <p role="alert" className="text-xs text-destructive">{editorError}</p>}
                        <Button type="submit" size="sm" disabled={editorBusy}>
                          {editorBusy ? <Loader2 data-icon="inline-start" className="animate-spin" aria-hidden /> : <Plus data-icon="inline-start" />}
                          Adicionar ao mapa
                        </Button>
                      </form>
                    ) : connectionTargetId && connectionSourceId ? (
                      <form onSubmit={submitConnection} className="flex flex-col gap-3">
                        <div className="flex items-center justify-between gap-2">
                          <h3 className="text-sm font-semibold text-foreground">Descrever relação</h3>
                          <Button type="button" size="icon-sm" variant="ghost" aria-label="Cancelar criação de relação" onClick={cancelConnection}><X data-icon="inline-start" /></Button>
                        </div>
                        <p className="text-xs leading-relaxed text-muted-foreground">A relação será registada entre dois nós deste dossiê. Inclua apenas informação com proveniência autorizada.</p>
                        <label className="flex flex-col gap-1.5 text-[11px] text-muted-foreground">
                          Tipo de relação
                          <input value={relationLabel} onChange={(event) => setRelationLabel(event.target.value)} required minLength={2} maxLength={120} placeholder="ex.: associado a, proprietário de" className="rounded-md border border-border bg-background px-3 py-2 text-xs text-foreground" />
                        </label>
                        <label className="flex flex-col gap-1.5 text-[11px] text-muted-foreground">
                          Nota / referência de origem (opcional)
                          <textarea value={relationNote} onChange={(event) => setRelationNote(event.target.value)} maxLength={1000} rows={3} placeholder="Registe contexto e proveniência" className="resize-y rounded-md border border-border bg-background px-3 py-2 text-xs text-foreground" />
                        </label>
                        {editorError && <p role="alert" className="text-xs text-destructive">{editorError}</p>}
                        <Button type="submit" size="sm" disabled={editorBusy}>
                          {editorBusy ? <Loader2 data-icon="inline-start" className="animate-spin" aria-hidden /> : <Link2 data-icon="inline-start" />}
                          Registar relação
                        </Button>
                      </form>
                    ) : selectedEntity ? (
                      <EntityDetails entity={selectedEntity} links={relatedLinks} entities={entities} onStartConnection={startConnection} isConnecting={Boolean(connectionSourceId)} />
                    ) : (
                      <p className="text-xs leading-relaxed text-muted-foreground">Selecione ou arraste um nó para organizar o mapa. Use as setas do teclado para reposicionar o nó selecionado.</p>
                    )}
                  </div>
                  <Link href={`/cases/${activeCaseId}`} className="flex items-center justify-between border-t border-border px-4 py-3 text-xs text-primary hover:bg-primary/5">
                    Abrir dossiê completo <ArrowUpRight className="size-3.5" aria-hidden />
                  </Link>
                </aside>
              </div>
            </>
          ) : null}
        </>
      )}
    </div>
  )
}

function SummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-border bg-card/40 px-4 py-3">
      <p className="font-mono text-[9px] tracking-[0.16em] text-muted-foreground uppercase">{label}</p>
      <p className="mt-1 text-xl font-semibold tabular-nums text-foreground">{value}</p>
    </div>
  )
}

function EntityDetails({ entity, links, entities, onStartConnection, isConnecting }: { entity: Entity; links: EntityLink[]; entities: Entity[]; onStartConnection: () => void; isConnecting: boolean }) {
  const linkedEntities = links.map((link) => {
    const isSource = link.fromEntity === entity.id
    const relatedId = isSource ? link.toEntity : link.fromEntity
    return {
      relation: link.relation,
      note: link.note,
      target: entities.find((item) => item.id === relatedId),
    }
  })

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="text-sm font-semibold text-foreground">{entity.label}</h3>
        <Badge variant="outline">{ENTITY_KIND_LABEL[entity.kind]}</Badge>
      </div>
      {entity.value && <p className="mt-2 break-all font-mono text-[11px] text-muted-foreground">{entity.value}</p>}
      {entity.notes && <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{entity.notes}</p>}
      <p className="mt-3 font-mono text-[9px] tracking-wider text-muted-foreground uppercase">
        Confiança registada: {entity.confidence}% · Criada em {new Date(entity.createdAt).toLocaleDateString('pt-PT')}
      </p>
      <Button type="button" size="sm" variant="outline" className="mt-3 w-full" onClick={onStartConnection} disabled={isConnecting}>
        <Link2 data-icon="inline-start" /> Ligar a outro nó
      </Button>
      <h4 className="mt-4 text-[11px] font-semibold text-foreground">Vínculos documentados ({linkedEntities.length})</h4>
      {linkedEntities.length === 0 ? (
        <p className="mt-2 text-xs text-muted-foreground">Sem vínculos registados para esta entidade.</p>
      ) : (
        <ul className="mt-2 flex flex-col gap-2">
          {linkedEntities.map((item, index) => (
            <li key={`${item.target?.id ?? 'unknown'}-${index}`} className="rounded-lg border border-border bg-background/40 p-2.5">
              <p className="text-xs font-medium text-foreground">{item.target?.label ?? 'Entidade não disponível'}</p>
              <p className="mt-1 font-mono text-[10px] text-primary">{item.relation}</p>
              {item.note && <p className="mt-1 text-[10px] leading-relaxed text-muted-foreground">{item.note}</p>}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
