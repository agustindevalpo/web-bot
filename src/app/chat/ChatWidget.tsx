'use client'

import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import Link from 'next/link'
import styles from './page.module.css'

interface Mensaje {
  rol: 'user' | 'assistant'
  contenido: string
}

interface ChatWidgetProps {
  clienteId?: string
  maxIntercambios?: number
}

const COOKIE_NAME = 'webbot_session'
const MENSAJE_INICIAL =
  '¡Hola! Soy el asistente de WebBot. Te voy a hacer algunas preguntas para armar tu sitio. ¿Cómo se llama tu negocio?'

function leerCookie(nombre: string): string | null {
  const match = document.cookie.match(new RegExp(`(?:^|; )${nombre}=([^;]*)`))
  return match ? decodeURIComponent(match[1]) : null
}

function escribirCookie(nombre: string, valor: string): void {
  const unAnio = 60 * 60 * 24 * 365
  document.cookie = `${nombre}=${encodeURIComponent(valor)}; path=/; max-age=${unAnio}; SameSite=Lax`
}

function obtenerSessionId(): string {
  const existente = leerCookie(COOKIE_NAME)
  if (existente) return existente
  const nuevo = crypto.randomUUID()
  escribirCookie(COOKIE_NAME, nuevo)
  return nuevo
}

export default function ChatWidget({ clienteId, maxIntercambios }: ChatWidgetProps) {
  const sessionIdRef = useRef<string | null>(null)
  const [mensajes, setMensajes] = useState<Mensaje[]>([
    { rol: 'assistant', contenido: MENSAJE_INICIAL },
  ])
  const [input, setInput] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const finRef = useRef<HTMLDivElement>(null)

  const intercambios = mensajes.filter((m) => m.rol === 'user').length
  // Tope solo de UI: no hay /api/chat real todavía para hacerlo cumplir en el
  // servidor — queda para la Tarea 2.3, cuando exista el endpoint real.
  const limiteAlcanzado = maxIntercambios !== undefined && intercambios >= maxIntercambios

  useEffect(() => {
    finRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [mensajes, enviando])

  async function enviarMensaje() {
    const texto = input.trim()
    if (!texto || enviando || limiteAlcanzado) return

    if (!sessionIdRef.current) sessionIdRef.current = obtenerSessionId()
    const sessionId = sessionIdRef.current

    setMensajes((prev) => [...prev, { rol: 'user', contenido: texto }])
    setInput('')
    setEnviando(true)
    setError(null)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, mensaje: texto, clienteId }),
      })

      if (!res.ok) throw new Error(`HTTP ${res.status}`)

      const data = await res.json()
      setMensajes((prev) => [...prev, { rol: 'assistant', contenido: data.respuesta }])
    } catch {
      // El endpoint /api/chat todavía no existe (Tareas 2.2/2.3, agente Claude sin implementar).
      setError(
        'No se pudo conectar con el asistente. El backend del chat todavía no está implementado.'
      )
    } finally {
      setEnviando(false)
    }
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') enviarMensaje()
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>WebBot</header>

      <main className={styles.chat}>
        {mensajes.map((m, i) => (
          <div
            key={i}
            className={`${styles.burbuja} ${m.rol === 'user' ? styles.usuario : styles.bot}`}
          >
            {m.contenido}
          </div>
        ))}

        {enviando && (
          <div className={`${styles.burbuja} ${styles.bot} ${styles.escribiendo}`}>
            escribiendo...
          </div>
        )}

        {error && <div className={styles.error}>{error}</div>}

        {limiteAlcanzado && (
          <div className={styles.cta}>
            Llegaste al límite de la demo — creá tu cuenta gratis para seguir armando tu sitio.
            <Link href="/login" className={styles.ctaBoton}>
              Crear cuenta
            </Link>
          </div>
        )}

        <div ref={finRef} />
      </main>

      <footer className={styles.inputBar}>
        <input
          className={styles.input}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Escribí tu respuesta..."
          disabled={enviando || limiteAlcanzado}
        />
        <button
          className={styles.enviar}
          onClick={enviarMensaje}
          disabled={enviando || !input.trim() || limiteAlcanzado}
        >
          Enviar
        </button>
      </footer>
    </div>
  )
}
