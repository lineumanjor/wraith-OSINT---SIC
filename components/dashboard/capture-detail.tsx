import { flagEmoji, relativeTime, shortDate, clockTime } from '@/lib/format'
import type { Capture } from '@/lib/spectre/types'
import { cn } from '@/lib/utils'
import { Cpu, Fingerprint, Globe2, MonitorSmartphone, Network, Radar } from 'lucide-react'

function Field({ label, value }: { label: string; value: string | number | null | undefined }) {
  const empty = value === null || value === undefined || value === ''
  return (
    <div className="min-w-0">
      <dt className="font-mono text-[9px] tracking-[0.14em] text-muted-foreground/70 uppercase">
        {label}
      </dt>
      <dd
        className={cn(
          'mt-0.5 truncate font-mono text-[11px]',
          empty ? 'text-muted-foreground/40' : 'text-foreground/90',
        )}
        title={empty ? undefined : String(value)}
      >
        {empty ? '—' : value}
      </dd>
    </div>
  )
}

function Section({
  title,
  icon: Icon,
  children,
}: {
  title: string
  icon: typeof Cpu
  children: React.ReactNode
}) {
  return (
    <section className="border-t border-border px-4 py-3 first:border-t-0">
      <h3 className="mb-2 flex items-center gap-1.5 font-mono text-[10px] tracking-[0.16em] text-primary/80 uppercase">
        <Icon className="size-3" aria-hidden />
        {title}
      </h3>
      <dl className="grid grid-cols-2 gap-x-3 gap-y-2.5">{children}</dl>
    </section>
  )
}

export function CaptureDetail({ capture }: { capture: Capture | null }) {
  if (!capture) {
    return (
      <div className="flex h-full min-h-64 flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-card/40 p-6 text-center">
        <Radar className="size-7 text-muted-foreground/40" aria-hidden />
        <p className="max-w-[16rem] text-xs leading-relaxed text-muted-foreground">
          Selecione um perfil no feed para inspecionar o fingerprint completo do dispositivo.
        </p>
      </div>
    )
  }

  const location = [capture.city, capture.region, capture.country].filter(Boolean).join(' · ')

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-xl border border-border bg-card">
      <div className="flex items-start justify-between gap-3 border-b border-border px-4 py-3">
        <div className="min-w-0">
          <p className="font-mono text-[10px] tracking-[0.16em] text-muted-foreground uppercase">
            Perfil #{capture.id}
          </p>
          <p className="mt-0.5 truncate text-sm font-medium text-foreground">
            {capture.deviceModel || capture.os || 'Dispositivo desconhecido'}
          </p>
          <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
            {capture.linkLabel ?? capture.linkId} · {relativeTime(capture.createdAt)}
          </p>
        </div>
        <span
          className={cn(
            'shrink-0 rounded-full border px-2 py-0.5 font-mono text-[9px] tracking-[0.12em] uppercase',
            capture.isBot
              ? 'border-amber-400/30 bg-amber-400/10 text-amber-300'
              : 'border-accent/30 bg-accent/10 text-accent',
          )}
        >
          {capture.isBot ? 'bot' : (capture.deviceType ?? 'n/d')}
        </span>
      </div>

      <div className="scrollbar-thin flex-1 overflow-y-auto">
        <Section title="Rede e geolocalização" icon={Globe2}>
          <Field label="IP" value={capture.ip} />
          <Field label="ASN" value={capture.asn} />
          <Field label="Operadora / AS" value={capture.asOrg} />
          <Field label="País" value={capture.country ? `${flagEmoji(capture.countryCode)} ${capture.country}` : null} />
          <Field label="Região" value={capture.region} />
          <Field label="Cidade" value={capture.city} />
          <Field
            label="Coordenadas"
            value={
              capture.latitude != null && capture.longitude != null
                ? `${capture.latitude.toFixed(3)}, ${capture.longitude.toFixed(3)}`
                : null
            }
          />
          <Field label="Fuso" value={capture.timezone} />
        </Section>

        <Section title="Perfil de dispositivo" icon={MonitorSmartphone}>
          <Field label="Sistema" value={[capture.os, capture.osVersion].filter(Boolean).join(' ')} />
          <Field label="Plataforma" value={capture.platform} />
          <Field label="Navegador" value={[capture.browser, capture.browserVersion].filter(Boolean).join(' ')} />
          <Field label="Engine" value={capture.engine} />
          <Field label="Fabricante" value={capture.vendor} />
          <Field label="Modelo" value={capture.deviceModel} />
          <Field label="Tela" value={capture.screen} />
          <Field label="Viewport" value={capture.viewport} />
        </Section>

        <Section title="Hardware" icon={Cpu}>
          <Field label="Núcleos" value={capture.hardwareConcurrency} />
          <Field label="Memória" value={capture.deviceMemory ? `${capture.deviceMemory} GB` : null} />
          <Field label="Pixel ratio" value={capture.pixelRatio} />
          <Field label="Profundidade" value={capture.colorDepth ? `${capture.colorDepth}-bit` : null} />
          <Field label="Toques" value={capture.touchPoints} />
          <Field label="Conexão" value={capture.connection} />
          <Field label="GPU" value={capture.gpu} />
          <Field label="Idiomas" value={capture.languages} />
        </Section>

        <Section title="Fluxo de acesso" icon={Network}>
          <Field label="Link" value={capture.linkId} />
          <Field label="Sessão" value={capture.sessionId} />
          <Field label="Referrer ID" value={capture.referrerId} />
          <Field label="Referrer" value={capture.referrer} />
          <Field label="Data" value={shortDate(capture.createdAt)} />
          <Field label="Hora" value={clockTime(capture.createdAt)} />
        </Section>

        <section className="border-t border-border px-4 py-3">
          <h3 className="mb-1.5 flex items-center gap-1.5 font-mono text-[10px] tracking-[0.16em] text-primary/80 uppercase">
            <Fingerprint className="size-3" aria-hidden />
            User-Agent bruto
          </h3>
          <p className="rounded-md bg-background/60 p-2 font-mono text-[10px] leading-relaxed break-all text-muted-foreground">
            {capture.userAgent || '—'}
          </p>
        </section>
      </div>
    </div>
  )
}
