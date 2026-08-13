import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { verificarSesionJWT, SESSION_COOKIE_NAME } from '@/infrastructure/auth/JwtSessionService'
import ChatWidget from '../chat/ChatWidget'

export default async function OnboardingPage() {
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value
  const sesion = token ? await verificarSesionJWT(token) : null

  if (!sesion) {
    redirect('/login')
  }

  return <ChatWidget />
}
