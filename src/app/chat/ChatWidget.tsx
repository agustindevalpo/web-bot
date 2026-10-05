'use client'

import { useEffect, useRef, useState, type FormEvent } from 'react'
import Link from 'next/link'
import styles from './page.module.css'
import { DemoCTA } from './DemoCTA'
import { LeadForm } from './LeadForm'
import { enlaceWhatsAppDevalpo, MENSAJE_WHATSAPP_LIMITE } from './contactoDevalpo'
import { extraerOpciones } from './opciones'
import {
  TOTAL_PREGUNTAS,
  agregarSugerencia,
  dividirAyuda,
  numeroDePregunta,
  opcionesApiladas,
  opcionesCompactas,
  sugerenciaYaIncluida,
} from './preguntaActiva'
import { COOKIE_NAME } from './sessionCookie'

interface Mensaje {
  rol: 'user' | 'assistant'
  contenido: string
}

type LimiteAlcanzado = 'demo' | 'claude' | null

const MENSAJE_INICIAL =
  'Hola, soy el asistente de WebBot. En seis preguntas armamos tu sitio. ¿Cómo se llama tu negocio?'

const ID_PREGUNTA_ACTIVA = 'pregunta-activa'
const ID_AYUDA_ACTIVA = 'ayuda-activa'
const ID_AYUDA_OPCIONES = 'ayuda-opciones'

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

// Mensaje del asistente, separado del componente principal para poder
// testear el marcado que produce (pregunta + ayuda + botones de opción +
// chips) sin simular clics — el proyecto "unit" de Jest corre en
// testEnvironment 'node' (sin jsdom, ver jest.config.ts), así que solo se
// puede verificar el HTML resultante, nunca la interacción.
//
// Una pregunta ya respondida (`activa: false`) baja a texto de historial. La
// activa manda: rótulo, pregunta grande, ayuda y, si aplica, opciones y
// sugerencias. `numero: null` es el cierre, que se muestra como titular sin
// rótulo.
export function BurbujaAsistente({
  contenido,
  activa,
  numero,
  mostrarOpciones,
  enviando,
  sugerencias,
  valorInput,
  onSeleccionarOpcion,
  onAgregarSugerencia,
}: {
  contenido: string
  activa: boolean
  numero: number | null
  mostrarOpciones: boolean
  enviando: boolean
  sugerencias: readonly string[]
  valorInput: string
  onSeleccionarOpcion: (opcion: string) => void
  onAgregarSugerencia: (sugerencia: string) => void
}) {
  const { texto, opciones } = extraerOpciones(contenido)
  const { pregunta, ayuda } = dividirAyuda(texto)

  if (!activa) return <p className={styles.historialBot}>{pregunta}</p>

  const hayOpciones = mostrarOpciones && opciones.length > 0
  const chips = mostrarOpciones ? sugerencias.filter((s) => !sugerenciaYaIncluida(valorInput, s)) : []
  const describedBy = [ayuda ? ID_AYUDA_ACTIVA : null, ID_AYUDA_OPCIONES].filter(Boolean).join(' ')
  const compactas = opcionesCompactas(opciones)

  return (
    <section className={styles.activa}>
      {numero !== null && (
        <p className={styles.rotulo}>
          Pregunta {numero} de {TOTAL_PREGUNTAS}
        </p>
      )}
      <p
        id={ID_PREGUNTA_ACTIVA}
        className={`${styles.pregunta} ${ayuda ? styles.preguntaConAyuda : ''}`}
      >
        {pregunta}
      </p>
      {ayuda && (
        <p id={ID_AYUDA_ACTIVA} className={styles.ayuda}>
          {ayuda}
        </p>
      )}

      {hayOpciones && (
        <>
          <div
            role="group"
            aria-labelledby={ID_PREGUNTA_ACTIVA}
            aria-describedby={describedBy}
            className={`${styles.opciones} ${opcionesApiladas(opciones) ? '' : styles.opcionesEnFila}`}
          >
            {opciones.map((opcion) => (
              <button
                key={opcion}
                type="button"
                className={`${styles.opcion} ${compactas ? styles.opcionCompacta : ''}`}
                onClick={() => onSeleccionarOpcion(opcion)}
                disabled={enviando}
              >
                {opcion}
              </button>
            ))}
          </div>
          <p id={ID_AYUDA_OPCIONES} className={styles.ayudaOpciones}>
            También puedes escribir tu respuesta.
          </p>
        </>
      )}

      {chips.length > 0 && (
        <div role="group" aria-label="Sugerencias de servicios" className={styles.sugerencias}>
          {chips.map((sugerencia) => (
            <button
              key={sugerencia}
              type="button"
              className={styles.sugerencia}
              aria-label={`Agregar ${sugerencia} a tu respuesta`}
              onClick={() => onAgregarSugerencia(sugerencia)}
              disabled={enviando}
            >
              <span className={styles.mas} aria-hidden="true">
                +
              </span>
              {sugerencia}
            </button>
          ))}
        </div>
      )}
    </section>
  )
}

// Tarjeta del límite diario de demos (429). Reemplaza a la barra de respuesta
// y no usa rojo: no es un error del visitante.
export function TarjetaLimite({ hrefWhatsApp }: { hrefWhatsApp: string | null }) {
  return (
    <section className={styles.limite} aria-labelledby="limite-titulo">
      <p className={styles.limiteRotulo}>Sitios de prueba</p>
      <h2 id="limite-titulo" className={styles.limiteTitulo}>
        Por hoy llegaste al máximo de sitios de prueba
      </h2>
      <p className={styles.limiteTexto}>
        Desde esta conexión se pueden armar 2 sitios de prueba al día. Puedes volver mañana, o escribirnos y lo
        armamos contigo.
      </p>
      {hrefWhatsApp && (
        <a href={hrefWhatsApp} target="_blank" rel="noopener noreferrer" className={styles.botonPrimario}>
          Escribir a Devalpo por WhatsApp
        </a>
      )}
      <Link href="/" className={styles.botonSecundario}>
        Volver al inicio
      </Link>
    </section>
  )
}

const HREF_WHATSAPP_LIMITE = enlaceWhatsAppDevalpo(MENSAJE_WHATSAPP_LIMITE)

function sugerenciasDeRespuesta(valor: unknown): string[] {
  return Array.isArray(valor) ? valor.filter((s): s is string => typeof s === 'string') : []
}

export default function ChatWidget() {
  const sessionIdRef = useRef<string | null>(null)
  const [mensajes, setMensajes] = useState<Mensaje[]>([
    { rol: 'assistant', contenido: MENSAJE_INICIAL },
  ])
  const [input, setInput] = useState('')
  const [enviando, setEnviando] = useState(false)
  // Texto del último envío que no llegó al servidor: habilita "Reintentar"
  // sin perder lo que el visitante escribió.
  const [falloEnvio, setFalloEnvio] = useState<string | null>(null)
  const [limite, setLimite] = useState<LimiteAlcanzado>(null)
  const [mensajeLimite, setMensajeLimite] = useState('')
  const [sugerencias, setSugerencias] = useState<string[]>([])
  const [solicitudFoco, setSolicitudFoco] = useState(0)
  const [completada, setCompletada] = useState(false)
  const [subdominioDemo, setSubdominioDemo] = useState<string | null>(null)
  const [requiereLead, setRequiereLead] = useState(false)
  const [leadNombre, setLeadNombre] = useState('')
  const [leadEmail, setLeadEmail] = useState('')
  const [enviandoLead, setEnviandoLead] = useState(false)
  const [leadError, setLeadError] = useState<string | null>(null)
  const finRef = useRef<HTMLDivElement>(null)
  const barraRef = useRef<HTMLFormElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    // En escritorio la barra va en el flujo, bajo la pregunta: se lleva a la
    // vista ella, no el final del historial. En móvil el historial es el que
    // se desplaza, dentro de su contenedor.
    const sinMovimiento = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const esEscritorio = window.matchMedia('(min-width: 768px)').matches
    const destino = esEscritorio && barraRef.current ? barraRef.current : finRef.current
    destino?.scrollIntoView({ behavior: sinMovimiento ? 'auto' : 'smooth', block: 'end' })
  }, [mensajes, enviando, falloEnvio, limite])

  // Después de responder (o de tocar una sugerencia) el foco vuelve al campo,
  // con el cursor al final. Va en un efecto para esperar a que el campo ya
  // tenga el valor nuevo.
  useEffect(() => {
    if (solicitudFoco === 0) return
    const campo = inputRef.current
    if (!campo || campo.disabled) return
    campo.focus()
    campo.setSelectionRange(campo.value.length, campo.value.length)
  }, [solicitudFoco])

  const pedirFoco = () => setSolicitudFoco((n) => n + 1)

  // `textoDirecto` permite mandar una opción clicada sin pasar por el
  // estado `input` — un clic manda una sola cosa, no "elegir y luego
  // apretar enviar". Sin argumento, se comporta como antes: manda lo que
  // haya en la caja de texto. `reintento` reenvía un texto que ya está en el
  // historial sin duplicar la burbuja.
  async function enviarMensaje(textoDirecto?: string, reintento = false) {
    // Las sugerencias dejan ", " al final para seguir escribiendo; no se envía.
    const texto = (textoDirecto ?? input).trim().replace(/,+$/, '').trim()
    if (!texto || enviando || completada || limite) return

    if (!sessionIdRef.current) sessionIdRef.current = obtenerSessionId()
    const sessionId = sessionIdRef.current

    if (!reintento) setMensajes((prev) => [...prev, { rol: 'user', contenido: texto }])
    setInput('')
    setEnviando(true)
    setFalloEnvio(null)
    setSugerencias([])

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, mensaje: texto }),
      })

      const data = await res.json()

      if (res.status === 429) {
        // Solo el tope de demos por IP tiene tarjeta propia; el tope de
        // mensajes de un cliente activado (modo real) conserva su aviso.
        setLimite(data.error === 'demo_limit_reached' ? 'demo' : 'claude')
        setMensajeLimite(data.mensaje ?? 'Alcanzaste el límite de mensajes por hoy. Intenta más tarde.')
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
        setSugerencias(sugerenciasDeRespuesta(data.sugerencias))
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
      setFalloEnvio(texto)
    } finally {
      setEnviando(false)
      pedirFoco()
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

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    enviarMensaje()
  }

  function onAgregarSugerencia(sugerencia: string) {
    setInput((actual) => agregarSugerencia(actual, sugerencia))
    pedirFoco()
  }

  const ultimoAsistente = [...mensajes].reverse().find((m) => m.rol === 'assistant')
  const respuestasDelVisitante = mensajes.filter((m) => m.rol === 'user').length
  const numero = completada
    ? TOTAL_PREGUNTAS
    : numeroDePregunta(ultimoAsistente?.contenido ?? '', respuestasDelVisitante)
  const campoBloqueado = limite !== null || falloEnvio !== null

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerInterior}>
          <div className={styles.headerFila}>
            <div className={styles.marca}>
              <span className={styles.logotipo}>WebBot</span>
              <span className={styles.porDevalpo}>por Devalpo</span>
            </div>
            <span className={styles.contador}>
              {numero} de {TOTAL_PREGUNTAS}
            </span>
          </div>
          <div
            className={styles.segmentos}
            role="progressbar"
            aria-label="Avance de las preguntas"
            aria-valuemin={1}
            aria-valuemax={TOTAL_PREGUNTAS}
            aria-valuenow={numero}
            aria-valuetext={`Pregunta ${numero} de ${TOTAL_PREGUNTAS}`}
          >
            {Array.from({ length: TOTAL_PREGUNTAS }, (_, i) => (
              <span
                key={i}
                className={`${styles.segmento} ${i < numero ? styles.segmentoCompleto : ''}`}
              />
            ))}
          </div>
        </div>
      </header>

      <div className={styles.cuerpo}>
        <main className={styles.chat}>
          <div className={styles.mensajes} role="log" aria-live="polite">
            {mensajes.map((m, i) => {
              if (m.rol === 'user') {
                return (
                  <div key={i} className={styles.usuario}>
                    {m.contenido}
                  </div>
                )
              }

              // La pregunta vigente es la última burbuja: si el visitante ya
              // respondió (o hay un envío en curso, un fallo o el límite
              // diario), la última es suya y la pregunta queda como historial.
              // Las opciones y las sugerencias solo se ofrecen mientras la
              // conversación sigue abierta.
              const esActiva = i === mensajes.length - 1
              return (
                <BurbujaAsistente
                  key={i}
                  contenido={m.contenido}
                  activa={esActiva}
                  numero={completada ? null : numero}
                  mostrarOpciones={esActiva && !completada && !enviando}
                  enviando={enviando}
                  sugerencias={sugerencias}
                  valorInput={input}
                  onSeleccionarOpcion={(opcion) => enviarMensaje(opcion)}
                  onAgregarSugerencia={onAgregarSugerencia}
                />
              )
            })}

            {enviando && (
              <div className={styles.escribiendo} aria-hidden="true">
                escribiendo...
              </div>
            )}
          </div>

          {falloEnvio !== null && (
            <div className={styles.falloRed} role="alert">
              <span>No pudimos enviar tu respuesta.</span>
              <button
                type="button"
                className={styles.reintentar}
                onClick={() => enviarMensaje(falloEnvio, true)}
                disabled={enviando}
              >
                Reintentar
              </button>
            </div>
          )}

          {limite === 'claude' && (
            <p className={styles.aviso} role="alert">
              {mensajeLimite}
            </p>
          )}

          {completada && requiereLead && (
            <div className={styles.legado}>
              <LeadForm
                nombre={leadNombre}
                email={leadEmail}
                enviando={enviandoLead}
                error={leadError}
                onNombreChange={setLeadNombre}
                onEmailChange={setLeadEmail}
                onSubmit={enviarLead}
              />
            </div>
          )}

          {completada && subdominioDemo && (
            <div className={styles.legado}>
              <DemoCTA subdominioDemo={subdominioDemo} />
            </div>
          )}

          <div ref={finRef} />
        </main>

        {limite === 'demo' ? (
          <TarjetaLimite hrefWhatsApp={HREF_WHATSAPP_LIMITE} />
        ) : (
          !completada && (
            <form ref={barraRef} className={styles.barra} onSubmit={onSubmit}>
              <input
                ref={inputRef}
                className={styles.input}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Escribe tu respuesta..."
                aria-label="Tu respuesta"
                autoComplete="off"
                enterKeyHint="send"
                disabled={campoBloqueado}
              />
              <button
                type="submit"
                className={styles.enviar}
                aria-label="Enviar respuesta"
                disabled={enviando || campoBloqueado || !input.trim()}
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              </button>
            </form>
          )
        )}
      </div>
    </div>
  )
}
