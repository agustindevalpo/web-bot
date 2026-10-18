'use client'

// Ventana de navegador que rota los tres sitios demo reales + tarjeta de chat
// flotante (README del handoff §2). Los textos viven en copy.ts; el avance de
// slides y de chat, en hero.ts.
import { useEffect, useState } from 'react'
import styles from '../page.module.css'
import { HERO_CHAT, HERO_MAQUETAS, type Maqueta } from './copy'
import { EJEMPLOS } from './ejemplos'
import {
  INTERVALO_CHAT_MS,
  INTERVALO_SLIDE_MS,
  PASO_CHAT_ESTATICO,
  estadoChat,
  siguientePasoChat,
  siguienteSlide,
} from './hero'
import { useMovimientoReducido } from './useMovimientoReducido'

function hostDe(subdominio: string): string {
  return EJEMPLOS.find((ejemplo) => ejemplo.subdominio === subdominio)?.host ?? subdominio
}

function MaquetaSitio({ m }: { m: Maqueta }) {
  return (
    <div className={styles.maqueta} style={{ '--acento': m.acento, '--texto-acento': m.textoAcento } as React.CSSProperties}>
      <div className={styles.maquetaBarra}>
        <span className={styles.maquetaMarca}>
          <span className={styles.maquetaLogo}>{m.iniciales}</span>
          <span className={styles.maquetaNombre}>{m.nombre}</span>
        </span>
        <span className={styles.maquetaCta}>{m.cta}</span>
      </div>
      <div className={styles.maquetaTitulo}>
        {m.titulo.map((linea, i) => (
          <span key={linea}>
            {i > 0 && <br />}
            {linea}
          </span>
        ))}
      </div>
      {m.tipo === 'carta' && (
        <>
          <p className={styles.maquetaDescripcion}>{m.descripcion}</p>
          <div className={styles.maquetaCarta}>
            <div className={styles.maquetaEtiqueta}>{m.etiqueta}</div>
            {m.filas.map((fila) => (
              <div key={fila.texto} className={styles.maquetaFila}>
                <span>{fila.texto}</span>
                {fila.valor && (
                  <>
                    <span className={styles.maquetaPuntos} />
                    <strong>{fila.valor}</strong>
                  </>
                )}
              </div>
            ))}
          </div>
        </>
      )}
      {m.tipo === 'catalogo' && (
        <>
          <p className={styles.maquetaDescripcion}>{m.descripcion}</p>
          <div className={styles.maquetaProductos}>
            {m.productos.map((producto) => (
              <div key={producto}>
                <div className={styles.maquetaFoto} />
                <div className={styles.maquetaProducto}>{producto}</div>
              </div>
            ))}
          </div>
          <div className={styles.maquetaPie}>{m.pie}</div>
        </>
      )}
      {m.tipo === 'servicios' && (
        <>
          {m.servicios.map((servicio, i) => (
            <div key={servicio} className={styles.maquetaServicio}>
              <span className={styles.maquetaNumero}>{String(i + 1).padStart(2, '0')}</span>
              <span>{servicio}</span>
            </div>
          ))}
          <div className={styles.maquetaFranja}>
            <span>{m.franja.etiqueta}</span>
            <strong>{m.franja.valor}</strong>
          </div>
        </>
      )}
    </div>
  )
}

export function HeroVisual() {
  const reducido = useMovimientoReducido()
  const [slide, setSlide] = useState(0)
  const [pasoChat, setPasoChat] = useState(0)

  useEffect(() => {
    if (reducido) return
    const idSlide = setInterval(() => setSlide((s) => siguienteSlide(s, HERO_MAQUETAS.length)), INTERVALO_SLIDE_MS)
    const idChat = setInterval(() => setPasoChat(siguientePasoChat), INTERVALO_CHAT_MS)
    return () => {
      clearInterval(idSlide)
      clearInterval(idChat)
    }
  }, [reducido])

  const { mensajes, escribiendo } = estadoChat(reducido ? PASO_CHAT_ESTATICO : pasoChat, HERO_CHAT.guion)
  const activa = reducido ? 0 : slide

  return (
    <div className={styles.heroVisual}>
      <div className={styles.ventana}>
        <div className={styles.ventanaBarra}>
          <div className={styles.ventanaPuntos} aria-hidden="true">
            <span style={{ background: '#E0554C' }} />
            <span style={{ background: '#E8B23A' }} />
            <span style={{ background: '#4CAF6D' }} />
          </div>
          <div className={styles.ventanaUrl}>
            <span className={styles.puntoVerde} aria-hidden="true" />
            {hostDe(HERO_MAQUETAS[activa].subdominio)}
          </div>
        </div>
        <div className={styles.ventanaContenido}>
          {HERO_MAQUETAS.map((m, i) => (
            <div key={m.subdominio} className={styles.slide} data-activo={i === activa} aria-hidden={i !== activa}>
              <MaquetaSitio m={m} />
            </div>
          ))}
        </div>
        <div className={styles.indicadores} aria-hidden="true">
          {HERO_MAQUETAS.map((m, i) => (
            <span key={m.subdominio} className={styles.indicador} data-activo={i === activa} />
          ))}
        </div>
      </div>

      <div className={styles.chatFlotante} aria-hidden="true">
        <div className={styles.chatCabecera}>
          <span className={styles.chatAvatar}>W</span>
          <div>
            <div className={styles.chatNombre}>{HERO_CHAT.nombre}</div>
            <div className={styles.chatEstado}>
              <span className={styles.puntoPulso} />
              {HERO_CHAT.enLinea}
            </div>
          </div>
        </div>
        <div className={styles.chatMensajes}>
          {mensajes.map((mensaje, i) => (
            <div key={i} className={styles.chatFila} data-quien={mensaje.quien}>
              <span className={styles.chatBurbuja}>{mensaje.texto}</span>
            </div>
          ))}
          {escribiendo && (
            <div className={styles.chatFila} data-quien="bot">
              <span className={`${styles.chatBurbuja} ${styles.chatEscribiendo}`}>
                <span />
                <span />
                <span />
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
