'use client'

import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { ArrowUpRight, BookOpen, ExternalLink, Search, ShieldCheck } from 'lucide-react'
import { useMemo, useState } from 'react'

const SOURCES = [
  {
    name: 'CISA KEV Catalog',
    category: 'Cibersegurança',
    description: 'Catálogo oficial de vulnerabilidades conhecidas como exploradas, mantido pela CISA.',
    url: 'https://www.cisa.gov/known-exploited-vulnerabilities-catalog',
    publisher: 'CISA · Governo dos EUA',
  },
  {
    name: 'NVD — National Vulnerability Database',
    category: 'Cibersegurança',
    description: 'Base pública do NIST para consulta de vulnerabilidades e respetivos identificadores CVE.',
    url: 'https://nvd.nist.gov/vuln/search',
    publisher: 'NIST · Governo dos EUA',
  },
  {
    name: 'MITRE ATT&CK',
    category: 'Cibersegurança',
    description: 'Base de conhecimento pública para compreender e classificar táticas e técnicas observadas.',
    url: 'https://attack.mitre.org/',
    publisher: 'MITRE',
  },
  {
    name: 'ICANN Lookup',
    category: 'Infraestrutura pública',
    description: 'Consulta de dados públicos de registo de nomes de domínio através do serviço da ICANN.',
    url: 'https://lookup.icann.org/',
    publisher: 'ICANN',
  },
  {
    name: 'Internet Archive — Wayback Machine',
    category: 'Arquivo e contexto',
    description: 'Arquivo público para consultar versões históricas de páginas disponibilizadas na web.',
    url: 'https://web.archive.org/',
    publisher: 'Internet Archive',
  },
  {
    name: 'NIST SP 800-86',
    category: 'Prova digital',
    description: 'Guia de referência para integração de técnicas forenses na resposta a incidentes.',
    url: 'https://csrc.nist.gov/pubs/sp/800/86/final',
    publisher: 'NIST · Publicação técnica',
  },
]

const CATEGORIES = ['Todas', ...Array.from(new Set(SOURCES.map((source) => source.category)))]

export function FrameworkCatalog() {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('Todas')
  const filteredSources = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    return SOURCES.filter((source) => {
      const matchesCategory = category === 'Todas' || source.category === category
      const matchesQuery =
        !normalizedQuery ||
        `${source.name} ${source.description} ${source.publisher} ${source.category}`
          .toLowerCase()
          .includes(normalizedQuery)
      return matchesCategory && matchesQuery
    })
  }, [category, query])

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:py-8">
      <header className="mb-6 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-2xl">
          <p className="font-mono text-[10px] tracking-[0.28em] text-muted-foreground uppercase">
            Referências · fontes públicas
          </p>
          <h1 className="mt-1.5 text-2xl font-semibold tracking-tight text-foreground">
            Framework OSINT
          </h1>
          <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
            Catálogo educativo de fontes públicas para apoiar pesquisa, validação e documentação em
            investigações autorizadas.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-border bg-card/40 px-3 py-2">
          <BookOpen className="size-4 text-primary" aria-hidden />
          <span className="font-mono text-[11px] text-muted-foreground">
            {SOURCES.length} fontes selecionadas
          </span>
        </div>
      </header>

      <aside className="mb-5 flex items-start gap-3 rounded-xl border border-accent/20 bg-accent/[0.05] p-3.5" aria-label="Âmbito do catálogo">
        <ShieldCheck className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden />
        <p className="text-xs leading-relaxed text-muted-foreground">
          As ligações abrem os sites das respetivas entidades. Este catálogo não consulta, recolhe ou
          enriquece dados automaticamente.
        </p>
      </aside>

      <div className="mb-5 flex flex-col gap-3">
        <label className="relative block max-w-xl">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <span className="sr-only">Pesquisar fontes</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Pesquisar por fonte, tema ou entidade…"
            className="w-full rounded-lg border border-border bg-card/40 py-2.5 pr-3 pl-9 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-primary/60 focus:ring-2 focus:ring-primary/20"
          />
        </label>
        <div className="flex gap-2 overflow-x-auto pb-1" aria-label="Filtrar por categoria">
          {CATEGORIES.map((item) => {
            const selected = category === item
            return (
              <button
                key={item}
                type="button"
                aria-pressed={selected}
                onClick={() => setCategory(item)}
                className={cn(
                  'shrink-0 rounded-full border px-3 py-1.5 text-xs transition-colors',
                  selected
                    ? 'border-primary/50 bg-primary/10 text-foreground'
                    : 'border-border text-muted-foreground hover:border-primary/30 hover:text-foreground',
                )}
              >
                {item}
              </button>
            )
          })}
        </div>
      </div>

      {filteredSources.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card/20 px-4 py-12 text-center text-sm text-muted-foreground">
          Nenhuma fonte corresponde à pesquisa.
        </div>
      ) : (
        <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {filteredSources.map((source) => (
            <li key={source.name}>
              <article className="flex h-full flex-col rounded-xl border border-border bg-card/40 p-4 transition-colors hover:border-primary/35 hover:bg-card/70">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <Badge variant="secondary">{source.category}</Badge>
                    <h2 className="mt-3 text-sm font-semibold text-foreground">{source.name}</h2>
                  </div>
                  <ExternalLink className="mt-1 size-4 shrink-0 text-muted-foreground" aria-hidden />
                </div>
                <p className="mt-2 flex-1 text-xs leading-relaxed text-muted-foreground">
                  {source.description}
                </p>
                <div className="mt-4 flex items-center justify-between gap-2 border-t border-border pt-3">
                  <span className="truncate font-mono text-[10px] text-muted-foreground">{source.publisher}</span>
                  <a
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex shrink-0 items-center gap-1 font-mono text-[10px] tracking-wide text-primary uppercase hover:text-primary/80"
                  >
                    Abrir fonte <ArrowUpRight className="size-3" aria-hidden />
                  </a>
                </div>
              </article>
            </li>
          ))}
        </ul>
      )}
      <p className="mt-4 text-right font-mono text-[10px] text-muted-foreground">
        A mostrar {filteredSources.length} de {SOURCES.length} fontes
      </p>
    </div>
  )
}
