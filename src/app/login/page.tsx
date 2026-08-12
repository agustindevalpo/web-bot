'use client'

import { Suspense, useState, type KeyboardEvent } from 'react'
import { useSearchParams } from 'next/navigation'
import styles from './page.module.css'

type Estado = 'form' | 'enviado'

function LoginForm() {
  const searchParams = useSearchParams()
  const errorInicial =
    searchParams.get('error') === 'token_invalido'
      ? 'Ese link ya fue usado o expiró. Pide uno nuevo.'
      : null

  const [email, setEmail] = useState('')
  const [estado, setEstado] = useState<Estado>('form')
  const [mensaje, setMensaje] = useState<string | null>(errorInicial)
  const [enviando, setEnviando] = useState(false)

  async function solicitarAcceso() {
    if (!email.trim() || enviando) return

    setEnviando(true)
    setMensaje(null)

    try {
      const res = await fetch('/api/auth/solicitar-acceso', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      if (res.status === 429) {
        setMensaje('Demasiados intentos — inténtalo de nuevo en un rato.')
        return
      }

      if (!res.ok) {
        setMensaje('Ese email no parece válido.')
        return
      }

      setEstado('enviado')
    } catch {
      setMensaje('No se pudo conectar. Inténtalo de nuevo.')
    } finally {
      setEnviando(false)
    }
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') solicitarAcceso()
  }

  return (
    <div className={styles.card}>
      <h1 className={styles.titulo}>WebBot</h1>

      {estado === 'enviado' ? (
        <p className={styles.texto}>
          Revisa tu email — te enviamos un link para entrar. Puedes cerrar esta pestaña.
        </p>
      ) : (
        <>
          <p className={styles.texto}>
            Ingresa tu email para crear tu cuenta y seguir armando tu sitio.
          </p>
          <input
            className={styles.input}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="tu@email.com"
            disabled={enviando}
          />
          <button
            className={styles.boton}
            onClick={solicitarAcceso}
            disabled={enviando || !email.trim()}
          >
            {enviando ? 'Enviando...' : 'Enviar link de acceso'}
          </button>
          {mensaje && <p className={styles.mensaje}>{mensaje}</p>}
        </>
      )}
    </div>
  )
}

export default function LoginPage() {
  return (
    <div className={styles.page}>
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
    </div>
  )
}
