import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { ADMIN_COOKIE_NAME, verificarSesionAdminJWT } from '@/infrastructure/auth/AdminSessionService'

// Variante booleana para Server Actions: ahí no corresponde redirigir sino
// fallar, porque un POST directo sin cookie no debe ejecutar nada.
export async function esAdmin(): Promise<boolean> {
  const cookieStore = await cookies()
  const token = cookieStore.get(ADMIN_COOKIE_NAME)?.value
  return token ? verificarSesionAdminJWT(token) : false
}

// Para páginas: si no hay sesión válida, manda al login del panel.
export async function requerirAdmin(): Promise<void> {
  if (!(await esAdmin())) {
    redirect('/admin/login')
  }
}
