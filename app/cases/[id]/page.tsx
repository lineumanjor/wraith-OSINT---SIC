import { AppShell } from '@/components/app-shell'
import { CaseWorkspace } from '@/components/cases/case-workspace'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Dossiê · Wraith OSINT',
  description: 'Entidades, cronologia, vínculos e georreferenciação do dossiê.',
}

export default async function CaseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return (
    <AppShell>
      <CaseWorkspace caseId={id} />
    </AppShell>
  )
}
