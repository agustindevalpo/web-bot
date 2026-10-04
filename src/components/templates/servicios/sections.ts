import { SiteConfigDTO } from '@/application/dtos/SiteConfigDTO'
import { buildWhatsAppUrlConMensaje } from '@/components/templates/shared/enlaces'
import { nombreDeServicio, descripcionDeServicio, precioDeServicio } from '@/components/templates/shared/servicios'
import { comoHorarios } from '@/components/templates/shared/contenido'
import { MAX_ITEMS_BANDA } from '@/components/templates/shared/layoutBanda'
import type { ItemBanda } from '@/components/templates/shared/BandaDatos'

// Constructores puros de SERVICIOS sobre Bloques (S2). La marca, el hero, el
// bloque Nosotros y el contacto son los mismos que usa LANDING: sus builders
// se importan desde `landing/sections` (misma forma de config, mismo saneo
// defensivo) y acá solo viven los dos que son propios de esta plantilla: la
// banda de horarios y la lista de servicios con precio. Ninguno hace fetch ni
// toca el DOM, y todos toleran un config que solo trae `{ nombre }`.
export { buildMarca, buildInicio, buildNosotros, buildContacto } from '@/components/templates/landing/sections'

export const ROTULO_HORARIOS = 'Horarios'
const EYEBROW_SERVICIOS = 'Servicios'
const TITULO_CON_PRECIOS = 'Servicios y precios'
const TITULO_SIN_PRECIOS = 'Nuestros servicios'

function comoStringNoVacio(valor: unknown): string | null {
  return typeof valor === 'string' && valor.trim() !== '' ? valor : null
}

// Banda de horarios: el rango es el valor grande y el día su glosa. Con más de
// 3 entradas no hay banda (recortar mostraría una selección arbitraria): los
// horarios siguen completos en la tarjeta de Contacto. Con 0, tampoco.
export function buildHorariosBanda(config: SiteConfigDTO): ItemBanda[] {
  const horarios = comoHorarios(config.horarios)
  if (horarios.length === 0 || horarios.length > MAX_ITEMS_BANDA) return []
  return horarios.map(({ dia, rango }) => ({ valor: rango, etiqueta: dia }))
}

type FilaServicio = {
  // `null` con un solo servicio: un "01" sin "02" anuncia una serie que no existe.
  numero: string | null
  nombre: string
  descripcion: string | null
  // Texto libre, tal cual lo escribió el cliente. `null` → "Agendar →".
  precio: string | null
  // WhatsApp con el servicio precargado; `null` sin teléfono utilizable.
  whatsappUrl: string | null
}

export type ListaServiciosProps = {
  eyebrow: string
  titulo: string
  // Sube el nombre a 40px cuando ningún servicio trae descripción.
  hayDescripciones: boolean
  // Valor de `grid-template-columns` en escritorio.
  columnas: string
  filas: FilaServicio[]
}

// `72px` es la celda del número; la del precio (200px) existe siempre porque
// "Agendar →" la ocupa cuando no hay precio.
export function columnasLista(conNumero: boolean, hayDescripciones: boolean): string {
  const celdas = [conNumero ? '72px' : null, '1fr', hayDescripciones ? '1.15fr' : null, '200px']
  return celdas.filter((celda): celda is string => celda !== null).join(' ')
}

// Cero servicios utilizables → `null`: la sección no se renderiza y "Servicios"
// sale del nav (`filtrarSecciones`).
export function buildListaServicios(config: SiteConfigDTO): ListaServiciosProps | null {
  const entradas = Array.isArray(config.servicios) ? config.servicios : []
  const telefono = comoStringNoVacio(config.contacto?.telefono)

  const base: Omit<FilaServicio, 'numero'>[] = []
  for (const entrada of entradas) {
    const nombreCrudo = nombreDeServicio(entrada)
    const nombre = typeof nombreCrudo === 'string' ? nombreCrudo.trim() : ''
    if (nombre === '') continue
    base.push({
      nombre,
      descripcion: descripcionDeServicio(entrada),
      precio: precioDeServicio(entrada),
      whatsappUrl: telefono ? buildWhatsAppUrlConMensaje(telefono, `Hola, quiero agendar ${nombre}`) : null,
    })
  }
  if (base.length === 0) return null

  const unico = base.length === 1
  const hayDescripciones = base.some((fila) => fila.descripcion !== null)
  const hayPrecios = base.some((fila) => fila.precio !== null)

  return {
    eyebrow: EYEBROW_SERVICIOS,
    titulo: hayPrecios ? TITULO_CON_PRECIOS : TITULO_SIN_PRECIOS,
    hayDescripciones,
    columnas: columnasLista(!unico, hayDescripciones),
    filas: base.map((fila, indice) => ({ ...fila, numero: unico ? null : String(indice + 1).padStart(2, '0') })),
  }
}

// Nombres para el `<select>` del formulario de agenda.
export function nombresDeServicios(lista: ListaServiciosProps | null): string[] {
  return lista ? lista.filas.map((fila) => fila.nombre) : []
}

// Dónde monta index.tsx "El lugar". Sigue a la lista (orden del handoff); sin
// lista (cero servicios) la sección "Servicios" y su etiqueta del nav no
// existen (01-RESPUESTAS), así que las fotos van tras la banda dentro de
// 'inicio' en vez de reabrir "Servicios" solo para alojarlas.
export function ubicacionLugar(hayLista: boolean, hayLugar: boolean): 'servicios' | 'inicio' | null {
  if (!hayLugar) return null
  return hayLista ? 'servicios' : 'inicio'
}
