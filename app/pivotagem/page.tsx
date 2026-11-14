import { AppShell } from '@/components/app-shell'
import { InvestigationPivot } from '@/components/cases/investigation-pivot'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Pivotagem gráfica · Wraith',
  description: 'Visualize entidades e relações já registadas em dossiês autorizados.',
}

export default function PivotagemPage() {
  return (
    <AppShell>
      <InvestigationPivot />
    </AppShell>
  )
}
