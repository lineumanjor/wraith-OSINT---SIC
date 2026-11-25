import { auth } from '@/lib/auth'
import { isAuthorizedEmail } from '@/lib/auth-guard'
import { toNextJsHandler } from 'better-auth/next-js'

const handlers = toNextJsHandler(auth)
export const GET = handlers.GET

export async function POST(request: Request) {
  const pathname = new URL(request.url).pathname
  if (pathname.endsWith('/sign-up/email') || pathname.endsWith('/sign-in/email')) {
    const body = await request.clone().json().catch(() => null)
    if (typeof body?.email !== 'string' || !isAuthorizedEmail(body.email)) {
      return Response.json({ message: 'Não foi possível validar o acesso.' }, { status: 403 })
    }
  }

  return handlers.POST(request)
}
