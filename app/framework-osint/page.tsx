import { AppShell } from '@/components/app-shell'
import { FrameworkCatalog } from '@/components/osint/framework-catalog'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Framework OSINT · Wraith',
  description: 'Catálogo educativo de fontes públicas para investigações autorizadas.',
}

export default function FrameworkOsintPage() {
  return (
    <AppShell>
      <FrameworkCatalog />
    </AppShell>
  )
}
