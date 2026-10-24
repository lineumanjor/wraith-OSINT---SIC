import { AppShell } from '@/components/app-shell'
import { EngineConsole } from '@/components/engine/engine-console'

export const metadata = {
  title: 'Spectre Engine — Wraith OSINT',
}

export default function Page() {
  return (
    <AppShell>
      <div className="mx-auto w-full max-w-[1500px] px-4 py-6 sm:px-6 lg:py-8">
        <p className="font-mono text-[10px] tracking-[0.22em] text-primary/80 uppercase">
          Módulo 04
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          Spectre Engine
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          Pipeline de captura executado no instante do acesso: fingerprint de dispositivo,
          enriquecimento de rede e persistência do perfil.
        </p>

        <div className="mt-6">
          <EngineConsole />
        </div>
      </div>
    </AppShell>
  )
}
