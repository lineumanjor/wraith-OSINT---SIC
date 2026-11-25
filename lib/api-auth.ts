import { getAuthorizedSession } from '@/lib/auth-guard'

export async function requireApiAuth() {
  const session = await getAuthorizedSession()
  return session ? null : Response.json({ error: 'Unauthorized' }, { status: 401 })
}
