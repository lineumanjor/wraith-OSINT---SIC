import { makeId, listInvestigations } from '@/lib/cases/queries'
import { CASE_PRIORITY, CASE_STATUS } from '@/lib/cases/types'
import { db } from '@/lib/db'
import { investigations } from '@/lib/db/schema'

export const runtime = 'nodejs'

export async function GET() {
  const cases = await listInvestigations()
  return Response.json({ cases })
}

export async function POST(request: Request) {
  let body: { name?: string; objective?: string; description?: string; priority?: string; status?: string }
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'corpo inválido' }, { status: 400 })
  }

  const name = (body.name ?? '').trim()
  if (name.length < 3) {
    return Response.json({ error: 'o nome da investigação precisa de pelo menos 3 caracteres' }, { status: 400 })
  }
  if (name.length > 160) {
    return Response.json({ error: 'o nome da investigação excede 160 caracteres' }, { status: 400 })
  }

  const objective = (body.objective ?? '').trim().slice(0, 1000)
  if (objective.length < 5) {
    return Response.json({ error: 'o objetivo precisa de pelo menos 5 caracteres' }, { status: 400 })
  }
  const description = (body.description ?? '').trim().slice(0, 4000) || null
  const priority = CASE_PRIORITY.includes((body.priority ?? '') as never) ? body.priority! : 'normal'
  const status = CASE_STATUS.includes((body.status ?? '') as never) ? body.status! : 'open'

  const [created] = await db
    .insert(investigations)
    .values({ id: makeId('case'), name, objective, description, priority, status })
    .returning()

  return Response.json({ case: created }, { status: 201 })
}
