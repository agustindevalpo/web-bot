import { SiteConfigDTO } from '@/application/dtos/SiteConfigDTO'
import { rubroVisible } from '@/components/templates/shared/rubroVisible'
import { buildTelUrl, buildMailtoUrl, buildInstagramUrl } from '@/components/templates/shared/enlaces'
import { comoHorarios, comoLegal, type DatosLegales, type Horario } from '@/components/templates/shared/contenido'
import { obtenerIniciales } from '@/components/templates/shared/iniciales'
import { altosLogo, altoLogoMovilPie, comoDimensionesLogo, esLogotipo, type DimensionesLogo } from '@/components/templates/shared/logoOptico'

// Datos puros del pie Bloques (T3, T4, T7). Nada acá toca el DOM ni lanza con
// un config que solo trae `{ nombre }`. Vive en `pieBloques.ts` (no
// `footerBloques.ts`) para no chocar por mayúsculas con `FooterBloques.tsx`
// en Windows.

// T3 "Fondos oscuros": el logo del pie mide el 80% del alto del logo de la
// cabecera (S2 dibuja 132x44 como 106x35).
const FACTOR_LOGO_PIE = 0.8
const ALTO_LOGO_PIE_SIN_DIMENSIONES = 35
export const ANCHO_MAX_LOGO_PIE_SIN_DIMENSIONES = 180

export type AltosLogoPie = { escritorio: number; movil: number }

export function altosLogoPie(dimensiones: DimensionesLogo | null): AltosLogoPie {
  if (!dimensiones) return { escritorio: ALTO_LOGO_PIE_SIN_DIMENSIONES, movil: ALTO_LOGO_PIE_SIN_DIMENSIONES }
  // Móvil: la cabecera ahora topa en 34px, pero el pie conserva la fórmula
  // anterior (tope 46, 01-RESPUESTAS...): sobre la placa blanca no hay
  // restricción de alto, así que el pie no cambia.
  return {
    escritorio: Math.round(altosLogo(dimensiones).escritorio * FACTOR_LOGO_PIE),
    movil: Math.round(altoLogoMovilPie(dimensiones) * FACTOR_LOGO_PIE),
  }
}

function comoTexto(valor: unknown): string | null {
  return typeof valor === 'string' && valor.trim() !== '' ? valor.trim() : null
}

// "{Rubro} en {ciudad}." omitiendo la parte que falta, más los horarios como
// texto simple ("Lunes 9:00 a 18:00, Sábado 10:00 a 14:00."). `null` si no
// queda nada que decir.
export function glosaPie(rubro: string | null, ciudad: string | null, horarios: Horario[]): string | null {
  const rubroTexto = rubro ? rubroVisible(rubro) : null
  const oraciones: string[] = []
  if (rubroTexto && ciudad) oraciones.push(`${rubroTexto} en ${ciudad}.`)
  else if (rubroTexto) oraciones.push(`${rubroTexto}.`)
  else if (ciudad) oraciones.push(`${ciudad}.`)
  if (horarios.length > 0) oraciones.push(`${horarios.map(({ dia, rango }) => `${dia} ${rango}`).join(', ')}.`)
  return oraciones.length > 0 ? oraciones.join(' ') : null
}

// T7: con razón social y RUT, `© {año} {razonSocial} · RUT {rut}`; si no,
// `© {año} {nombre}`. Nunca la mitad de los datos legales.
export function lineaLegal(legal: DatosLegales | null, nombre: string, anio: number): string {
  return legal ? `© ${anio} ${legal.razonSocial} · RUT ${legal.rut}` : `© ${anio} ${nombre}`
}

export type EnlaceContactoPie = { texto: string; href: string; externo: boolean }

function instagramDeRedes(valor: unknown): EnlaceContactoPie | null {
  const crudo = comoTexto(valor)
  if (!crudo) return null
  const url = buildInstagramUrl(crudo)
  const handle = url.slice(url.lastIndexOf('/') + 1)
  return handle ? { texto: `@${handle}`, href: url, externo: true } : null
}

export type PieBloquesProps = {
  nombre: string
  iniciales: string
  logo: { src: string; ancho: number; alto: number; conDimensiones: boolean } | null
  altosLogo: AltosLogoPie
  mostrarNombre: boolean
  glosa: string | null
  contacto: EnlaceContactoPie[]
  legal: string
}

export function construirPie(config: SiteConfigDTO, anio: number): PieBloquesProps {
  const nombre = comoTexto(config.nombre) ?? ''
  const dimensiones = comoDimensionesLogo(config.logoDimensiones)
  const src = comoTexto(config.logo)
  const rubro = comoTexto(config.rubro)
  const telefono = comoTexto(config.contacto?.telefono)
  const email = comoTexto(config.contacto?.email)
  const mailto = email ? buildMailtoUrl(email) : null

  const contacto: EnlaceContactoPie[] = []
  if (telefono) contacto.push({ texto: telefono, href: buildTelUrl(telefono), externo: false })
  if (email && mailto) contacto.push({ texto: email, href: mailto, externo: false })
  const instagram = instagramDeRedes(config.redes?.instagram)
  if (instagram) contacto.push(instagram)

  return {
    nombre,
    iniciales: obtenerIniciales(nombre),
    logo: src
      ? {
          src,
          ancho: dimensiones?.ancho ?? ANCHO_MAX_LOGO_PIE_SIN_DIMENSIONES,
          alto: dimensiones?.alto ?? ALTO_LOGO_PIE_SIN_DIMENSIONES,
          conDimensiones: dimensiones !== null,
        }
      : null,
    altosLogo: altosLogoPie(dimensiones),
    mostrarNombre: !(src && dimensiones && esLogotipo(dimensiones)),
    glosa: glosaPie(rubro && rubro !== 'demo' ? rubro : null, comoTexto(config.ciudad), comoHorarios(config.horarios)),
    contacto,
    legal: lineaLegal(comoLegal(config.legal), nombre, anio),
  }
}
