'use client'

// Ventana de navegador que rota los tres sitios demo reales + tarjeta de chat
// flotante (README del handoff §2). Los textos viven en copy.ts; el avance de
// slides y de chat, en hero.ts.
import { useEffect, useState } from 'react'
import styles from '../page.module.css'
import { HERO_CHAT, HERO_MAQUETAS } from './copy'
import { EJEMPLOS } from './ejemplos'
import {
  INTERVALO_CHAT_MS,
  INTERVALO_SLIDE_MS,
  PASO_CHAT_ESTATICO,
  estadoChat,
  siguientePasoChat,
  siguienteSlide,
} from './hero'
import { MaquetaSitio } from './MaquetaSitio'
import { useMovimientoReducido } from './useMovimientoReducido'

function hostDe(subdominio: string): string {
  return EJEMPLOS.find((ejemplo) => ejemplo.subdominio === subdominio)?.host ?? subdominio
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
