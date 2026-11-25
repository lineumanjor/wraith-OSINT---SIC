import { AppShell } from '@/components/app-shell'
import { getAuthorizedSession } from '@/lib/auth-guard'
import { redirect } from 'next/navigation'
import { CaseIndex } from '@/components/cases/case-index'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Investigações · Wraith OSINT',
  description: 'Central de investigações e gestão de dossiês.',
}

export default async function Page() {
  if (!(await getAuthorizedSession())) redirect('/sign-in')
  return (
    <AppShell>
      <CaseIndex />
    </AppShell>
  )
}
