'use client'

import { Suspense, useState, type KeyboardEvent } from 'react'
import { useSearchParams } from 'next/navigation'
import styles from './page.module.css'

type Estado = 'form' | 'enviado'

interface LoginFormProps {
  // Precargado server-side por page.tsx a partir de la sesión de demo (ver
  // emailPrefill.ts) — sigue siendo editable, nunca de solo lectura.
  emailInicial: string
}

function LoginFormCampos({ emailInicial }: LoginFormProps) {
  const searchParams = useSearchParams()
  const errorInicial =
    searchParams.get('error') === 'token_invalido'
      ? 'Ese link ya fue usado o expiró. Pide uno nuevo.'
      : null
  // /login recibe tráfico de más de un origen (fallback de pago en
  // hrefPago.ts, y el redirect de /onboarding sin sesión) — solo cuando
  // viene del botón de compra tiene sentido explicarle a la persona por qué
  // terminó acá en vez de en un pago.
  const desdePago = searchParams.get('desde') === 'pago'

  const [email, setEmail] = useState(emailInicial)
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

  // Tres estados nada más: el genérico de siempre, y los dos matices posibles
  // cuando se viene del botón de compra (con o sin email ya conocido) — no se
  // arma una matriz de variantes para cada origen posible.
  const textoIntro = !desdePago
    ? 'Ingresa tu email para crear tu cuenta y seguir armando tu sitio.'
    : emailInicial
      ? 'Diste clic en «Quiero mi sitio real» y ya tenemos tu email de la demo. Confírmalo y te enviamos un link de acceso para seguir con tu sitio real.'
      : 'Diste clic en «Quiero mi sitio real». Ingresa tu email y te enviamos un link de acceso para seguir con tu sitio real.'

  return (
    <div className={styles.card}>
      <h1 className={styles.titulo}>WebBot</h1>

      {estado === 'enviado' ? (
        <p className={styles.texto}>
          Revisa tu email — te enviamos un link para entrar. Puedes cerrar esta pestaña.
        </p>
      ) : (
        <>
          <p className={styles.texto}>{textoIntro}</p>
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

export function LoginForm({ emailInicial }: LoginFormProps) {
  return (
    <Suspense fallback={null}>
      <LoginFormCampos emailInicial={emailInicial} />
    </Suspense>
  )
}
