import { AppShell } from '@/components/app-shell'
import { Terminal } from '@/components/terminal/terminal'
import type { Metadata } from 'next'
import { Suspense } from 'react'

export const metadata: Metadata = {
  title: 'Spectre Terminal · Wraith OSINT',
  description: 'Enumeração de perfis públicos, DNS e geolocalização por linha de comando.',
}

export default function TerminalPage() {
  return (
    <AppShell>
      <Suspense
        fallback={
          <div className="mx-auto w-full max-w-6xl px-4 py-16 font-mono text-sm text-muted-foreground sm:px-6">
            a iniciar shell…
          </div>
        }
      >
        <Terminal />
      </Suspense>
    </AppShell>
  )
}
