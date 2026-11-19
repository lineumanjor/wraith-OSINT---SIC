import { AppShell } from '@/components/app-shell'
import { Dashboard } from '@/components/dashboard/dashboard'
import { getDashboardData } from '@/lib/queries'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Painel operacional · Wraith OSINT',
  description: 'Visão operacional, estatísticas e actividade do Wraith OSINT.',
}

export default async function DashboardPage() {
  const data = await getDashboardData()

  return (
    <AppShell>
      <Dashboard initial={data} />
    </AppShell>
  )
}