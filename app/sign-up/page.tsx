import { AuthForm } from '@/components/auth-form'
import { getAuthorizedSession } from '@/lib/auth-guard'
import { redirect } from 'next/navigation'

export const metadata = { title: 'Criar acesso · Wraith SIC' }

export default async function SignUpPage() {
  if (await getAuthorizedSession()) redirect('/')
  return <AuthForm mode="sign-up" />
}
