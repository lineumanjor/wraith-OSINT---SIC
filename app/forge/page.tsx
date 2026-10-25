import { AppShell } from '@/components/app-shell'
import { LinkForge } from '@/components/forge/link-forge'

export const metadata = {
  title: 'Link Forge — Wraith OSINT',
}

export default function Page() {
  return (
    <AppShell>
      <div className="mx-auto w-full max-w-[1500px] px-4 py-6 sm:px-6 lg:py-8">
        <p className="font-mono text-[10px] tracking-[0.22em] text-primary/80 uppercase">
          Módulo 02
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          Link Forge
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          Gere links de redirecionamento imediato. O Spectre Engine registra a telemetria no
          servidor e o visitante segue direto para o destino, sem página intermédia.
        </p>

        <div className="mt-6">
          <LinkForge />
        </div>
      </div>
    </AppShell>
  )
}
