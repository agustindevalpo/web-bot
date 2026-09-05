'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import styles from './page.module.css'

export function LoginAdminForm() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [mensaje, setMensaje] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!password || enviando) return

    setEnviando(true)
    setMensaje(null)

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })

      if (res.ok) {
        // /admin es dinámico (lee cookies), así que push vuelve a renderizar
        // en el servidor con la cookie recién puesta.
        router.push('/admin')
        router.refresh()
        return
      }

      if (res.status === 429) {
        setMensaje('Demasiados intentos — inténtalo de nuevo en unos minutos.')
      } else if (res.status === 503) {
        setMensaje('El panel no está configurado en este entorno.')
      } else {
        setMensaje('Contraseña incorrecta.')
      }
    } catch {
      setMensaje('No se pudo conectar. Inténtalo de nuevo.')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <form className={styles.form} onSubmit={onSubmit}>
      <label className={styles.label} htmlFor="admin-password">
        Contraseña
      </label>
      <input
        id="admin-password"
        className={styles.input}
        type="password"
        autoComplete="current-password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        disabled={enviando}
      />
      <button className={styles.boton} type="submit" disabled={enviando || !password}>
        {enviando ? 'Ingresando...' : 'Ingresar'}
      </button>
      {mensaje && <p className={styles.mensaje}>{mensaje}</p>}
    </form>
  )
}
