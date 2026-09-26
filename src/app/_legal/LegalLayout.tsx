import type { ReactNode } from 'react'
import Link from 'next/link'
import styles from './legal.module.css'

// Layout compartido por /terminos y /privacidad (WB-legal). Server component
// estático: sin estado, sin cliente — ambas páginas solo aportan el título y
// las secciones.

interface LegalLayoutProps {
  titulo: string
  actualizado: string
  children: ReactNode
}

export function LegalLayout({ titulo, actualizado, children }: LegalLayoutProps) {
  return (
    <main className={styles.page}>
      <Link href="/" className={styles.volver}>
        ← Volver al inicio
      </Link>
      <h1 className={styles.titulo}>{titulo}</h1>
      <p className={styles.actualizado}>Última actualización: {actualizado}</p>
      {children}
    </main>
  )
}

export function LegalSeccion({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <section className={styles.seccion}>
      <h2 className={styles.seccionTitulo}>{titulo}</h2>
      {children}
    </section>
  )
}

export function LegalDestacado({ children }: { children: ReactNode }) {
  return <div className={styles.destacado}>{children}</div>
}
