import { AppShell } from '@/components/app-shell'
import { CaseIndex } from '@/components/cases/case-index'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Investigações · Wraith OSINT',
  description: 'Central de investigações e gestão de dossiês.',
}

export default function Page() {
  return (
    <AppShell>
      <CaseIndex />
    </AppShell>
  )
}
