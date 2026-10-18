'use client'

// Columna derecha de "Cómo funciona" (README del handoff §5): riel vertical que
// se rellena según el scroll y tres pasos cuyo círculo se enciende al alcanzarlo.
// Con movimiento reducido el riel se muestra lleno y los círculos activos.
import { useCallback, useRef, useSyncExternalStore, type ReactNode } from 'react'
import styles from '../page.module.css'
import { COMO_FUNCIONA } from './copy'
import { pasoActivo, progresoPasos } from './pasos'
import { useMovimientoReducido } from './useMovimientoReducido'

const { pasos, ilustraciones } = COMO_FUNCIONA

const ILUSTRACIONES: ReactNode[] = [
  <div key="chat" className={`${styles.pasoIlustracion} ${styles.pasoChat}`} aria-hidden="true">
    {ilustraciones.chat.map((mensaje) => (
      <span key={mensaje.texto} className={styles.pasoBurbuja} data-quien={mensaje.quien}>
        {mensaje.texto}
      </span>
    ))}
  </div>,
  <div key="sitio" className={`${styles.pasoIlustracion} ${styles.pasoSitio}`} aria-hidden="true">
    <div className={styles.pasoMiniatura}>
      <span />
      <span />
      <span />
    </div>
    <div>
      <div className={styles.pasoSitioTitulo}>{ilustraciones.sitioListo.titulo}</div>
      <div className={styles.pasoSitioTexto}>{ilustraciones.sitioListo.texto}</div>
    </div>
  </div>,
  <div key="linea" className={`${styles.pasoIlustracion} ${styles.pasoLinea}`} aria-hidden="true">
    <span className={styles.puntoPulso} />
    {ilustraciones.enLinea.dominio}
    <span className={styles.pasoEtiqueta}>{ilustraciones.enLinea.etiqueta}</span>
  </div>,
]

export function PasosRiel() {
  const reducido = useMovimientoReducido()
  const ref = useRef<HTMLDivElement>(null)

  // Suscripción al scroll/resize throttled con requestAnimationFrame; se limpia al desmontar.
  const suscribir = useCallback((avisar: () => void) => {
    let cuadro = 0
    const alMover = () => {
      if (cuadro) return
      cuadro = requestAnimationFrame(() => {
        cuadro = 0
        avisar()
      })
    }
    window.addEventListener('scroll', alMover, { passive: true })
    window.addEventListener('resize', alMover)
    return () => {
      window.removeEventListener('scroll', alMover)
      window.removeEventListener('resize', alMover)
      cancelAnimationFrame(cuadro)
    }
  }, [])

  const leerProgreso = useCallback(() => {
    const nodo = ref.current
    if (!nodo) return 0
    const { top, height } = nodo.getBoundingClientRect()
    return progresoPasos(window.innerHeight, top, height)
  }, [])

  const medido = useSyncExternalStore(suscribir, leerProgreso, () => 0)
  const progreso = reducido ? 1 : medido

  return (
    <div ref={ref} className={styles.pasosColumna}>
      <div className={styles.pasosRiel} aria-hidden="true">
        <div className={styles.pasosRielRelleno} style={{ height: `${progreso * 100}%` }} />
      </div>
      {pasos.map((paso, i) => (
        <div key={paso.n} className={styles.paso} data-r>
          <span className={styles.pasoCirculo} data-activo={pasoActivo(progreso, i, pasos.length)} aria-hidden="true">
            {paso.n}
          </span>
          <h3 className={styles.pasoTitulo}>{paso.titulo}</h3>
          <p className={styles.pasoTexto}>{paso.desc}</p>
          {ILUSTRACIONES[i]}
        </div>
      ))}
    </div>
  )
}
