'use client'

import { PREVIEW_STYLES } from '@/components/ghost-preview'
import type { PreviewStyle } from '@/lib/spectre/types'
import { cn } from '@/lib/utils'
import { Smartphone, Monitor, MapPin, ShieldCheck } from 'lucide-react'
import { useMemo, useState } from 'react'

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
  const [htmlTemplate, setHtmlTemplate] = useState(
    '<article><h2>{{title}}</h2><p>{{description}}</p><small>{{source}}</small></article>',
  )
  const [locationStatus, setLocationStatus] = useState('A localização não foi solicitada.')

  const safeTemplate = useMemo(() => {
    if (typeof DOMParser === 'undefined') return ''
    const parsed = new DOMParser().parseFromString(htmlTemplate, 'text/html')
    const allowedTags = new Set(['ARTICLE', 'SECTION', 'DIV', 'H1', 'H2', 'H3', 'P', 'SPAN', 'SMALL', 'STRONG', 'EM', 'BR', 'UL', 'OL', 'LI'])
    const clean = (node: Node): string => {
      if (node.nodeType === Node.TEXT_NODE) {
        return (node.textContent ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
      }
      if (!(node instanceof HTMLElement) || !allowedTags.has(node.tagName)) {
        return Array.from(node.childNodes).map(clean).join('')
      }
      const tag = node.tagName.toLowerCase()
      const inner = Array.from(node.childNodes).map(clean).join('')
      return `<${tag}>${inner}</${tag}>`
    }
    const escapeValue = (value: string) => value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
    const interpolated = parsed.body.innerHTML
      .replaceAll('{{title}}', escapeValue(title))
      .replaceAll('{{description}}', escapeValue(description))
      .replaceAll('{{source}}', escapeValue(source))
    const template = new DOMParser().parseFromString(interpolated, 'text/html')
    return Array.from(template.body.childNodes).map(clean).join('')
  }, [htmlTemplate, title, description, source])

  function requestLocationForReward() {
    if (!navigator.geolocation) {
      setLocationStatus('Este navegador não oferece geolocalização. Nenhum dado foi coletado.')
      return
    }
    setLocationStatus('Aguardando sua decisão na solicitação de localização do navegador…')
    navigator.geolocation.getCurrentPosition(
      () => setLocationStatus('Consentimento confirmado. Recompensa de demonstração liberada; as coordenadas não foram armazenadas nem enviadas.'),
      (error) => setLocationStatus(error.code === error.PERMISSION_DENIED
        ? 'Acesso não autorizado ou cancelado. Nenhuma localização foi acessada e a recompensa não foi liberada.'
        : 'Não foi possível obter a localização. Nenhuma coordenada foi armazenada ou enviada.'),
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 },
    )
  }

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

        <section className="rounded-xl border border-border bg-card">
          <div className="border-b border-border px-4 py-3">
            <h2 className="text-sm font-medium text-foreground">Template HTML próprio</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Use {'{{title}}'}, {'{{description}}'} e {'{{source}}'}. Tags permitidas são exibidas sem scripts, atributos ou links.
            </p>
          </div>
          <div className="p-4">
            <label htmlFor="html-template" className="font-mono text-[10px] tracking-[0.14em] text-muted-foreground uppercase">
              Estrutura HTML
            </label>
            <textarea
              id="html-template"
              value={htmlTemplate}
              onChange={(event) => setHtmlTemplate(event.target.value)}
              rows={6}
              spellCheck={false}
              className="mt-1.5 w-full resize-y rounded-lg border border-input bg-background/60 px-3 py-2 font-mono text-xs text-foreground focus:border-primary/60 focus:ring-2 focus:ring-primary/20 focus:outline-none"
            />
            <p className="mt-2 text-xs text-muted-foreground">A prévia abaixo aplica uma lista segura de tags e remove scripts e atributos.</p>
          </div>
        </section>

        <section className="rounded-xl border border-border bg-card p-4" aria-labelledby="location-reward-title">
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
            <div>
              <h2 id="location-reward-title" className="text-sm font-medium text-foreground">Recompensa com GPS — consentimento explícito</h2>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                A localização só é solicitada quando você pressiona o botão. O navegador mostrará a permissão; se aceitar, esta demonstração libera a recompensa sem salvar ou enviar coordenadas.
              </p>
            </div>
          </div>
          <button type="button" onClick={requestLocationForReward} className="mt-3 inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-xs font-medium text-primary-foreground hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">
            <MapPin className="size-3.5" aria-hidden />
            Autorizar GPS e verificar recompensa
          </button>
          <p className="mt-2 text-xs text-muted-foreground" role="status" aria-live="polite">{locationStatus}</p>
        </section>
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
                  'relative overflow-hidden bg-[#fffdf5]',
                  frame === 'mobile' ? 'rounded-[1.6rem]' : 'rounded-xl',
                )}
              >
                <div className="flex items-center justify-between border-b border-neutral-200 px-3 py-1.5">
                  <span className="font-mono text-[9px] text-neutral-500">Prévia de template</span>
                  <span className="font-mono text-[9px] text-neutral-500">fundo marfim</span>
                </div>
                <div className="flex min-h-[19rem] items-center justify-center p-4">
                  <p className="text-xs text-neutral-400">Espaço reservado para o conteúdo do seu template.</p>
                </div>
                <div className="border-t border-neutral-200 bg-[#fffdf5] p-4">
                  <p className="mb-2 font-mono text-[9px] tracking-[0.14em] text-neutral-500 uppercase">Prévia do seu HTML</p>
                  <iframe
                    title="Prévia segura do template HTML"
                    sandbox=""
                    srcDoc={`<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{margin:0;padding:12px;font:14px system-ui,sans-serif;color:#26251f}article,section,div{max-width:100%}h1,h2,h3,p{margin:0 0 8px}small{color:#6b675d}</style></head><body>${safeTemplate}</body></html>`}
                    className="min-h-32 w-full rounded-lg border border-neutral-200 bg-[#fffdf5]"
                    referrerPolicy="no-referrer"
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
