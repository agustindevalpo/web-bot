'use client'

import { useEffect, useRef } from 'react'
import styles from './completar.module.css'

const ANCHO_ESCRITORIO = 1280

// Vista previa del sitio del visitante, sin interacción. En móvil es un marco
// de 420px a ancho completo (M2); en escritorio (E2) el sitio se renderiza a
// 1280px y se escala con `--k`, el ancho del marco dividido por 1280. Quien lo
// usa cambia la `key` para forzar la recarga después de guardar.
export function VistaSitio({ url, escritorio }: { url: string; escritorio: boolean }) {
  const marcoRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const marco = marcoRef.current
    if (!marco || !escritorio) return
    const ajustar = () => marco.style.setProperty('--k', String(marco.clientWidth / ANCHO_ESCRITORIO))
    ajustar()
    const observador = new ResizeObserver(ajustar)
    observador.observe(marco)
    return () => observador.disconnect()
  }, [escritorio])

  return (
    <div ref={marcoRef} className={escritorio ? styles.marcoEscritorio : styles.marcoSitio}>
      <iframe src={url} title="Vista previa de tu sitio" className={styles.iframe} tabIndex={-1} />
    </div>
  )
}
