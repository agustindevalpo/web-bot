'use client'

import { useEffect, useRef } from 'react'
import styles from './DemoCTA.module.css'

const ANCHO_ESCRITORIO = 1280

// Se puede desplazar, pero sin `allow-popups`, `allow-forms` ni
// `allow-top-navigation` no abre WhatsApp, no envía formularios ni saca al
// visitante de la página. Scripts y mismo origen hacen falta para que el sitio
// hidrate y cargue sus recursos.
const SANDBOX_VISTA_PREVIA = 'allow-scripts allow-same-origin'

// Vista previa del sitio del visitante: se desplaza, pero no se interactúa. En móvil es un iframe
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
      <iframe
        src={url}
        title="Vista previa de tu sitio"
        className={styles.iframe}
        tabIndex={-1}
        sandbox={SANDBOX_VISTA_PREVIA}
      />
    </div>
  )
}
