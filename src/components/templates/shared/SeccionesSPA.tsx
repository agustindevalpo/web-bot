'use client'

import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { filtrarSecciones, type SeccionSPA } from './navegacion'
import styles from './SeccionesSPA.module.css'

export type SeccionesSPAProps = {
  // Ya filtrada por el server en el `sections.ts` de cada template (Q2 en
  // design.md) — al menos un elemento; el primero queda activo al montar.
  secciones: SeccionSPA[]
  marca: ReactNode
  accionHeader?: ReactNode
  pie: ReactNode
  className?: string
  // Override puntual del shell de header (p. ej. TIENDA suma la franja de
  // promo y baja a 74px) — el resto de las plantillas usa el shell por defecto.
  claseHeader?: string
}

const UMBRAL_OBSERVER = 0.06

// Único componente cliente bajo `templates/` (handoff, "Implicancia
// arquitectónica"; design.md Q1). Posee solo dos cosas: el id de sección
// activa y un IntersectionObserver. Header, footer y el contenido de cada
// sección llegan como slots ya renderizados en el server — este archivo no
// importa `SiteConfigDTO` ni ningún tipo de `src/application/` (D-02).
export default function SeccionesSPA({ secciones, marca, accionHeader, pie, className, claseHeader }: SeccionesSPAProps) {
  // Re-filtra en el cliente aunque el server ya filtró antes de llamar acá
  // (Q2 en design.md): defensa en profundidad para el Requirement
  // "Data-Driven Navigation" — si un template olvidara filtrar, el wrapper
  // igual no muestra jamás una pestaña o un panel vacíos.
  const seccionesVisibles = filtrarSecciones(secciones)
  // El acceso a `[0]` es opcional a propósito: un arreglo vacío es alcanzable
  // si un template llegara a pasar todas sus secciones sin contenido. En el
  // cimiento de seis plantillas, reventar acá no deja una sección en blanco:
  // tira abajo el sitio completo del cliente. Sin secciones no se renderiza
  // nada (ver el corte más abajo, después de los hooks).
  const [activaId, setActivaId] = useState(seccionesVisibles[0]?.id ?? '')
  const raizRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const raiz = raizRef.current
    if (!raiz) return

    // Gatea el contrato de visibilidad y el guard de reduced-motion de
    // motion.css. Sin JS este atributo nunca se setea y todas las secciones
    // quedan visibles como scroll largo, que es lo que protege el contenido
    // frente a los buscadores. El nav son botones, así que sin JS no navega:
    // el contenido está completo pero los saltos entre secciones no funcionan.
    raiz.setAttribute('data-dv-ready', '')

    const observer = new IntersectionObserver(
      (entradas) => {
        for (const entrada of entradas) {
          if (!entrada.isIntersecting) continue
          entrada.target.setAttribute('data-dv-in', '')
          observer.unobserve(entrada.target)
        }
      },
      { threshold: UMBRAL_OBSERVER },
    )

    raiz.querySelectorAll('[data-dv-anim="up"]').forEach((elemento) => observer.observe(elemento))

    return () => observer.disconnect()
  }, [])

  // Después de los hooks, nunca antes: React exige que se ejecuten siempre en
  // el mismo orden.
  if (seccionesVisibles.length === 0) return null

  return (
    <div ref={raizRef} className={className}>
      <header className={claseHeader ?? styles.header}>
        <div className={styles.marca}>{marca}</div>
        <nav className={styles.nav}>
          {seccionesVisibles.map((seccion) => (
            <button
              key={seccion.id}
              type="button"
              onClick={() => setActivaId(seccion.id)}
              aria-current={seccion.id === activaId ? 'true' : undefined}
              className={seccion.id === activaId ? `${styles.navItem} ${styles.navItemActivo}` : styles.navItem}
            >
              {seccion.etiqueta}
            </button>
          ))}
        </nav>
        {accionHeader && <div className={styles.accion}>{accionHeader}</div>}
      </header>

      <main className={styles.main}>
        {seccionesVisibles.map((seccion) => (
          <div
            key={seccion.id}
            data-dv-section
            data-dv-active={seccion.id === activaId ? '' : undefined}
            data-dv-anim={seccion.id === activaId ? 'fade' : undefined}
          >
            {seccion.contenido}
          </div>
        ))}
      </main>

      {pie}
    </div>
  )
}
