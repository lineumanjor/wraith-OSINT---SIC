import { AppShell } from '@/components/app-shell'
import { SandboxRunner } from '@/components/sandbox/sandbox-runner'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { ArrowUpRight } from 'lucide-react'
import Link from 'next/link'

export const metadata = {
  title: 'Simulador de Treino — Wraith OSINT',
}

export default function Page() {
  return (
    <AppShell>
      <div className="mx-auto w-full max-w-[1500px] px-4 py-6 sm:px-6 lg:py-8">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="font-mono text-[10px] tracking-[0.22em] text-primary/80 uppercase">
              Módulo 07
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              Simulador de Treino
            </h1>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
              Exercício de consciencialização sobre exposição de dados. O participante sabe que está
              numa simulação, autoriza o registo e vê exatamente o que ficou guardado.
            </p>
          </div>
          <Link
            href="/sandbox/monitor"
            className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'gap-1.5')}
          >
            Painel de monitorização
            <ArrowUpRight className="size-3.5" aria-hidden />
          </Link>
        </div>

        <div className="mt-6">
          <SandboxRunner />
        </div>
      </div>
    </AppShell>
  )
}
