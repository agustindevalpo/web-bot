import { cookies } from 'next/headers'
import { clienteRepo, sesionRepo } from '@/infrastructure/container'
import { COOKIE_NAME } from '@/app/chat/sessionCookie'
import { resolverEmailPrefill } from './emailPrefill'
import { LoginForm } from './LoginForm'
import styles from './page.module.css'

export default async function LoginPage() {
  const cookieStore = await cookies()
  const sessionId = cookieStore.get(COOKIE_NAME)?.value
  const emailInicial = await resolverEmailPrefill(sessionId, sesionRepo, clienteRepo)

  return (
    <div className={styles.page}>
      <LoginForm emailInicial={emailInicial} />
    </div>
  )
}
