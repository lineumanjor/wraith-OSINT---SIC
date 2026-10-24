import { AppShell } from '@/components/app-shell'
import { CaseIndex } from '@/components/cases/case-index'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Investigações · Wraith OSINT',
  description: 'Dossiês com entidades, factos datados e vínculos correlacionados.',
}

export default function CasesPage() {
  return (
    <AppShell>
      <CaseIndex />
    </AppShell>
  )
}
