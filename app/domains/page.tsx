import { AppShell } from '@/components/app-shell'
import { DomainManager } from '@/components/domains/domain-manager'

export const metadata = {
  title: 'Domínios — Wraith OSINT',
}

export default function Page() {
  return (
    <AppShell>
      <div className="mx-auto w-full max-w-[1500px] px-4 py-6 sm:px-6 lg:py-8">
        <p className="font-mono text-[10px] tracking-[0.22em] text-primary/80 uppercase">
          Módulo 08
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          Domínios
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          Liga um domínio próprio aos links gerados. O host verificado substitui o domínio de
          desenvolvimento em todos os links novos.
        </p>

        <div className="mt-6">
          <DomainManager />
        </div>
      </div>
    </AppShell>
  )
}
