'use client'

import { Smartphone, Monitor, Link2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { cn } from '@/lib/utils'

export function PreviewStudio() {
  const [destination, setDestination] = useState('https://example.org/documento')
  const [title, setTitle] = useState('Título da pré-visualização')
  const [description, setDescription] = useState('Descrição que será mostrada junto ao link quando partilhado.')
  const [frame, setFrame] = useState<'mobile' | 'desktop'>('mobile')

  const hostname = useMemo(() => {
    try {
      return new URL(destination).hostname
    } catch {
      return 'dominio.example'
    }
  }, [destination])

  const validUrl = useMemo(() => {
    try {
      const url = new URL(destination)
      return url.protocol === 'http:' || url.protocol === 'https:'
    } catch {
      return false
    }
  }, [destination])

  return (
    <div className="grid gap-4 lg:grid-cols-5">
      <section className="space-y-4 lg:col-span-2" aria-labelledby="metadata-heading">
        <div className="rounded-xl border border-border bg-card">
          <div className="border-b border-border px-4 py-3">
            <h2 id="metadata-heading" className="text-sm font-medium text-foreground">Metadados do link</h2>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              Insira o destino e ajuste o título e a descrição que quer apresentar. O domínio é sempre derivado do endereço real.
            </p>
          </div>
          <div className="space-y-4 p-4">
            <label className="block">
              <span className="font-mono text-[10px] tracking-[0.14em] text-muted-foreground uppercase">URL de destino</span>
              <input type="url" value={destination} onChange={(event) => setDestination(event.target.value)} maxLength={2048} placeholder="https://exemplo.org/pagina" className="mt-1.5 w-full rounded-lg border border-input bg-background/60 px-3 py-2 font-mono text-xs text-foreground focus:border-primary/60 focus:ring-2 focus:ring-primary/20 focus:outline-none" />
            </label>
            <label className="block">
              <span className="font-mono text-[10px] tracking-[0.14em] text-muted-foreground uppercase">Título</span>
              <input value={title} onChange={(event) => setTitle(event.target.value)} maxLength={160} className="mt-1.5 w-full rounded-lg border border-input bg-background/60 px-3 py-2 text-sm text-foreground focus:border-primary/60 focus:ring-2 focus:ring-primary/20 focus:outline-none" />
            </label>
            <label className="block">
              <span className="font-mono text-[10px] tracking-[0.14em] text-muted-foreground uppercase">Descrição</span>
              <textarea value={description} onChange={(event) => setDescription(event.target.value)} maxLength={320} rows={4} className="mt-1.5 w-full resize-y rounded-lg border border-input bg-background/60 px-3 py-2 text-sm text-foreground focus:border-primary/60 focus:ring-2 focus:ring-primary/20 focus:outline-none" />
            </label>
            {!validUrl && <p className="text-xs text-destructive" role="alert">Introduza um endereço http:// ou https:// válido.</p>}
          </div>
        </div>
        <p className="rounded-lg border border-border bg-card/60 px-3 py-2 text-xs leading-relaxed text-muted-foreground">
          Esta é uma simulação local dos metadados editados. Não carrega o site de destino nem altera os metadados publicados nele.
        </p>
      </section>

      <section className="lg:col-span-3" aria-labelledby="preview-heading">
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <div>
              <h2 id="preview-heading" className="text-sm font-medium text-foreground">Pré-visualização do link</h2>
              <p className="mt-1 text-xs text-muted-foreground">Cartão genérico com o domínio real do destino.</p>
            </div>
            <div className="flex rounded-lg border border-border p-0.5" aria-label="Largura da pré-visualização">
              <button type="button" onClick={() => setFrame('mobile')} aria-pressed={frame === 'mobile'} className={cn('flex items-center gap-1.5 rounded-md px-2 py-1 text-[11px] transition-colors', frame === 'mobile' ? 'bg-primary/15 text-foreground' : 'text-muted-foreground hover:text-foreground')}><Smartphone className="size-3" aria-hidden />Móvel</button>
              <button type="button" onClick={() => setFrame('desktop')} aria-pressed={frame === 'desktop'} className={cn('flex items-center gap-1.5 rounded-md px-2 py-1 text-[11px] transition-colors', frame === 'desktop' ? 'bg-primary/15 text-foreground' : 'text-muted-foreground hover:text-foreground')}><Monitor className="size-3" aria-hidden />Desktop</button>
            </div>
          </div>
          <div className="grid-field flex min-h-[25rem] items-center justify-center p-6">
            <article className={cn('w-full rounded-2xl border border-border bg-background p-4 shadow-xl transition-all', frame === 'mobile' ? 'max-w-sm' : 'max-w-2xl')}>
              <div className="flex items-start gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-primary/20 bg-primary/10 text-primary"><Link2 className="size-4" aria-hidden /></div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-foreground">{title || 'Título do link'}</p>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{description || 'Descrição do link'}</p>
                  <p className="mt-2 truncate font-mono text-[11px] text-primary">{hostname}</p>
                </div>
              </div>
              <p className="mt-4 break-all border-t border-border pt-3 font-mono text-[10px] text-muted-foreground">{destination || 'https://dominio.example/caminho'}</p>
            </article>
          </div>
        </div>
      </section>
    </div>
  )
}
