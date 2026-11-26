'use client'

import { EntityPanel, FactPanel, LinkPanel } from '@/components/cases/case-panels'
import { GeoMap, type MapPoint } from '@/components/geo-map'
import { buttonVariants } from '@/components/ui/button'
import {
  CASE_PRIORITY,
  CASE_PRIORITY_LABEL,
  CASE_STATUS,
  CASE_STATUS_LABEL,
  ENTITY_KIND_LABEL,
  type CaseDetail,
  type EntityKind,
  type CasePriority,
  type CaseStatus,
} from '@/lib/cases/types'
import { cn } from '@/lib/utils'
import {
  ArrowLeft,
  CalendarClock,
  GitBranch,
  Loader2,
  Terminal,
  Users,
} from 'lucide-react'
import Link from 'next/link'
import { useMemo, useState } from 'react'
import useSWR from 'swr'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

const TABS = [
  { id: 'entidades', label: 'Entidades', icon: Users },
  { id: 'factos', label: 'Factos', icon: CalendarClock },
  { id: 'vinculos', label: 'Vínculos', icon: GitBranch },
] as const

type TabId = (typeof TABS)[number]['id']

export function CaseWorkspace({ caseId }: { caseId: string }) {
  const { data, error, isLoading, mutate } = useSWR<CaseDetail>(
    `/api/cases/${caseId}`,
    fetcher,
  )

  const [tab, setTab] = useState<TabId>('entidades')
  const [savingMeta, setSavingMeta] = useState(false)

  const points = useMemo<MapPoint[]>(() => {
    if (!data) return []

    return data.entities
      .filter((entity) => entity.latitude != null && entity.longitude != null)
      .map((entity) => ({
        id: entity.id,
        label: entity.label,
        detail: entity.value,
        coordinates: [
          entity.longitude as number,
          entity.latitude as number,
        ] as [number, number],
        tone:
          entity.kind === 'location'
            ? 'accent'
            : entity.kind === 'person'
              ? 'primary'
              : 'warn',
      }))
  }, [data])

  const kindCounts = useMemo(() => {
    if (!data) return []

    const counts = new Map<EntityKind, number>()

    for (const entity of data.entities) {
      counts.set(entity.kind, (counts.get(entity.kind) ?? 0) + 1)
    }

    return [...counts.entries()]
      .map(([kind, count]) => ({ kind, count }))
      .sort((a, b) => b.count - a.count)
  }, [data])

  async function patchMeta(patch: Record<string, unknown>) {
    setSavingMeta(true)

    try {
      await fetch(`/api/cases/${caseId}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(patch),
      })

      await mutate()
    } finally {
      setSavingMeta(false)
    }
  }

  if (isLoading) {
    return (
      <div className="mx-auto flex w-full max-w-7xl items-center gap-2 px-4 py-16 text-sm text-muted-foreground sm:px-6">
        <Loader2 className="size-4 animate-spin" aria-hidden />
        A carregar dossiê…
      </div>
    )
  }

  if (error || !data || 'error' in data) {
    return (
      <div className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6">
        <p className="text-sm text-muted-foreground">
          Dossiê não encontrado.
        </p>

        <Link
          href="/"
          className="mt-3 inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
        >
          <ArrowLeft className="size-4" aria-hidden />
          Voltar às investigações
        </Link>
      </div>
    )
  }

  const { investigation, entities, facts, links } = data

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:py-8">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 font-mono text-[11px] tracking-wide text-muted-foreground uppercase transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" aria-hidden />
        Investigações
      </Link>

      <header className="mt-3 flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            {investigation.name}
          </h1>

          {investigation.objective && (
            <p className="mt-1.5 max-w-3xl text-sm leading-relaxed text-muted-foreground">
              <span className="font-medium text-foreground">Objetivo:</span>{' '}
              {investigation.objective}
            </p>
          )}
          {investigation.description && (
            <p className="mt-1 max-w-3xl text-xs leading-relaxed text-muted-foreground/80">
              {investigation.description}
            </p>
          )}

          <p className="mt-2 font-mono text-[10px] tracking-wide text-muted-foreground/70 uppercase">
            {investigation.id} · aberto{' '}
            {new Date(investigation.createdAt).toLocaleDateString('pt-PT')}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <label className="sr-only" htmlFor="case-status">
            Estado
          </label>

          <select
            id="case-status"
            value={investigation.status}
            onChange={(e) =>
              patchMeta({ status: e.target.value as CaseStatus })
            }
            className="rounded-lg border border-border bg-background/60 px-2.5 py-1.5 text-xs text-foreground outline-none focus:border-primary/60"
          >
            {CASE_STATUS.map((value) => (
              <option key={value} value={value}>
                {CASE_STATUS_LABEL[value]}
              </option>
            ))}
          </select>

          <label className="sr-only" htmlFor="case-priority">
            Prioridade
          </label>

          <select
            id="case-priority"
            value={investigation.priority}
            onChange={(e) =>
              patchMeta({ priority: e.target.value as CasePriority })
            }
            className="rounded-lg border border-border bg-background/60 px-2.5 py-1.5 text-xs text-foreground outline-none focus:border-primary/60"
          >
            {CASE_PRIORITY.map((value) => (
              <option key={value} value={value}>
                {CASE_PRIORITY_LABEL[value]}
              </option>
            ))}
          </select>

          <Link
            href={`/terminal?case=${caseId}`}
            className={cn(
              buttonVariants({ variant: 'outline', size: 'sm' }),
              'gap-1.5',
            )}
          >
            <Terminal className="size-3.5" aria-hidden />
            Terminal
          </Link>
        </div>
      </header>

      <dl className="mt-5 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        {[
          { label: 'Entidades', value: entities.length },
          { label: 'Factos', value: facts.length },
          { label: 'Vínculos', value: links.length },
          { label: 'Georreferenciados', value: points.length },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-lg border border-border bg-card/40 px-3 py-2.5"
          >
            <dt className="font-mono text-[10px] tracking-[0.14em] text-muted-foreground uppercase">
              {stat.label}
            </dt>

            <dd className="mt-0.5 text-xl font-semibold tabular-nums text-foreground">
              {stat.value}
            </dd>
          </div>
        ))}
      </dl>

      <div className="mt-4 grid gap-4 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <GeoMap
            points={points}
            caption="Georreferenciação do dossiê"
            emptyLabel="adicione coordenadas a uma entidade"
          />
        </div>

        <aside className="flex flex-col gap-4 lg:col-span-4">
          <div className="rounded-xl border border-border bg-card/40 p-4">
            <h2 className="font-mono text-[10px] tracking-[0.16em] text-muted-foreground uppercase">
              Composição
            </h2>

            {kindCounts.length === 0 ? (
              <p className="mt-2 text-xs text-muted-foreground">
                Sem entidades registadas.
              </p>
            ) : (
              <ul className="mt-2.5 space-y-1.5">
                {kindCounts.map((item) => (
                  <li key={item.kind} className="flex items-center gap-2">
                    <span className="w-24 shrink-0 truncate text-xs text-muted-foreground">
                      {ENTITY_KIND_LABEL[item.kind]}
                    </span>
                    <span className="font-mono text-xs tabular-nums text-muted-foreground">
                      {item.count}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </aside>
      </div>

      <section className="mt-6" aria-label="Conteúdo da investigação">
        <div
          role="tablist"
          aria-label="Secções da investigação"
          className="flex flex-wrap gap-1 border-b border-border"
        >
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              role="tab"
              id={`case-tab-${id}`}
              aria-selected={tab === id}
              aria-controls="case-tab-panel"
              onClick={() => setTab(id)}
              className={cn(
                'inline-flex items-center gap-2 border-b-2 px-3 py-2.5 text-xs transition-colors',
                tab === id
                  ? 'border-primary text-foreground'
                  : 'border-transparent text-muted-foreground hover:text-foreground',
              )}
            >
              <Icon className="size-3.5" aria-hidden />
              {label}
            </button>
          ))}
        </div>

        <div
          id="case-tab-panel"
          role="tabpanel"
          aria-labelledby={`case-tab-${tab}`}
          className="pt-4"
        >
          {tab === 'entidades' ? (
            <EntityPanel caseId={caseId} detail={data} onChanged={mutate} />
          ) : tab === 'factos' ? (
            <FactPanel caseId={caseId} detail={data} onChanged={mutate} />
          ) : (
            <LinkPanel caseId={caseId} detail={data} onChanged={mutate} />
          )}
        </div>
      </section>
    </div>
  )
}
