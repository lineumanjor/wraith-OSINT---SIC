import { FlaskConical } from 'lucide-react'

export function LabNotice({ variant = 'banner' }: { variant?: 'banner' | 'inline' }) {
  if (variant === 'inline') {
    return (
      <p className="flex items-start gap-2 text-xs leading-relaxed text-muted-foreground">
        <FlaskConical className="mt-0.5 size-3.5 shrink-0 text-accent" aria-hidden />
        <span>
          Ambiente de laboratório. Nenhum dado real de terceiros deve ser coletado aqui.
        </span>
      </p>
    )
  }

  return (
    <div className="flex items-start gap-3 border-b border-accent/20 bg-accent/[0.06] px-4 py-2.5 sm:px-6">
      <FlaskConical className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden />
      <p className="text-xs leading-relaxed text-muted-foreground">
        <span className="font-mono text-[11px] font-semibold tracking-[0.14em] text-accent uppercase">
          Ambiente de laboratório
        </span>
        <span className="mx-2 text-border">|</span>
        Plataforma de estudo e treinamento. O redirecionamento é declarado ao visitante, os
        previews são genéricos e não imitam marcas de terceiros. Use apenas com dados sintéticos
        ou com consentimento explícito.
      </p>
    </div>
  )
}
