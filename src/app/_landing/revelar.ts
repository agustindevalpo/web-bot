// Reveal-on-scroll: cada sección se observa una sola vez y, al entrar en
// pantalla, sus elementos marcados con `data-r` entran con `wbUp` (page.module.css)
// escalonados 90 ms. Sin JS o con movimiento reducido el contenido ya está visible.

export const REVEAL_UMBRAL = 0.1
export const REVEAL_ESCALON_MS = 90
export const ATRIBUTO_ELEMENTO = 'data-r'
export const ATRIBUTO_ACTIVO = 'data-rv'

interface ElementoRevelable {
  setAttribute(nombre: string, valor: string): void
  style: { setProperty(nombre: string, valor: string): void }
}

interface Contenedor {
  querySelectorAll(selector: string): ArrayLike<ElementoRevelable>
}

/** Dispara la animación de entrada de los `[data-r]` de `seccion`, en orden. */
export function revelarSeccion(seccion: Contenedor): void {
  Array.from(seccion.querySelectorAll(`[${ATRIBUTO_ELEMENTO}]`)).forEach((el, i) => {
    el.style.setProperty('--r-delay', `${i * REVEAL_ESCALON_MS}ms`)
    el.setAttribute(ATRIBUTO_ACTIVO, '')
  })
}
