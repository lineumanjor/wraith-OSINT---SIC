import { AppShell } from '@/components/app-shell'
import { PreviewStudio } from '@/components/preview/preview-studio'

export const metadata = {
  title: 'Ghost Preview — Wraith OSINT',
}

export default function Page() {
  return (
    <AppShell>
      <div className="mx-auto w-full max-w-[1500px] px-4 py-6 sm:px-6 lg:py-8">
        <p className="font-mono text-[10px] tracking-[0.22em] text-primary/80 uppercase">
          Módulo 03
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          Ghost Preview
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          Estúdio de cartões de preview. Reproduz os padrões de interface usados por mensageria,
          drives e marketplaces para estudar como um link é percebido antes do clique.
        </p>

        <div className="mt-6">
          <PreviewStudio />
        </div>
      </div>
    </AppShell>
  )
}
