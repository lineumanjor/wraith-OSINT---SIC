import { GhostRedirect } from '@/components/ghost-redirect'
import { getLink } from '@/lib/queries'
import type { PreviewStyle } from '@/lib/spectre/types'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Verificando link — Wraith OSINT Lab',
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
