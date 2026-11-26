import Link from 'next/link'
import { notFound } from 'next/navigation'
import {
  Activity,
  ArrowLeft,
  ArrowUpRight,
  CalendarDays,
  CheckCircle2,
  Clock3,
  ExternalLink,
  Globe2,
  Link2,
  MonitorSmartphone,
  Power,
  ShieldCheck,
  Smartphone,
  Target,
  Terminal,
} from 'lucide-react'
import { and, count, desc, eq, gte } from 'drizzle-orm'

import { db } from '@/lib/db'
import {
  captures,
  investigations,
  links,
} from '@/lib/db/schema'

export const dynamic = 'force-dynamic'

type PageProps = {
  params: Promise<{ id: string }>
}

function formatDate(value: Date | string | null) {
  if (!value) return 'Não disponível'

  return new Intl.DateTimeFormat('pt-PT', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

function getDeviceLabel(device: string | null) {
  if (!device) return 'Desconhecido'

  const value = device.toLowerCase()

  if (value.includes('mobile')) return 'Telemóvel'
  if (value.includes('tablet')) return 'Tablet'
  if (value.includes('desktop')) return 'Computador'

  return device
}

function StatCard({
  label,
  value,
  description,
  icon: Icon,
}: {
  label: string
  value: string | number
  description: string
  icon: typeof Activity
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">{label}</span>
        <Icon className="size-4 text-primary" />
      </div>

      <div className="mt-3 text-2xl font-semibold tracking-tight">
        {value}
      </div>

      <p className="mt-1 text-[11px] text-muted-foreground">
        {description}
      </p>
    </div>
  )
}

export default async function LinkAnalysisPage({
  params,
}: PageProps) {
  const { id } = await params

  // Procurar link
  const [link] = await db
    .select()
    .from(links)
    .where(eq(links.id, id))
    .limit(1)

  if (!link) {
    notFound()
  }

  // Período das últimas 24 horas
  const last24Hours = new Date(
    Date.now() - 24 * 60 * 60 * 1000,
  )

  // Consultar estatísticas e actividade
  const [
    [totalResult],
    [recentResult],
    [botResult],
    [nonBotResult],
    investigation,
    activity,
  ] = await Promise.all([
    db
      .select({ total: count() })
      .from(captures)
      .where(eq(captures.linkId, link.id)),

    db
      .select({ total: count() })
      .from(captures)
      .where(
        and(
          eq(captures.linkId, link.id),
          gte(captures.createdAt, last24Hours),
        ),
      ),

    db
      .select({ total: count() })
      .from(captures)
      .where(
        and(
          eq(captures.linkId, link.id),
          eq(captures.isBot, true),
        ),
      ),

    db
      .select({ total: count() })
      .from(captures)
      .where(
        and(
          eq(captures.linkId, link.id),
          eq(captures.isBot, false),
        ),
      ),

    link.investigationId
      ? db
          .select()
          .from(investigations)
          .where(
            eq(investigations.id, link.investigationId),
          )
          .limit(1)
          .then((rows) => rows[0] ?? null)
      : Promise.resolve(null),

    db
      .select({
        id: captures.id,
        createdAt: captures.createdAt,
        deviceType: captures.deviceType,
        browser: captures.browser,
        os: captures.os,
        isBot: captures.isBot,
      })
      .from(captures)
      .where(eq(captures.linkId, link.id))
      .orderBy(desc(captures.createdAt))
      .limit(30),
  ])

  const total = totalResult?.total ?? 0
  const recent = recentResult?.total ?? 0
  const bots = botResult?.total ?? 0
  const nonBots = nonBotResult?.total ?? 0

  // Estatísticas dos últimos 30 registos apresentados
  const mobileEvents = activity.filter(
    (item) =>
      item.deviceType?.toLowerCase() === 'mobile' ||
      item.deviceType?.toLowerCase() === 'tablet',
  ).length

  const mobilePercentage = activity.length
    ? Math.round((mobileEvents / activity.length) * 100)
    : 0

  // Construção correcta do endereço público
  const publicAddress = link.slug
    ? `${link.host ? `https://${link.host}` : ''}/l/${link.slug}`
    : null

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">

        {/* Navegação */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Link
              href="/"
              className="transition-colors hover:text-foreground"
            >
              Investigações
            </Link>

            <span>/</span>

            {investigation && (
              <>
                <Link
                  href={`/cases/${investigation.id}`}
                  className="max-w-[160px] truncate hover:text-foreground"
                >
                  {investigation.name}
                </Link>

                <span>/</span>
              </>
            )}

            <span className="text-foreground">
              Análise do link
            </span>
          </div>

          <Link
            href={
              investigation
                ? `/cases/${investigation.id}`
                : '/'
            }
            className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-xs transition-colors hover:bg-muted"
          >
            <ArrowLeft className="size-3.5" />
            Voltar
          </Link>
        </div>

        {/* Cabeçalho */}
        <section className="rounded-2xl border border-border bg-card p-5 sm:p-6">
          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
            <div className="flex items-start gap-4">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-xl border border-primary/20 bg-primary/10">
                <Link2 className="size-6 text-primary" />
              </div>

              <div className="min-w-0">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    WRAITH / LINK ANALYSIS
                  </span>

                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-medium ${
                      link.active
                        ? 'bg-emerald-500/10 text-emerald-500'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    <span className="size-1.5 rounded-full bg-current" />
                    {link.active ? 'Activo' : 'Desactivado'}
                  </span>
                </div>

                <h1 className="break-words text-xl font-semibold sm:text-2xl">
                  {link.label}
                </h1>

                <p className="mt-2 break-all text-xs text-muted-foreground">
                  ID: {link.id}
                </p>
              </div>
            </div>

            <span className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-xs text-muted-foreground">
              <Power className="size-3.5" />
              {link.active ? 'Link operacional' : 'Link inactivo'}
            </span>
          </div>

          <div className="mt-6 grid gap-4 border-t border-border pt-5 sm:grid-cols-2">
            <div className="min-w-0">
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Destino configurado
              </p>

              <a
                href={link.destination}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex max-w-full items-center gap-2 break-all text-xs text-primary hover:underline"
              >
                {link.destination}
                <ExternalLink className="size-3.5 shrink-0" />
              </a>
            </div>

            <div className="min-w-0">
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Endereço público
              </p>

              {publicAddress ? (
                <p className="break-all text-xs text-foreground">
                  {publicAddress}
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Não configurado
                </p>
              )}
            </div>
          </div>
        </section>

        {/* Indicadores */}
        <section>
          <div className="mb-3 flex items-center gap-2">
            <Activity className="size-4 text-primary" />

            <h2 className="text-sm font-semibold">
              Indicadores de actividade
            </h2>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="Acessos registados"
              value={total}
              description="Total de registos deste link"
              icon={Activity}
            />

            <StatCard
              label="Últimas 24 horas"
              value={recent}
              description="Registos nas últimas 24 horas"
              icon={Clock3}
            />

            <StatCard
              label="Não classificados como bots"
              value={nonBots}
              description="Não confirma identidade humana"
              icon={ShieldCheck}
            />

            <StatCard
              label="Possíveis bots"
              value={bots}
              description="Eventos classificados pelo sistema"
              icon={Globe2}
            />
          </div>
        </section>

        {/* Ambiente técnico */}
        <section className="grid gap-4 lg:grid-cols-2">

          <div className="rounded-xl border border-border bg-card p-5">
            <div className="mb-5 flex items-center gap-2">
              <MonitorSmartphone className="size-4 text-primary" />

              <h2 className="text-sm font-semibold">
                Ambiente técnico
              </h2>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between gap-4">
                <span className="text-xs text-muted-foreground">
                  Dispositivos móveis
                </span>

                <span className="text-sm font-medium">
                  {mobilePercentage}%
                </span>
              </div>

              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{
                    width: `${mobilePercentage}%`,
                  }}
                />
              </div>

              <p className="text-[11px] text-muted-foreground">
                Percentagem calculada sobre os últimos {activity.length} registos apresentados.
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-5">
            <div className="mb-5 flex items-center gap-2">
              <Terminal className="size-4 text-primary" />

              <h2 className="text-sm font-semibold">
                Configuração
              </h2>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs text-muted-foreground">
                  Modo de redireccionamento
                </span>

                <span className="rounded-md bg-muted px-2 py-1 text-xs">
                  {link.redirectMode}
                </span>
              </div>

              <div className="flex items-center justify-between gap-3">
                <span className="text-xs text-muted-foreground">Título do cartão</span>
                <span className="max-w-[180px] truncate text-xs">{link.previewTitle || link.label}</span>
              </div>

              {link.previewDescription && (
                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground">Descrição do cartão</span>
                  <p className="text-xs leading-relaxed">{link.previewDescription}</p>
                </div>
              )}

              <div className="flex items-center justify-between gap-3">
                <span className="text-xs text-muted-foreground">Domínio de destino</span>
                <span className="max-w-[180px] truncate font-mono text-xs">{link.previewSource || new URL(link.destination).hostname}</span>
              </div>

              <div className="flex items-center justify-between gap-3">
                <span className="text-xs text-muted-foreground">
                  Host configurado
                </span>

                <span className="max-w-[180px] truncate text-xs">
                  {link.host || 'Padrão'}
                </span>
              </div>

              <div className="flex items-center justify-between gap-3">
                <span className="text-xs text-muted-foreground">
                  Data de criação
                </span>

                <span className="text-xs">
                  {formatDate(link.createdAt)}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Investigação associada */}
        <section className="rounded-xl border border-border bg-card p-5">
          <div className="mb-4 flex items-center gap-2">
            <Target className="size-4 text-primary" />

            <h2 className="text-sm font-semibold">
              Contexto da investigação
            </h2>
          </div>

          {investigation ? (
            <Link
              href={`/cases/${investigation.id}`}
              className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border p-4 transition-colors hover:bg-muted/50"
            >
              <div>
                <p className="text-sm font-medium">
                  {investigation.name}
                </p>

                <p className="mt-1 text-xs text-muted-foreground">
                  {investigation.description || 'Sem descrição registada.'}
                </p>
              </div>

              <ArrowUpRight className="size-4 text-muted-foreground" />
            </Link>
          ) : (
            <p className="rounded-lg border border-dashed border-border p-4 text-xs text-muted-foreground">
              Este link não está associado a uma investigação.
            </p>
          )}
        </section>

        {/* Actividade recente */}
        <section className="overflow-hidden rounded-xl border border-border bg-card">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-5">
            <div>
              <div className="flex items-center gap-2">
                <CalendarDays className="size-4 text-primary" />

                <h2 className="text-sm font-semibold">
                  Registos de actividade
                </h2>
              </div>

              <p className="mt-1 text-xs text-muted-foreground">
                Últimos 30 eventos registados para este link.
              </p>
            </div>

            <span className="rounded-md bg-muted px-2.5 py-1 text-[10px] text-muted-foreground">
              {activity.length} registos
            </span>
          </div>

          {activity.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[650px] text-left">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Data e hora
                    </th>

                    <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Dispositivo
                    </th>

                    <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Navegador
                    </th>

                    <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Sistema
                    </th>

                    <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Classificação
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {activity.map((item) => (
                    <tr
                      key={item.id}
                      className="border-b border-border/60 last:border-0"
                    >
                      <td className="px-5 py-4 text-xs">
                        {formatDate(item.createdAt)}
                      </td>

                      <td className="px-5 py-4">
                        <span className="inline-flex items-center gap-2 text-xs">
                          <Smartphone className="size-3.5 text-muted-foreground" />

                          {getDeviceLabel(item.deviceType)}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-xs">
                        {item.browser || 'Desconhecido'}
                      </td>

                      <td className="px-5 py-4 text-xs">
                        {item.os || 'Desconhecido'}
                      </td>

                      <td className="px-5 py-4">
                        {item.isBot === true ? (
                          <span className="rounded-full bg-amber-500/10 px-2 py-1 text-[10px] text-amber-500">
                            Possível bot
                          </span>
                        ) : item.isBot === false ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-1 text-[10px] text-emerald-500">
                            <CheckCircle2 className="size-3" />
                            Não classificado como bot
                          </span>
                        ) : (
                          <span className="rounded-full bg-muted px-2 py-1 text-[10px] text-muted-foreground">
                            Não classificado
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center px-5 py-12 text-center">
              <div className="mb-3 flex size-12 items-center justify-center rounded-full bg-muted">
                <Activity className="size-5 text-muted-foreground" />
              </div>

              <p className="text-sm font-medium">
                Sem actividade registada
              </p>

              <p className="mt-1 max-w-sm text-xs text-muted-foreground">
                Quando o sistema registar eventos associados a este link,
                eles serão apresentados aqui.
              </p>
            </div>
          )}
        </section>

        {/* Privacidade */}
        <footer className="flex items-start gap-3 rounded-xl border border-border bg-muted/20 p-4">
          <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" />

          <p className="text-[11px] leading-relaxed text-muted-foreground">
            Os indicadores apresentados representam eventos registados
            pelo sistema. A classificação de um evento como não-bot não
            identifica uma pessoa. A recolha e utilização dos dados devem
            respeitar a legislação aplicável, a transparência e as
            autorizações necessárias.
          </p>
        </footer>

      </div>
    </main>
  )
}
