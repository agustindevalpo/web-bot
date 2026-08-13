'use client'

import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import styles from './page.module.css'
import { DemoCTA } from './DemoCTA'

interface Mensaje {
  rol: 'user' | 'assistant'
  contenido: string
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

export default function ChatWidget() {
  const sessionIdRef = useRef<string | null>(null)
  const [mensajes, setMensajes] = useState<Mensaje[]>([
    { rol: 'assistant', contenido: MENSAJE_INICIAL },
  ])
  const [input, setInput] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [completada, setCompletada] = useState(false)
  const [subdominioDemo, setSubdominioDemo] = useState<string | null>(null)
  const [limiteAlcanzado, setLimiteAlcanzado] = useState(false)
  const finRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    finRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [mensajes, enviando])

  async function enviarMensaje() {
    const texto = input.trim()
    if (!texto || enviando || completada || limiteAlcanzado) return

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
        body: JSON.stringify({ sessionId, mensaje: texto }),
      })

      const data = await res.json()

      if (res.status === 429) {
        setLimiteAlcanzado(true)
        setError(data.mensaje ?? 'Ya usaste tus demos gratuitos de hoy.')
        return
      }

      if (!res.ok) throw new Error(`HTTP ${res.status}`)

      if (data.respuesta) {
        setMensajes((prev) => [...prev, { rol: 'assistant', contenido: data.respuesta }])
      }

      if (data.completada) {
        setCompletada(true)
        if (data.esDemo && data.subdominioDemo) {
          setSubdominioDemo(data.subdominioDemo)
        }
      }
    } catch {
      setError('No se pudo conectar con el asistente. Inténtalo de nuevo en un momento.')
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

        {completada && subdominioDemo && <DemoCTA subdominioDemo={subdominioDemo} />}

        <div ref={finRef} />
      </main>

      <footer className={styles.inputBar}>
        <input
          className={styles.input}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Escribe tu respuesta..."
          disabled={enviando || completada || limiteAlcanzado}
        />
        <button
          className={styles.enviar}
          onClick={enviarMensaje}
          disabled={enviando || !input.trim() || completada || limiteAlcanzado}
        >
          Enviar
        </button>
      </footer>
    </div>
  )
}
