'use client'

import { useSyncExternalStore } from 'react'

// Suscripción al scroll throttled con requestAnimationFrame; se limpia al desmontar.
function suscribir(avisar: () => void): () => void {
  let cuadro = 0
  const alScroll = () => {
    if (cuadro) return
    cuadro = requestAnimationFrame(() => {
      cuadro = 0
      avisar()
    })
  }
  window.addEventListener('scroll', alScroll, { passive: true })
  return () => {
    window.removeEventListener('scroll', alScroll)
    cancelAnimationFrame(cuadro)
  }
}

/** `true` cuando `window.scrollY` supera `umbral` (en el servidor, siempre `false`). */
export function useScrollPasado(umbral: number): boolean {
  return useSyncExternalStore(
    suscribir,
    () => window.scrollY > umbral,
    () => false,
  )
}
