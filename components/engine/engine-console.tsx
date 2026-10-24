'use client'

import { collectFingerprint } from '@/lib/spectre/collect-client'
import type { ClientFingerprint } from '@/lib/spectre/types'
import { cn } from '@/lib/utils'
import { Cpu, Fingerprint, Globe2, Loader2, Network, Play, RotateCcw } from 'lucide-react'
import { useState } from 'react'

const STAGES = [
  {
    code: 'S1',
    title: 'Handshake',
    detail: 'Requisição recebida no edge. IP resolvido via x-forwarded-for.',
    icon: Network,
    budget: '0 ms',
  },
  {
    code: 'S2',
    title: 'Fingerprint',
    detail: 'Script síncrono coleta tela, hardware, GPU, fuso e idiomas.',
    icon: Fingerprint,
    budget: '~12 ms',
  },
  {
    code: 'S3',
    title: 'Enriquecimento',
    detail: 'Lookup de ASN, operadora e coordenadas estimadas a partir do IP.',
    icon: Globe2,
    budget: '~180 ms',
  },
  {
    code: 'S4',
    title: 'Persistência',
    detail: 'Perfil gravado no Postgres e publicado no dashboard em até 5 s.',
    icon: Cpu,
    budget: '~8 ms',
  },
]

const FIELD_GROUPS = [
  {
    title: 'Profiling de dispositivo',
    fields: [
      ['os / osVersion', 'Sistema operacional e versão derivados do User-Agent'],
      ['engine', 'Blink, Gecko ou WebKit'],
      ['browser / browserVersion', 'Navegador e build'],
      ['deviceType / deviceModel', 'mobile, tablet, desktop, bot'],
      ['screen / viewport', 'Resolução física e área útil'],
      ['hardwareConcurrency', 'Núcleos lógicos expostos'],
      ['deviceMemory', 'Memória aproximada em GB'],
      ['gpu', 'Renderer WebGL não mascarado'],
    ],
  },
  {
    title: 'Geolocalização e rede',
    fields: [
      ['ip', 'Endereço de origem da conexão'],
      ['asn / asOrg', 'Sistema autônomo e operadora'],
      ['country / region / city', 'Localização estimada por IP'],
      ['latitude / longitude', 'Centróide do bloco de rede'],
      ['timezone', 'Fuso IANA do dispositivo'],
    ],
  },
  {
    title: 'Interceptação de fluxo',
    fields: [
      ['userAgent', 'String bruta completa'],
      ['referrer', 'Cabeçalho Referer da requisição'],
      ['referrerId', 'Parâmetro ref/utm_source do link'],
      ['sessionId', 'Identificador efêmero por acesso'],
      ['isBot', 'Detecção de crawlers de preview'],
    ],
  },
]

export function EngineConsole() {
  const [payload, setPayload] = useState<ClientFingerprint | null>(null)
  const [running, setRunning] = useState(false)

  function run() {
    setRunning(true)
    setPayload(null)
    window.setTimeout(() => {
      setPayload(collectFingerprint())
      setRunning(false)
    }, 420)
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {STAGES.map((stage) => {
          const Icon = stage.icon
          return (
            <div
              key={stage.code}
              className="relative overflow-hidden rounded-xl border border-border bg-card p-4"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] tracking-[0.16em] text-primary/80 uppercase">
                  {stage.code}
                </span>
                <Icon className="size-3.5 text-muted-foreground/70" aria-hidden />
              </div>
              <p className="mt-2 text-sm font-medium text-foreground">{stage.title}</p>
              <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
                {stage.detail}
              </p>
              <p className="mt-2 font-mono text-[10px] text-accent">{stage.budget}</p>
            </div>
          )
        })}
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <div className="rounded-xl border border-border bg-card">
            <div className="border-b border-border px-4 py-3">
              <h2 className="text-sm font-medium text-foreground">Captura de teste</h2>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Executa o coletor no seu próprio navegador. Nada é gravado.
              </p>
            </div>
            <div className="p-4">
              <button
                type="button"
                onClick={run}
                disabled={running}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {running ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                ) : payload ? (
                  <RotateCcw className="size-4" aria-hidden />
                ) : (
                  <Play className="size-4" aria-hidden />
                )}
                {payload ? 'Executar novamente' : 'Executar captura'}
              </button>

              <div className="mt-4">
                <p className="font-mono text-[10px] tracking-[0.14em] text-muted-foreground uppercase">
                  Payload do cliente
                </p>
                <pre
                  className={cn(
                    'scrollbar-thin mt-1.5 max-h-72 overflow-auto rounded-lg border border-border bg-background/70 p-3 font-mono text-[10px] leading-relaxed',
                    payload ? 'text-foreground/85' : 'text-muted-foreground/50',
                  )}
                >
                  {payload
                    ? JSON.stringify(payload, null, 2)
                    : running
                      ? 'coletando…'
                      : '// aguardando execução'}
                </pre>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4 lg:col-span-3">
          {FIELD_GROUPS.map((group) => (
            <div key={group.title} className="overflow-hidden rounded-xl border border-border bg-card">
              <div className="border-b border-border px-4 py-2.5">
                <h3 className="font-mono text-[10px] tracking-[0.16em] text-primary/80 uppercase">
                  {group.title}
                </h3>
              </div>
              <dl className="divide-y divide-border">
                {group.fields.map(([field, description]) => (
                  <div
                    key={field}
                    className="grid grid-cols-1 gap-0.5 px-4 py-2 sm:grid-cols-[minmax(0,11rem)_1fr] sm:gap-3"
                  >
                    <dt className="font-mono text-[11px] text-foreground/90">{field}</dt>
                    <dd className="text-[11px] leading-relaxed text-muted-foreground">
                      {description}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
