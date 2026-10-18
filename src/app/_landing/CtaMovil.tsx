'use client'

// Botón fijo de móvil (README del handoff §11): solo bajo 640 px y pasados 700 px
// de scroll. El ancho se resuelve en CSS (`display: none` desde 640 px); el scroll
// usa useScrollPasado (rAF + limpieza). Al fondo no tapa el footer porque el
// footer reserva espacio inferior en móvil (ver `.footer` en page.module.css).
import Link from 'next/link'
import styles from '../page.module.css'
import { CTA_FINAL } from './copy'
import { useScrollPasado } from './useScrollPasado'

export const UMBRAL_CTA_MOVIL_PX = 700

export function CtaMovil() {
  const visible = useScrollPasado(UMBRAL_CTA_MOVIL_PX)
  if (!visible) return null

  return (
    <div className={styles.ctaMovil}>
      <Link href={CTA_FINAL.cta.href} className={styles.ctaMovilBoton}>
        {CTA_FINAL.cta.label}
        <span aria-hidden="true">→</span>
      </Link>
    </div>
  )
}
