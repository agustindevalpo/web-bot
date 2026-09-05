'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { ADMIN_COOKIE_NAME } from '@/infrastructure/auth/AdminSessionService'

// Cerrar sesión como Server Action: un <form action> sin JavaScript de
// cliente, borra la cookie y redirige en un solo viaje.
export async function cerrarSesionAdmin(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(ADMIN_COOKIE_NAME)
  redirect('/admin/login')
}
