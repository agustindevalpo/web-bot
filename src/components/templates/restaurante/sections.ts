import { SiteConfigDTO } from '@/application/dtos/SiteConfigDTO'
import { normalizarCarta, type GrupoCarta, type PlatoCarta } from '@/application/shared/carta'
import { esImagenPropia, esPdfPropio } from '@/domain/imagen/imagenesPropias'
import { buildMailtoUrl, buildWhatsAppUrlConMensaje } from '@/components/templates/shared/enlaces'
import { buildLugar, type LugarProps } from '@/components/templates/servicios/datosLugar'
import { ubicacionLugar } from '@/components/templates/servicios/sections'
import { type CopyReserva, TEXTO_ESCRIBENOS } from './copy'

// Constructores puros de RESTAURANTE sobre Bloques (S4). Marca, inicio,
// Nosotros y contacto son los de LANDING; la banda de horarios y el reparto de
// "El lugar" son los de SERVICIOS. Acá viven la carta, el hero (forma con foto
// o tipográfica), "El local" y las acciones del hero. Ninguno hace fetch ni
// toca el DOM y todos toleran un config que solo trae `{ nombre }`.
export { buildMarca, buildInicio, buildNosotros, buildContacto } from '@/components/templates/landing/sections'
export { buildHorariosBanda, ROTULO_HORARIOS } from '@/components/templates/servicios/sections'

function comoStringNoVacio(valor: unknown): string | null {
  return typeof valor === 'string' && valor.trim() !== '' ? valor.trim() : null
}

// ── Carta ────────────────────────────────────────────────────────────────

const EYEBROW_CARTA = 'La carta'
const TITULO_CON_PRECIOS = 'Nuestra carta'
const TITULO_SIN_PRECIOS = 'Lo que preparamos'
const NOTA_CON_PRECIOS = 'Precios referenciales. Algunos platos varían según el día; confírmalos al reservar.'
const NOTA_MENU_DEL_DIA = 'Pregunta por el menú del día al reservar.'
export const TEXTO_ENLACE_CARTA = 'Reserva o pide por WhatsApp →'
export const TEXTO_ENLACE_PDF = 'Ver la carta completa (PDF)'
const MENSAJE_CARTA = 'Hola, quiero hacer una consulta sobre la carta.'

export type FormaCarta = 'guias' | 'grande'

export type CartaVista = {
  eyebrow: string
  titulo: string
  forma: FormaCarta
  grupos: GrupoCarta[]
  // Solo en la forma con guías y sin categorías: ya repartidos en 1 o 2 columnas.
  columnasSinCategorias: PlatoCarta[][] | null
  hayCategorias: boolean
  totalPlatos: number
  // Pie de la carta (izquierda): `null` si no aplica.
  nota: string | null
  // Pie de la carta (derecha): `null` sin teléfono utilizable.
  enlaceWhatsapp: string | null
  // Carta completa en PDF (R6): solo si `cartaPdf` es un archivo propio.
  // Complementa la carta armada; nunca la reemplaza ni la resucita.
  enlacePdf: string | null
}

// Sin platos utilizables → `null`: la sección no se renderiza y "Carta" sale
// del nav (`filtrarSecciones`).
export function buildCarta(config: SiteConfigDTO, urlPublica: string | null = null): CartaVista | null {
  const carta = normalizarCarta(config.menu, config.servicios)
  if (!carta) return null
  const telefono = comoStringNoVacio(config.contacto?.telefono)

  return {
    eyebrow: EYEBROW_CARTA,
    titulo: carta.conPrecios ? TITULO_CON_PRECIOS : TITULO_SIN_PRECIOS,
    forma: carta.conPrecios ? 'guias' : 'grande',
    grupos: carta.grupos,
    columnasSinCategorias: carta.columnasSinCategorias,
    hayCategorias: carta.hayCategorias,
    totalPlatos: carta.totalPlatos,
    nota: carta.conPrecios ? NOTA_CON_PRECIOS : carta.notaMenuDelDia ? NOTA_MENU_DEL_DIA : null,
    enlaceWhatsapp: telefono ? buildWhatsAppUrlConMensaje(telefono, MENSAJE_CARTA) : null,
    enlacePdf: esPdfPropio(config.cartaPdf, urlPublica) ? (config.cartaPdf as string) : null,
  }
}

// ── Hero ─────────────────────────────────────────────────────────────────

// P2: el hero de RESTAURANTE usa foto solo si `imagenes[0]` es propia (servida
// por nuestro bucket). Una foto de banco simularía los platos o el comedor de
// este local, así que sin foto propia el hero es el tipográfico.
export function fotoHeroPropia(imagenes: unknown, urlPublica: string | null): string | null {
  if (!Array.isArray(imagenes)) return null
  const primera: unknown = imagenes[0]
  return typeof primera === 'string' && esImagenPropia(primera, urlPublica) ? primera : null
}

export type DatoHero = { rotulo: string; valor: string }

export function textoPlatos(cantidad: number): string {
  return cantidad === 1 ? '1 plato' : `${cantidad} platos`
}

// Fila de datos del hero tipográfico. No inventa nada: cada celda existe solo
// si su dato existe. La cantidad de celdas fija las columnas de la grilla.
export function buildDatosHero(config: SiteConfigDTO, carta: CartaVista | null, copy: CopyReserva): DatoHero[] {
  const datos: DatoHero[] = []
  const donde = comoStringNoVacio(config.contacto?.direccion) ?? comoStringNoVacio(config.ciudad)
  if (donde) datos.push({ rotulo: 'Dónde', valor: donde })
  const telefono = comoStringNoVacio(config.contacto?.telefono)
  if (telefono) datos.push({ rotulo: copy.rotuloDatoHero, valor: telefono })
  if (carta) datos.push({ rotulo: 'La carta', valor: textoPlatos(carta.totalPlatos) })
  return datos
}

export type AccionHero = { texto: string; href: string; interno: boolean }

export type AccionesHero = { primaria: AccionHero | null; secundaria: AccionHero | null }

// Primario: lleva al formulario (`#reservas`); sin teléfono ese formulario no
// existe y el botón pasa a "Escríbenos" con `mailto:`. Secundario: la carta,
// que se omite si no hay carta.
export function buildAccionesHero(config: SiteConfigDTO, carta: CartaVista | null, copy: CopyReserva): AccionesHero {
  const telefono = comoStringNoVacio(config.contacto?.telefono)
  const email = comoStringNoVacio(config.contacto?.email)
  const mailto = email ? buildMailtoUrl(email) : null

  let primaria: AccionHero | null = null
  if (telefono) primaria = { texto: copy.ctaHeroPrimario, href: '#reservas', interno: true }
  else if (mailto) primaria = { texto: TEXTO_ESCRIBENOS, href: mailto, interno: true }

  return { primaria, secundaria: carta ? { texto: 'Ver la carta', href: '#carta', interno: true } : null }
}

// ── El local ─────────────────────────────────────────────────────────────

const TITULO_LOCAL = 'El local'
const MINIMO_FOTOS_LOCAL = 2
const ALTO_DOS_FOTOS_LOCAL = 520

// "El local": mínimo 2 fotos propias en `imagenes[1..]`. Una foto sola se ve
// como una galería rota, así que 0 o 1 → `null`.
export function buildLocal(config: SiteConfigDTO, urlPublica: string | null): LugarProps | null {
  return buildLugar(config, urlPublica, { titulo: TITULO_LOCAL, minimo: MINIMO_FOTOS_LOCAL, altoDosPx: ALTO_DOS_FOTOS_LOCAL })
}

// Dónde monta index.tsx "El local". Sigue a la carta; sin carta (la sección y su
// etiqueta del nav no existen) va tras la banda dentro de 'inicio', en vez de
// reabrir "Carta" solo para alojarlo. Misma regla que "El lugar" de SERVICIOS.
export function ubicacionLocal(hayCarta: boolean, hayLocal: boolean): 'carta' | 'inicio' | null {
  const ubicacion = ubicacionLugar(hayCarta, hayLocal)
  return ubicacion === 'servicios' ? 'carta' : ubicacion
}
