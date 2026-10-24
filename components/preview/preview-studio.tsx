'use client'

import { GhostPreview, PREVIEW_STYLES } from '@/components/ghost-preview'
import type { PreviewStyle } from '@/lib/spectre/types'
import { cn } from '@/lib/utils'
import { Smartphone, Monitor } from 'lucide-react'
import { useState } from 'react'

const PRESETS: Record<PreviewStyle, { title: string; description: string; source: string }> = {
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

export function PreviewStudio() {
  const [style, setStyle] = useState<PreviewStyle>('messaging')
  const [title, setTitle] = useState(PRESETS.messaging.title)
  const [description, setDescription] = useState(PRESETS.messaging.description)
  const [source, setSource] = useState(PRESETS.messaging.source)
  const [frame, setFrame] = useState<'mobile' | 'desktop'>('mobile')

  function selectStyle(next: PreviewStyle) {
    setStyle(next)
    setTitle(PRESETS[next].title)
    setDescription(PRESETS[next].description)
    setSource(PRESETS[next].source)
  }

  return (
    <div className="grid gap-4 lg:grid-cols-5">
      <div className="space-y-4 lg:col-span-2">
        <div className="rounded-xl border border-border bg-card">
          <div className="border-b border-border px-4 py-3">
            <h2 className="text-sm font-medium text-foreground">Estilo do cartão</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Padrões de interface genéricos, sem marcas de terceiros.
            </p>
          </div>
          <div className="space-y-2 p-3">
            {PREVIEW_STYLES.map((option) => {
              const active = style === option.value
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => selectStyle(option.value)}
                  aria-pressed={active}
                  className={cn(
                    'w-full rounded-lg border p-3 text-left transition-colors',
                    active
                      ? 'border-primary/60 bg-primary/10'
                      : 'border-border bg-background/40 hover:border-primary/30',
                  )}
                >
                  <span className="flex items-center justify-between">
                    <span
                      className={cn(
                        'text-xs font-medium',
                        active ? 'text-foreground' : 'text-muted-foreground',
                      )}
                    >
                      {option.label}
                    </span>
                    <span
                      className={cn(
                        'size-1.5 rounded-full',
                        active ? 'bg-primary' : 'bg-muted-foreground/30',
                      )}
                      aria-hidden
                    />
                  </span>
                  <span className="mt-0.5 block text-[10px] leading-snug text-muted-foreground/70">
                    {option.hint}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card">
          <div className="border-b border-border px-4 py-3">
            <h2 className="text-sm font-medium text-foreground">Conteúdo</h2>
          </div>
          <div className="space-y-3 p-4">
            <label className="block">
              <span className="font-mono text-[10px] tracking-[0.14em] text-muted-foreground uppercase">
                Título
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
        </div>
      </div>

      <div className="lg:col-span-3">
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <div>
              <h2 className="text-sm font-medium text-foreground">Simulação de contexto</h2>
              <p className="mt-0.5 text-xs text-muted-foreground">
                O cartão é o único elemento visível antes do clique.
              </p>
            </div>
            <div className="flex rounded-lg border border-border p-0.5">
              <button
                type="button"
                onClick={() => setFrame('mobile')}
                aria-pressed={frame === 'mobile'}
                className={cn(
                  'flex items-center gap-1.5 rounded-md px-2 py-1 text-[11px] transition-colors',
                  frame === 'mobile'
                    ? 'bg-primary/15 text-foreground'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                <Smartphone className="size-3" aria-hidden />
                móvel
              </button>
              <button
                type="button"
                onClick={() => setFrame('desktop')}
                aria-pressed={frame === 'desktop'}
                className={cn(
                  'flex items-center gap-1.5 rounded-md px-2 py-1 text-[11px] transition-colors',
                  frame === 'desktop'
                    ? 'bg-primary/15 text-foreground'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                <Monitor className="size-3" aria-hidden />
                desktop
              </button>
            </div>
          </div>

          <div className="grid-field flex min-h-[26rem] items-center justify-center p-6">
            <div
              className={cn(
                'relative rounded-[2rem] border border-white/10 bg-[#0a0a0d] p-2.5 shadow-2xl transition-all',
                frame === 'mobile' ? 'w-[19rem]' : 'w-full max-w-2xl rounded-2xl',
              )}
            >
              <div
                className={cn(
                  'relative overflow-hidden bg-[#0d0f12]',
                  frame === 'mobile' ? 'rounded-[1.6rem]' : 'rounded-xl',
                )}
              >
                <div className="flex items-center justify-between border-b border-white/5 px-3 py-1.5">
                  <span className="font-mono text-[9px] text-white/35">9:41</span>
                  <span className="h-1 w-10 rounded-full bg-white/15" aria-hidden />
                  <span className="font-mono text-[9px] text-white/35">100%</span>
                </div>
                <div className="flex min-h-[19rem] items-center justify-center p-4">
                  <GhostPreview
                    style={style}
                    title={title || 'Título do preview'}
                    description={description}
                    source={source}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
