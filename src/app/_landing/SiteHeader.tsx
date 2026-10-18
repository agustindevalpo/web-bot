'use client'

import Image from 'next/image'
import Link from 'next/link'
import styles from '../page.module.css'
import { NAV } from './copy'
import { useScrollPasado } from './useScrollPasado'

const UMBRAL_SCROLL_PX = 12

export function SiteHeader() {
  const compacto = useScrollPasado(UMBRAL_SCROLL_PX)

  return (
    <header className={styles.header} data-compacto={compacto}>
      <div className={styles.headerInner}>
        <a href="#inicio" aria-label={NAV.logoLabel}>
          <Image
            src="/devalpo-logo.png"
            alt="Devalpo"
            width={120}
            height={44}
            className={styles.headerLogo}
            priority
          />
        </a>
        <nav aria-label={NAV.navLabel} className={styles.headerNav}>
          <a href={NAV.ejemplos.href}>{NAV.ejemplos.label}</a>
          <a href={NAV.comoFunciona.href}>{NAV.comoFunciona.label}</a>
          <a href={NAV.precio.href}>{NAV.precio.label}</a>
          <a href={NAV.preguntas.href}>{NAV.preguntas.label}</a>
        </nav>
        <Link href={NAV.cta.href} className={styles.headerCta}>
          {NAV.cta.label}
          <span aria-hidden="true">→</span>
        </Link>
      </div>
    </header>
  )
}
