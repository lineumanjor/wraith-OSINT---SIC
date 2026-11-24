'use client'

import { useRouter } from 'next/navigation'
import { authClient } from '@/lib/auth-client'
import { Button } from '@/components/ui/button'

export function AuthSessionControl() {
  const router = useRouter()
  const { data: session } = authClient.useSession()

  if (!session?.user) return null

  async function handleSignOut() {
    await authClient.signOut()
    router.replace('/sign-in')
    router.refresh()
  }

  return (
    <div className="fixed right-3 top-3 z-50 flex items-center gap-2 rounded-lg border border-border bg-background/95 p-1.5 shadow-lg backdrop-blur sm:right-5 sm:top-5">
      <span className="hidden max-w-40 truncate px-2 text-xs text-muted-foreground sm:inline" title={session.user.email}>
        {session.user.email}
      </span>
      <Button type="button" size="sm" variant="outline" onClick={handleSignOut}>
        Sair
      </Button>
    </div>
  )
}
