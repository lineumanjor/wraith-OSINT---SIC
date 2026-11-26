import { getCaseDetail } from '@/lib/cases/queries'
import { CASE_PRIORITY, CASE_STATUS } from '@/lib/cases/types'
import { db } from '@/lib/db'
import { investigations } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

export const runtime = 'nodejs'

type Params = { params: Promise<{ id: string }> }

export async function GET(_request: Request, { params }: Params) {
  const { id } = await params
  const detail = await getCaseDetail(id)
  if (!detail) return Response.json({ error: 'investigação não encontrada' }, { status: 404 })
  return Response.json(detail)
}

export async function PATCH(request: Request, { params }: Params) {
  const { id } = await params

  let body: { name?: string; objective?: string; description?: string; status?: string; priority?: string }
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'corpo inválido' }, { status: 400 })
  }

  const patch: Record<string, unknown> = { updatedAt: new Date() }

  if (typeof body.name === 'string') {
    const name = body.name.trim()
    if (name.length < 3) return Response.json({ error: 'nome demasiado curto' }, { status: 400 })
    patch.name = name.slice(0, 160)
  }
  if (typeof body.objective === 'string') {
    patch.objective = body.objective.trim().slice(0, 1000) || null
  }
  if (typeof body.description === 'string') {
    patch.description = body.description.trim().slice(0, 4000) || null
  }
  if (typeof body.status === 'string' && CASE_STATUS.includes(body.status as never)) {
    patch.status = body.status
  }
  if (typeof body.priority === 'string' && CASE_PRIORITY.includes(body.priority as never)) {
    patch.priority = body.priority
  }

  const [updated] = await db
    .update(investigations)
    .set(patch)
    .where(eq(investigations.id, id))
    .returning()

  if (!updated) return Response.json({ error: 'investigação não encontrada' }, { status: 404 })
  return Response.json({ case: updated })
}

export async function DELETE(_request: Request, { params }: Params) {
  const { id } = await params
  await db.delete(investigations).where(eq(investigations.id, id))
  return Response.json({ ok: true })
}
