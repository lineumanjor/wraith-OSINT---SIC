import { auth } from '@/lib/auth'
import { headers } from 'next/headers'

const authorizedEmails = new Set(
  [...(process.env.SIC_ALLOWED_EMAILS ?? '').split(','), 'lineumanjor@gmail.com']
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean),
)

export async function getAuthorizedSession() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) return null

  const email = session.user.email.trim().toLowerCase()
  if (!authorizedEmails.has(email)) return null

  return session
}

export function isAuthorizedEmail(email: string) {
  return authorizedEmails.has(email.trim().toLowerCase())
}
