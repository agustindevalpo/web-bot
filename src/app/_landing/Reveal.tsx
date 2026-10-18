'use client'

// Contenedor de sección con reveal-on-scroll. page.tsx sigue siendo servidor:
// solo este envoltorio es cliente, y sus hijos llegan ya renderizados.
import { useEffect, useRef, type ReactNode } from 'react'
import { REVEAL_UMBRAL, revelarSeccion } from './revelar'

interface RevealProps {
  id?: string
  className?: string
  children: ReactNode
}

export function Reveal({ id, className, children }: RevealProps) {
  const ref = useRef<HTMLElement>(null)

  useEffect(() => {
    const nodo = ref.current
    if (!nodo || typeof IntersectionObserver === 'undefined') return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const observador = new IntersectionObserver(
      (entradas) => {
        for (const entrada of entradas) {
          if (!entrada.isIntersecting) continue
          observador.unobserve(entrada.target)
          revelarSeccion(entrada.target)
        }
      },
      { threshold: REVEAL_UMBRAL },
    )
    observador.observe(nodo)
    return () => observador.disconnect()
  }, [])

  return (
    <section ref={ref} id={id} className={className}>
      {children}
    </section>
  )
}
