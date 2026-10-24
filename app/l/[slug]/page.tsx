import { GhostRedirect } from '@/components/ghost-redirect'
import { getLink } from '@/lib/queries'
import type { PreviewStyle } from '@/lib/spectre/types'
import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Wraith OSINT Lab',
  robots: { index: false, follow: false },
}

export default async function RedirectPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const link = await getLink(slug)

  if (!link) notFound()

  if (link.redirectMode === 'direct') {
    if (!link.active) {
      return (
        <main className="grid min-h-dvh place-items-center px-6">
          <div className="max-w-sm rounded-xl border border-border bg-card p-6 text-center">
            <h1 className="text-sm font-medium text-foreground">Link desativado</h1>
            <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
              Este endereço não está a encaminhar para nenhum destino neste momento.
            </p>
          </div>
        </main>
      )
    }

    redirect(link.destination)
  }

  return (
    <GhostRedirect
      linkId={link.id}
      destination={link.destination}
      style={link.previewStyle as PreviewStyle}
      title={link.previewTitle ?? link.label}
      description={link.previewDescription}
      source={link.previewSource}
      active={link.active}
    />
  )
}
