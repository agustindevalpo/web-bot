import { SiteConfigDTO } from '@/application/dtos/SiteConfigDTO'
import { comoPartesNosotros, comoAutorHighlight, type ParteNosotros, type AutorHighlight } from './contenido'

// Datos del bloque Nosotros (Bloques, README "Bloque Nosotros"), puros y
// compartidos: LANDING hoy, SERVICIOS y el resto después. Nunca devuelve null:
// el caso base usa `nombre` (siempre presente), así que ningún sitio se queda
// sin el ancla de color y "Nosotros" no desaparece del nav (T5.3).

export type LayoutNosotros = 'columna' | 'fila' | 'dos'

// La condición es una sola (README, "Cadena de degradación"): 3 tarjetas →
// dos columnas; 1-2 → una columna con las tarjetas en fila; 0 → una columna
// centrada. Es el mismo bloque creciendo, no tres variantes.
export function layoutNosotros(tarjetas: number): LayoutNosotros {
  if (tarjetas >= 3) return 'dos'
  if (tarjetas >= 1) return 'fila'
  return 'columna'
}

export type NosotrosProps = {
  titulo: string
  texto: string | null
  tarjetas: ParteNosotros[]
  // Cita de cierre (C3): sin frase no hay cita; sin autor, la cita sale sin firma.
  frase: string | null
  autor: AutorHighlight | null
}

function texto(valor: unknown): string | null {
  return typeof valor === 'string' && valor.trim() !== '' ? valor.trim() : null
}

// `frase` entra aparte porque cada plantilla decide de dónde la lee (LANDING:
// `buildHighlight`). El párrafo es `sobreNosotros` y, sin él, `descripcion`.
export function construirNosotros(config: SiteConfigDTO, frase: string | null): NosotrosProps {
  const nombre = texto(config.nombre) ?? ''
  const ciudad = texto(config.ciudad)
  const frasePropia = texto(frase)

  return {
    titulo: ciudad ? `${nombre} en ${ciudad}` : nombre,
    texto: texto(config.sobreNosotros) ?? texto(config.descripcion),
    tarjetas: comoPartesNosotros(config.sobreNosotrosPartes),
    frase: frasePropia,
    autor: frasePropia ? comoAutorHighlight(config.highlightAutor) : null,
  }
}
