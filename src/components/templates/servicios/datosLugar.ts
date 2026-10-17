import { SiteConfigDTO } from '@/application/dtos/SiteConfigDTO'
import { esImagenPropia } from '@/domain/imagen/imagenesPropias'

// "El lugar" (S2-3, 02-SERVICIOS.md): fotos propias del negocio. Puro: la base
// pública de R2 llega por parámetro (la lee index.tsx del container) para que
// esto se pruebe sin env.

const TITULO_LUGAR = 'El lugar'
// Solo se usan las tres primeras fotos propias.
const MAX_FOTOS_LUGAR = 3

export type DisposicionLugar = 'una' | 'dos' | 'tres'

type FotoLugar = { src: string; alt: string }

export type LugarProps = {
  titulo: string
  ciudad: string | null
  disposicion: DisposicionLugar
  fotos: FotoLugar[]
  // Alto de las filas con dos fotos (480px por defecto). Solo lo fija quien lo cambia.
  altoDosPx?: number
}

// SERVICIOS usa los valores por defecto ("El lugar", desde 1 foto); RESTAURANTE
// pide "El local", mínimo 2 fotos propias y filas de 520px con dos fotos.
export type OpcionesLugar = {
  titulo?: string
  minimo?: number
  altoDosPx?: number
}

// `imagenes[0]` es el hero (y puede ser de banco como atmósfera, T9): nunca
// entra acá. De `imagenes[1..]` solo pasan las que sirve nuestro bucket (T9: un
// banco de fotos jamás aparece en una galería).
export function fotosPropiasLugar(imagenes: unknown, urlPublica: string | null): string[] {
  if (!Array.isArray(imagenes)) return []
  return imagenes.slice(1).filter((url): url is string => esImagenPropia(url, urlPublica))
}

export function disposicionLugar(cantidad: number): DisposicionLugar | null {
  if (cantidad <= 0) return null
  if (cantidad === 1) return 'una'
  if (cantidad === 2) return 'dos'
  return 'tres'
}

// Sin fotos propias → `null`: la sección no se renderiza.
export function buildLugar(config: SiteConfigDTO, urlPublica: string | null, opciones: OpcionesLugar = {}): LugarProps | null {
  const { titulo = TITULO_LUGAR, minimo = 1, altoDosPx } = opciones
  const propias = fotosPropiasLugar(config.imagenes, urlPublica).slice(0, MAX_FOTOS_LUGAR)
  if (propias.length < minimo) return null
  const disposicion = disposicionLugar(propias.length)
  if (!disposicion) return null

  const articulo = titulo.toLowerCase()
  const ciudad = typeof config.ciudad === 'string' && config.ciudad.trim() !== '' ? config.ciudad : null

  return {
    titulo,
    ciudad,
    disposicion,
    ...(altoDosPx !== undefined ? { altoDosPx } : null),
    fotos: propias.map((src, indice) => ({
      src,
      alt: propias.length === 1 ? `${config.nombre} — ${articulo}` : `${config.nombre} — ${articulo} ${indice + 1}`,
    })),
  }
}
