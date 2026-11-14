'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ENTITY_KIND_LABEL, type CaseDetail, type Entity, type EntityLink, type InvestigationSummary } from '@/lib/cases/types'
import { cn } from '@/lib/utils'
import { ArrowUpRight, GitFork, Loader2, Search, ShieldCheck } from 'lucide-react'
import Link from 'next/link'
import { useMemo, useState } from 'react'
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
  const activeCaseId = cases.some((item) => item.id === caseId) ? caseId : cases[0]?.id ?? ''
  const { data: detail, error, isLoading } = useSWR<CaseDetail>(
    activeCaseId ? `/api/cases/${activeCaseId}` : null,
    fetcher,
  )
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
      result.set(entity.id, {
        x: 430 + radiusX * Math.cos(angle),
        y: 250 + radiusY * Math.sin(angle),
      })
    })
    return result
  }, [visibleEntities])
  const selectedEntity = entities.find((entity) => entity.id === selectedEntityId) ?? null
  const relatedLinks = selectedEntity
    ? links.filter((link) => link.fromEntity === selectedEntity.id || link.toEntity === selectedEntity.id)
    : []

  function selectEntity(entity: Entity) {
    setSelectedEntityId(entity.id)
  }

  function handleNodeKeyDown(event: React.KeyboardEvent<SVGGElement>, entity: Entity) {
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
            Explore visualmente as entidades e relações que já constam nos dossiês autorizados.
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
          Esta vista não pesquisa nem enriquece dados: apresenta apenas entidades e relações que já foram registadas no dossiê.
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
                      <p className="mt-0.5 text-[11px] text-muted-foreground">Selecione um nó para ver os vínculos registados.</p>
                    </div>
                    <Badge variant="outline">{visibleEntities.length} visíveis</Badge>
                  </div>
                  {visibleEntities.length === 0 ? (
                    <p className="px-4 py-12 text-center text-sm text-muted-foreground">
                      {entities.length === 0 ? 'Este dossiê ainda não tem entidades.' : 'Nenhuma entidade corresponde ao filtro.'}
                    </p>
                  ) : (
                    <div className="grid-field overflow-x-auto p-2 sm:p-4">
                      <svg
                        viewBox="0 0 860 500"
                        role="img"
                        aria-label={`Grafo com ${visibleEntities.length} entidades e relações registadas`}
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
                          return (
                            <g key={link.id}>
                              <line x1={from.x} y1={from.y} x2={to.x} y2={to.y} stroke="var(--chart-2)" strokeOpacity="0.65" strokeWidth="1.5" />
                              <text x={midX} y={midY - 5} textAnchor="middle" className="fill-muted-foreground" fontSize="9">
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
                              className="cursor-pointer outline-none"
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
                    {selectedEntity ? (
                      <EntityDetails entity={selectedEntity} links={relatedLinks} entities={entities} />
                    ) : (
                      <p className="text-xs leading-relaxed text-muted-foreground">Selecione um nó no grafo ou uma entidade na lista para consultar os respetivos vínculos.</p>
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

function EntityDetails({ entity, links, entities }: { entity: Entity; links: EntityLink[]; entities: Entity[] }) {
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
