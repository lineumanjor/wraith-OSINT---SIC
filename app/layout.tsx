import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'

const geistSans = Geist({
  subsets: ['latin'],
  variable: '--font-geist-sans',
})

const geistMono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-geist-mono',
})

export const metadata: Metadata = {
  title: 'Wraith OSINT — Plataforma de Investigação e Correlação',
  description:
    'Dossiês de investigação com entidades, factos datados e vínculos, enumeração de perfis públicos, consultas DNS e georreferenciação. Terminal OSINT integrado.',
  generator: 'v0.app',
  robots: { index: false, follow: false },
}

export const viewport: Viewport = {
  colorScheme: 'dark',
  themeColor: '#0b0a12',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR" className={`dark ${geistSans.variable} ${geistMono.variable}`}>
      <body className="min-h-dvh bg-background font-sans text-foreground antialiased">
        {children}
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
