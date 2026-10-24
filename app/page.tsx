import { AppShell } from '@/components/app-shell'
import { Dashboard } from '@/components/dashboard/dashboard'
import { getDashboardData } from '@/lib/queries'

export const dynamic = 'force-dynamic'

export default async function Page() {
  const data = await getDashboardData()

  return (
    <AppShell>
      <Dashboard initial={data} />
    </AppShell>
  )
}
