import { AppShell } from '@/components/app-shell'
import { PreviewStudio } from '@/components/preview/preview-studio'

export const metadata = {
  title: 'Pré-visualização de metadados — Wraith OSINT',
}

export default function Page() {
  return (
    <AppShell>
      <div className="mx-auto w-full max-w-[1500px] px-4 py-6 sm:px-6 lg:py-8">
        <p className="font-mono text-[10px] tracking-[0.22em] text-primary/80 uppercase">
          Módulo 03
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          Pré-visualização de metadados
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          Edite e confira o título, a descrição e o domínio que acompanharão o link. A prévia usa o endereço real informado e não imita interfaces de terceiros.
        </p>

        <div className="mt-6">
          <PreviewStudio />
        </div>
      </div>
    </AppShell>
  )
}
