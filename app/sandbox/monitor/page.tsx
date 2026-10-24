import { AppShell } from '@/components/app-shell'
import { SandboxMonitor } from '@/components/sandbox/sandbox-monitor'
import { buttonVariants } from '@/components/ui/button'
import { listSessions } from '@/lib/sandbox/queries'
import { cn } from '@/lib/utils'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export const metadata = {
  title: 'Monitorização de Treino — Wraith OSINT',
}

export const dynamic = 'force-dynamic'

export default async function Page() {
  const sessions = await listSessions()

  return (
    <AppShell>
      <div className="mx-auto w-full max-w-[1500px] px-4 py-6 sm:px-6 lg:py-8">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="font-mono text-[10px] tracking-[0.22em] text-primary/80 uppercase">
              Módulo 07 · Monitorização
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              Sessões de treino
            </h1>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
              Registo das sessões concluídas, com a origem da localização e o estado de cada
              recolha.
            </p>
          </div>
          <Link
            href="/sandbox"
            className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'gap-1.5')}
          >
            <ArrowLeft className="size-3.5" aria-hidden />
            Simulador
          </Link>
        </div>

        <div className="mt-6">
          <SandboxMonitor sessions={sessions} />
        </div>
      </div>
    </AppShell>
  )
}
