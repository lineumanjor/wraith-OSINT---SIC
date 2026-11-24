import { getDashboardData } from '@/lib/queries'
import { requireApiAuth } from '@/lib/api-auth'

export const dynamic = 'force-dynamic'

export async function GET() {
  const denied = await requireApiAuth()
  if (denied) return denied
  const data = await getDashboardData()
  return Response.json(data, {
    headers: { 'Cache-Control': 'no-store' },
  })
}
