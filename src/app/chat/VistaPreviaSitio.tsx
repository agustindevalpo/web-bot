'use client'

import { useEffect, useRef } from 'react'
import styles from './DemoCTA.module.css'

const ANCHO_ESCRITORIO = 1280

// Vista previa del sitio del visitante, sin interacción. En móvil es un iframe
// a ancho completo; en escritorio (E1) el sitio se renderiza a 1280px y se
// escala con `transform: scale(var(--k))`, donde --k es el ancho del contenedor
// dividido por 1280. Es la única isla cliente del reveal: solo mide el ancho.
export function VistaPreviaSitio({ url }: { url: string }) {
  const marcoRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const marco = marcoRef.current
    if (!marco) return
    const ajustar = () => marco.style.setProperty('--k', String(marco.clientWidth / ANCHO_ESCRITORIO))
    ajustar()
    const observador = new ResizeObserver(ajustar)
    observador.observe(marco)
    return () => observador.disconnect()
  }, [])

  return (
    <div ref={marcoRef} className={styles.marcoVista}>
      <iframe src={url} title="Vista previa de tu sitio" className={styles.iframe} tabIndex={-1} />
    </div>
  )
}
