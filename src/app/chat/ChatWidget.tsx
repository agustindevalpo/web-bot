'use client'

import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import styles from './page.module.css'
import { DemoCTA } from './DemoCTA'
import { LeadForm } from './LeadForm'
import { extraerOpciones } from './opciones'

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

// Mapea los códigos de error documentados de POST /api/chat/lead a un
// mensaje legible; cualquier código no reconocido (o su ausencia) cae al
// mensaje genérico.
function mensajeErrorLead(codigo: unknown): string {
  switch (codigo) {
    case 'datos_invalidos':
      return 'Revisa tu nombre y tu correo electrónico.'
    case 'sesion_incompleta':
      return 'Termina de responder todas las preguntas antes de continuar.'
    case 'sesion_no_encontrada':
      return 'Tu sesión expiró. Actualiza la página e inténtalo de nuevo.'
    case 'sesion_no_demo':
      return 'No pudimos verificar tu sesión de demo. Actualiza la página e inténtalo de nuevo.'
    default:
      return 'No se pudo procesar tu solicitud. Inténtalo de nuevo en un momento.'
  }
}

// Burbuja del asistente, separada del componente principal para poder
// testear el marcado que produce (prosa + botones de opción) sin simular
// clics — el proyecto "unit" de Jest corre en testEnvironment 'node' (sin
// jsdom, ver jest.config.ts), así que solo se puede verificar el HTML
// resultante, nunca la interacción.
export function BurbujaAsistente({
  contenido,
  mostrarOpciones,
  enviando,
  onSeleccionarOpcion,
}: {
  contenido: string
  mostrarOpciones: boolean
  enviando: boolean
  onSeleccionarOpcion: (opcion: string) => void
}) {
  const { texto, opciones } = extraerOpciones(contenido)

  return (
    <>
      <div className={`${styles.burbuja} ${styles.bot}`}>{texto}</div>

      {mostrarOpciones && opciones.length > 0 && (
        <div className={styles.opciones}>
          {opciones.map((opcion) => (
            <button
              key={opcion}
              type="button"
              className={styles.opcion}
              onClick={() => onSeleccionarOpcion(opcion)}
              disabled={enviando}
            >
              {opcion}
            </button>
          ))}
        </div>
      )}
    </>
  )
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
  const [requiereLead, setRequiereLead] = useState(false)
  const [leadNombre, setLeadNombre] = useState('')
  const [leadEmail, setLeadEmail] = useState('')
  const [enviandoLead, setEnviandoLead] = useState(false)
  const [leadError, setLeadError] = useState<string | null>(null)
  const finRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    finRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [mensajes, enviando])

  // `textoDirecto` permite mandar una opción clicada sin pasar por el
  // estado `input` — un clic manda una sola cosa, no "elegir y luego
  // apretar enviar". Sin argumento, se comporta como antes: manda lo que
  // haya en la caja de texto.
  async function enviarMensaje(textoDirecto?: string) {
    const texto = (textoDirecto ?? input).trim()
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

      // El servidor rota la sesión cuando la cookie apuntaba a una demo ya
      // terminada (dura un año). Se adopta el sessionId nuevo para que el
      // resto de la conversación siga en esa sesión y no en la vieja.
      if (typeof data.sessionIdNuevo === 'string') {
        sessionIdRef.current = data.sessionIdNuevo
        escribirCookie(COOKIE_NAME, data.sessionIdNuevo)
      }

      if (data.respuesta) {
        setMensajes((prev) => [...prev, { rol: 'assistant', contenido: data.respuesta }])
      }

      if (data.completada) {
        setCompletada(true)
        // El servidor ya no revela subdominioDemo en esta respuesta: para
        // demo, `requiereLead` pide nombre y correo antes de mostrar el sitio.
        if (data.requiereLead) {
          setRequiereLead(true)
        }
      }
    } catch {
      setError('No se pudo conectar con el asistente. Inténtalo de nuevo en un momento.')
    } finally {
      setEnviando(false)
    }
  }

  async function enviarLead() {
    const nombre = leadNombre.trim()
    const email = leadEmail.trim()
    if (!nombre || !email || enviandoLead) return

    setEnviandoLead(true)
    setLeadError(null)

    try {
      const res = await fetch('/api/chat/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: sessionIdRef.current, nombre, email }),
      })

      const data = await res.json()

      if (!res.ok) {
        setLeadError(mensajeErrorLead(data.error))
        return
      }

      // Recién acá se revela el sitio — el subdominio real solo llega en la
      // respuesta de este endpoint, nunca antes.
      setSubdominioDemo(data.subdominioDemo)
      setRequiereLead(false)
    } catch {
      setLeadError('No se pudo conectar con el servidor. Inténtalo de nuevo en un momento.')
    } finally {
      setEnviandoLead(false)
    }
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') enviarMensaje()
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>WebBot</header>

      <main className={styles.chat}>
        {mensajes.map((m, i) => {
          if (m.rol === 'user') {
            return (
              <div key={i} className={`${styles.burbuja} ${styles.usuario}`}>
                {m.contenido}
              </div>
            )
          }

          // Los botones de opción solo se ofrecen en la última pregunta
          // vigente: si el cliente ya avanzó la conversación, o si está en
          // curso un envío, terminó, o se topó con el límite diario, la
          // pregunta queda como texto simple (igual que si nunca hubiera
          // tenido viñetas).
          const esUltimo = i === mensajes.length - 1
          const mostrarOpciones = esUltimo && !completada && !enviando && !limiteAlcanzado

          return (
            <BurbujaAsistente
              key={i}
              contenido={m.contenido}
              mostrarOpciones={mostrarOpciones}
              enviando={enviando}
              onSeleccionarOpcion={(opcion) => enviarMensaje(opcion)}
            />
          )
        })}

        {enviando && (
          <div className={`${styles.burbuja} ${styles.bot} ${styles.escribiendo}`}>
            escribiendo...
          </div>
        )}

        {error && <div className={styles.error}>{error}</div>}

        {completada && requiereLead && (
          <LeadForm
            nombre={leadNombre}
            email={leadEmail}
            enviando={enviandoLead}
            error={leadError}
            onNombreChange={setLeadNombre}
            onEmailChange={setLeadEmail}
            onSubmit={enviarLead}
          />
        )}

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
          onClick={() => enviarMensaje()}
          disabled={enviando || !input.trim() || completada || limiteAlcanzado}
        >
          Enviar
        </button>
      </footer>
    </div>
  )
}
