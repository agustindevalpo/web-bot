import { redirect } from 'next/navigation'
import { esAdmin } from '../_lib/requerirAdmin'
import { LoginAdminForm } from './LoginAdminForm'
import styles from './page.module.css'

export default async function AdminLoginPage() {
  if (await esAdmin()) {
    redirect('/admin')
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <h1 className={styles.titulo}>Panel interno de Devalpo</h1>
        <p className={styles.texto}>Acceso solo para el equipo. Ingresa la contraseña del panel.</p>
        <LoginAdminForm />
      </div>
    </div>
  )
}
