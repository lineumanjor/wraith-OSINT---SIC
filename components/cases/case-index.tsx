'use client'

import { Button } from '@/components/ui/button'
import {
  CASE_PRIORITY,
  CASE_PRIORITY_LABEL,
  CASE_STATUS_LABEL,
  type CasePriority,
  type InvestigationSummary,
} from '@/lib/cases/types'
import { cn } from '@/lib/utils'
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  FileText,
  FolderPlus,
  Globe2,
  Loader2,
  Network,
  Search,
  ShieldCheck,
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'
import useSWR from 'swr'

const inputClass =
  'w-full rounded-lg border border-border bg-background/60 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/60 outline-none transition-colors focus:border-primary/60 focus:ring-2 focus:ring-primary/20'

const PRIORITY_TONE: Record<CasePriority, string> = {
  low: 'text-muted-foreground border-border',
  normal: 'text-accent border-accent/30',
  high: 'text-[oklch(0.8_0.14_75)] border-[oklch(0.8_0.14_75)]/30',
  critical: 'text-destructive border-destructive/40',
}

const fetcher = (url: string) => fetch(url).then((r) => r.json())
type Vector = 'redirect' | 'trigger'

export function CaseIndex() {
  const router = useRouter()
  const { data, isLoading, mutate } = useSWR<{ cases: InvestigationSummary[] }>('/api/cases', fetcher)
  const [name, setName] = useState('')
  const [objective, setObjective] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState<CasePriority>('normal')
  const [step, setStep] = useState<1 | 2>(1)
  const [vector, setVector] = useState<Vector | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState('')

  const cases = data?.cases ?? []
  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase()
    if (!term) return cases
    return cases.filter((item) => item.name.toLowerCase().includes(term) || (item.description ?? '').toLowerCase().includes(term))
  }, [cases, query])

  async function createCase(event: React.FormEvent) {
    event.preventDefault()
    setError(null)
    if (step === 1) {
      setStep(2)
      return
    }
    if (!vector) return
    setSubmitting(true)
    try {
      const res = await fetch('/api/cases', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name, objective, description, priority }),
      })
      const payload = await res.json()
      if (!res.ok) throw new Error(payload.error ?? 'não foi possível criar a investigação')
      await mutate()
      const destination = vector === 'redirect' ? '/forge' : '/preview'
      router.push(`${destination}?investigationId=${encodeURIComponent(payload.case.id)}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'erro inesperado')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:py-8">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-[10px] tracking-[0.28em] text-muted-foreground uppercase">Módulo 05 · Dossiês</p>
          <h1 className="mt-1.5 text-2xl font-semibold tracking-tight text-foreground">Investigações</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">Crie um dossiê e continue no módulo vetorial adequado. Entidades, factos e vínculos permanecem no painel da investigação.</p>
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-border bg-card/40 px-3 py-2">
          <Network className="size-4 text-primary" aria-hidden />
          <span className="font-mono text-[11px] text-muted-foreground">{cases.length} {cases.length === 1 ? 'dossiê' : 'dossiês'}</span>
        </div>
      </header>

      <div className="grid gap-5 lg:grid-cols-12">
        <section className="lg:col-span-4" aria-labelledby="nova-investigacao">
          <form onSubmit={createCase} className="rounded-xl border border-border bg-card/40 p-4 lg:sticky lg:top-24">
            <div className="flex items-center justify-between gap-3">
              <h2 id="nova-investigacao" className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <FolderPlus className="size-4 text-primary" aria-hidden /> Nova investigação
              </h2>
              <span className="font-mono text-[10px] text-muted-foreground">ETAPA {step} / 2</span>
            </div>
            <div className="mt-3 flex gap-1" aria-hidden="true">
              <span className={cn('h-1 flex-1 rounded-full', step >= 1 ? 'bg-primary' : 'bg-border')} />
              <span className={cn('h-1 flex-1 rounded-full', step >= 2 ? 'bg-primary' : 'bg-border')} />
            </div>

            {step === 1 ? (
              <div className="mt-4 flex flex-col gap-3">
                <label className="block" htmlFor="case-name">
                  <span className="mb-1.5 block text-xs font-medium text-muted-foreground">Nome da investigação</span>
                  <input id="case-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Operação Vértice" maxLength={160} required minLength={3} className={inputClass} />
                </label>
                <label className="block" htmlFor="case-objective">
                  <span className="mb-1.5 block text-xs font-medium text-muted-foreground">Propósito</span>
                  <textarea id="case-objective" value={objective} onChange={(e) => setObjective(e.target.value)} placeholder="O que pretende esclarecer ou documentar?" rows={3} maxLength={1000} required minLength={5} className={cn(inputClass, 'resize-y')} />
                </label>
                <label className="block" htmlFor="case-description">
                  <span className="mb-1.5 block text-xs font-medium text-muted-foreground">Descrição adicional <span className="font-normal text-muted-foreground/70">(opcional)</span></span>
                  <textarea id="case-description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Âmbito, contexto inicial ou notas…" rows={2} maxLength={4000} className={cn(inputClass, 'resize-y')} />
                </label>
                <label className="block" htmlFor="case-priority">
                  <span className="mb-1.5 block text-xs font-medium text-muted-foreground">Prioridade</span>
                  <select id="case-priority" value={priority} onChange={(e) => setPriority(e.target.value as CasePriority)} className={inputClass}>
                    {CASE_PRIORITY.map((value) => <option key={value} value={value}>{CASE_PRIORITY_LABEL[value]}</option>)}
                  </select>
                </label>
              </div>
            ) : (
              <fieldset className="mt-4 flex flex-col gap-2.5">
                <legend className="mb-2 text-xs leading-relaxed text-muted-foreground">Escolha o módulo para continuar depois de abrir o dossiê.</legend>
                <button type="button" onClick={() => setVector('redirect')} aria-pressed={vector === 'redirect'} className={cn('w-full rounded-lg border p-3 text-left transition-colors', vector === 'redirect' ? 'border-primary/60 bg-primary/10' : 'border-border bg-background/40 hover:border-primary/30')}>
                  <span className="flex items-center gap-2 text-sm font-medium text-foreground"><Globe2 className="size-4 text-primary" aria-hidden /> Redirect Link</span>
                  <span className="mt-1 block text-xs leading-relaxed text-muted-foreground">Abre o gerador existente para configurar o destino e a pré-visualização do link.</span>
                </button>
                <button type="button" onClick={() => setVector('trigger')} aria-pressed={vector === 'trigger'} className={cn('w-full rounded-lg border p-3 text-left transition-colors', vector === 'trigger' ? 'border-primary/60 bg-primary/10' : 'border-border bg-background/40 hover:border-primary/30')}>
                  <span className="flex items-center gap-2 text-sm font-medium text-foreground"><FileText className="size-4 text-primary" aria-hidden /> Trigger Page</span>
                  <span className="mt-1 block text-xs leading-relaxed text-muted-foreground">Abre o estúdio de templates para pré-visualizar páginas transparentes e consentidas.</span>
                </button>
                <p className="flex items-start gap-2 rounded-md border border-border bg-background/30 p-2.5 text-[11px] leading-relaxed text-muted-foreground"><ShieldCheck className="mt-0.5 size-3.5 shrink-0 text-accent" aria-hidden />Modelos de demonstração: sem imitação de serviços, recolha de credenciais ou geolocalização silenciosa.</p>
              </fieldset>
            )}

            {error && <p role="alert" className="mt-3 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">{error}</p>}
            <div className="mt-4 flex gap-2">
              {step === 2 && <Button type="button" variant="outline" onClick={() => setStep(1)} disabled={submitting} aria-label="Voltar aos dados da investigação"><ArrowLeft className="size-4" aria-hidden /> Voltar</Button>}
              <Button type="submit" disabled={submitting || (step === 2 && !vector)} className="flex-1">
                {submitting ? <><Loader2 className="size-4 animate-spin" aria-hidden /> A abrir dossiê…</> : step === 1 ? <>Escolher vetor <ArrowRight className="size-4" aria-hidden /></> : 'Criar e continuar'}
              </Button>
            </div>
          </form>
        </section>

        <section className="lg:col-span-8" aria-labelledby="lista-dossies">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 id="lista-dossies" className="text-sm font-semibold text-foreground">Dossiês abertos</h2>
            <div className="relative w-full max-w-56">
              <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" aria-hidden />
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Filtrar…" aria-label="Filtrar dossiês" className={cn(inputClass, 'py-1.5 pl-8 text-xs')} />
            </div>
          </div>
          {isLoading ? (
            <div className="flex items-center gap-2 rounded-xl border border-border bg-card/30 px-4 py-8 text-sm text-muted-foreground"><Loader2 className="size-4 animate-spin" aria-hidden /> A carregar dossiês…</div>
          ) : filtered.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border bg-card/20 px-4 py-12 text-center"><p className="text-sm text-muted-foreground">{cases.length === 0 ? 'Ainda não há dossiês. Crie o primeiro à esquerda.' : 'Nenhum dossiê corresponde ao filtro.'}</p></div>
          ) : (
            <ul className="flex flex-col gap-2.5">
              {filtered.map((item) => (
                <li key={item.id}>
                  <Link href={`/cases/${item.id}`} className="group block rounded-xl border border-border bg-card/40 p-4 transition-colors hover:border-primary/40 hover:bg-card/70">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="truncate text-sm font-semibold text-foreground">{item.name}</h3>
                          <span className="rounded-full border border-border px-2 py-0.5 font-mono text-[10px] tracking-wide text-muted-foreground uppercase">{CASE_STATUS_LABEL[item.status]}</span>
                          <span className={cn('rounded-full border px-2 py-0.5 font-mono text-[10px] tracking-wide uppercase', PRIORITY_TONE[item.priority])}>{CASE_PRIORITY_LABEL[item.priority]}</span>
                        </div>
                        {item.objective && <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-muted-foreground"><span className="font-medium text-foreground/80">Propósito:</span> {item.objective}</p>}
                        {item.description && <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground/80">{item.description}</p>}
                      </div>
                      <ArrowUpRight className="size-4 shrink-0 text-muted-foreground transition-colors group-hover:text-primary" aria-hidden />
                    </div>
                    <dl className="mt-3 flex flex-wrap gap-x-5 gap-y-1 font-mono text-[10px] tracking-wide text-muted-foreground uppercase">
                      <div className="flex gap-1.5"><dt>Entidades</dt><dd className="text-foreground">{item.entityCount}</dd></div>
                      <div className="flex gap-1.5"><dt>Factos</dt><dd className="text-foreground">{item.factCount}</dd></div>
                      <div className="flex gap-1.5"><dt>Vínculos</dt><dd className="text-foreground">{item.linkCount}</dd></div>
                      <div className="flex gap-1.5"><dt>Atualizado</dt><dd className="text-foreground">{new Date(item.updatedAt).toLocaleDateString('pt-PT')}</dd></div>
                    </dl>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  )
}
