import { AuthForm } from '@/components/auth-form'
import { getAuthorizedSession } from '@/lib/auth-guard'
import { redirect } from 'next/navigation'

export const metadata = { title: 'Entrar · Wraith SIC' }

export default async function SignInPage() {
  if (await getAuthorizedSession()) redirect('/')
  return <AuthForm mode="sign-in" />
}
