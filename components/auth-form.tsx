'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { authClient } from '@/lib/auth-client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function AuthForm({ mode }: { mode: 'sign-in' | 'sign-up' }) {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const isSignUp = mode === 'sign-up'

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setLoading(true)
    const result = isSignUp
      ? await authClient.signUp.email({ name, email, password })
      : await authClient.signIn.email({ email, password })
    setLoading(false)
    if (result.error) {
      setError('Não foi possível validar o acesso. Confirma os dados e a autorização do endereço.')
      return
    }
    router.push('/')
    router.refresh()
  }

  return (
    <main className="flex min-h-dvh items-center justify-center bg-background px-4 py-10">
      <section className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-xl sm:p-8" aria-labelledby="auth-title">
        <p className="mb-3 font-mono text-xs uppercase tracking-[0.24em] text-primary">Wraith · SIC</p>
        <h1 id="auth-title" className="text-2xl font-semibold tracking-tight">
          {isSignUp ? 'Criar acesso de membro' : 'Acesso à plataforma'}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Entrada restrita a endereços autorizados pela organização.
        </p>
        <form className="mt-7 flex flex-col gap-4" onSubmit={handleSubmit}>
          {isSignUp && <div className="flex flex-col gap-2"><Label htmlFor="name">Nome</Label><Input id="name" autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} required /></div>}
          <div className="flex flex-col gap-2"><Label htmlFor="email">Email autorizado</Label><Input id="email" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required /></div>
          <div className="flex flex-col gap-2"><Label htmlFor="password">Palavra-passe</Label><Input id="password" type="password" autoComplete={isSignUp ? 'new-password' : 'current-password'} minLength={8} value={password} onChange={(event) => setPassword(event.target.value)} required /></div>
          {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
          <Button type="submit" className="mt-1 w-full" disabled={loading}>{loading ? 'A validar…' : isSignUp ? 'Criar acesso' : 'Entrar'}</Button>
        </form>
        <p className="mt-6 text-center text-sm text-muted-foreground">
          {isSignUp ? 'Já tens acesso? ' : 'Ainda não tens acesso? '}
          <Link className="font-medium text-foreground underline underline-offset-4" href={isSignUp ? '/sign-in' : '/sign-up'}>{isSignUp ? 'Iniciar sessão' : 'Pedir ou criar acesso'}</Link>
        </p>
      </section>
    </main>
  )
}
